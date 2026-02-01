import React, { useState, useEffect, useRef } from 'react';
import './studentSlider.css';
import filterIcon from "../../assets/icons/filterIcon.svg";
import sliderArrowIcon from "../../assets/icons/sliderArrowIcon.svg";
import StudentSliderCard from "./studentSliderCard/StudentSliderCard.jsx";
import StudentsListCard from "../studentsList/StudentsListCard/StudentsListCard.jsx";
import searchIcon from "../../assets/icons/searchIcon.svg";
import { getAllStudents } from "../../services/studentApi.js";
import { Link } from "react-router-dom";

const StudentSlider = () => {
    const [searchValue, setSearchValue] = useState('');
    const [activeCardIndex, setActiveCardIndex] = useState(2);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [listWrapperStyle, setListWrapperStyle] = useState({});
    const [isTransitioning, setIsTransitioning] = useState(false);

    const searchInputRef = useRef(null);
    const listWrapperRef = useRef(null);
    const transitionTimeoutRef = useRef(null);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                const data = await getAllStudents();
                setStudents(data);
                if (data.length > 0) {
                    const middleIndex = Math.min(2, Math.floor(data.slice(0, 5).length / 2));
                    setActiveCardIndex(middleIndex);
                }
            } catch (error) {
                console.error('Failed to fetch students:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
        return () => {
            if (transitionTimeoutRef.current) {
                clearTimeout(transitionTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const updatePosition = () => {
            if (!listWrapperRef.current || students.slice(0, 5).length === 0) return;

            const wrapper = listWrapperRef.current;
            const activeIndex = Math.min(activeCardIndex, students.slice(0, 5).length - 1);
            const activeContainer = wrapper.children[activeIndex];

            if (activeContainer) {
                const wrapperRect = wrapper.getBoundingClientRect();
                const activeRect = activeContainer.getBoundingClientRect();
                const offset = (wrapperRect.width / 2) - (activeRect.width / 2) - activeRect.left + wrapperRect.left;

                setListWrapperStyle({
                    transform: `translateX(${offset}px)`,
                    transition: isTransitioning ? 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
                });
            }
        };

        requestAnimationFrame(updatePosition);
        window.addEventListener('resize', updatePosition);
        return () => window.removeEventListener('resize', updatePosition);
    }, [activeCardIndex, students, isTransitioning]);

    const handleSearchChange = (e) => {
        setSearchValue(e.target.value);
    }

    const handleSearchClick = () => {
        if (window.innerWidth <= 480) {
            setIsSearchExpanded(true);
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        }
    }

    const handleSearchBlur = () => {
        if (window.innerWidth <= 480 && searchValue === '') {
            setIsSearchExpanded(false);
        }
    }

    const handlePrevClick = () => {
        if (students.length === 0 || isTransitioning) return;

        setIsTransitioning(true);

        setActiveCardIndex((prev) => {
            const maxIndex = Math.min(students.length - 1, 4);
            const newIndex = prev === 0 ? maxIndex : prev - 1;
            return newIndex;
        });

        transitionTimeoutRef.current = setTimeout(() => {
            setIsTransitioning(false);
        }, 500);
    };

    const handleNextClick = () => {
        if (students.length === 0 || isTransitioning) return;

        setIsTransitioning(true);

        setActiveCardIndex((prev) => {
            const maxIndex = Math.min(students.length - 1, 4);
            const newIndex = prev === maxIndex ? 0 : prev + 1;
            return newIndex;
        });

        transitionTimeoutRef.current = setTimeout(() => {
            setIsTransitioning(false);
        }, 500);
    };

    const handleCardClick = (index) => {
        if (isTransitioning) return;
        setActiveCardIndex(index);
    };

    const displayedStudents = students.slice(0, 5);
    const activeStudent = displayedStudents.length > 0 ? displayedStudents[activeCardIndex] : null;

    return (
        <section className="studentSlider">
            <div className="studentSlider__content">
                <div className="studentSlider__header">
                    <div className="studentSlider__inputWrapper">
                        <input
                            ref={searchInputRef}
                            placeholder="Поиск"
                            type="text"
                            className={`studentSlider__search ${isSearchExpanded ? 'search-expanded' : ''}`}
                            value={searchValue}
                            onChange={handleSearchChange}
                            onClick={handleSearchClick}
                            onBlur={handleSearchBlur}
                            disabled
                        />
                    </div>

                    <h2 className="studentSlider__title">Студенты</h2>

                    <button className={`studentSlider__filter`}>
                        <span>Фильтр</span>
                        <img src={filterIcon} alt="Фильтр"/>
                    </button>
                </div>

                {loading ? (
                    <p style={{color: '#fff'}}>Загрузка студентов...</p>
                ) : students.length > 0 ? (
                    <>
                        <div className="studentSlider__container">
                            <div className="studentSlider__list">
                                <button className="studentSlider__listButton desktop-only" onClick={handlePrevClick}>
                                    <img src={sliderArrowIcon} alt="Предыдущий"/>
                                </button>

                                <div className="studentSlider__listWrapper" ref={listWrapperRef} style={listWrapperStyle}>
                                    {displayedStudents.map((student, index) => (
                                        <div
                                            key={student.id}
                                            className={`studentSlider__cardContainer ${index === activeCardIndex ? 'active' : ''}`}
                                        >
                                            <StudentSliderCard
                                                student={student}
                                                isActive={index === activeCardIndex}
                                                onClick={() => handleCardClick(index)}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <button className="studentSlider__listButton desktop-only" onClick={handleNextClick}>
                                    <img src={sliderArrowIcon} alt="Следующий" className="rotateRight"/>
                                </button>
                            </div>

                            <div className="studentSlider__mobileControls">
                                <button className="studentSlider__mobileButton" onClick={handlePrevClick}>
                                    <img src={sliderArrowIcon} alt="Предыдущий"/>
                                </button>
                                <button className="studentSlider__mobileButton" onClick={handleNextClick}>
                                    <img src={sliderArrowIcon} alt="Следующий" className="rotateRight"/>
                                </button>
                            </div>
                        </div>

                        <div className="studentSlider__listInfo">
                            {activeStudent && <StudentsListCard student={activeStudent} />}
                        </div>

                        <Link to="/students" className="studentSlider__button">
                            Смотреть всех студентов
                            <img
                                src={searchIcon}
                                alt="Иконка поиска"
                                className="button__icon"
                                width="20px"
                                height="20px"
                            />
                        </Link>
                    </>
                ) : (
                    <p style={{color: '#fff'}}>Для показа студентов ты должен быть авторизован :(</p>
                )}
            </div>
        </section>
    );
};

export default StudentSlider;