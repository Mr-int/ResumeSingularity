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
    const [activeCardIndex, setActiveCardIndex] = useState(0);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [listWrapperStyle, setListWrapperStyle] = useState({});

    const searchInputRef = useRef(null);
    const listWrapperRef = useRef(null);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                const data = await getAllStudents();
                setStudents(data);
                if (data.length > 0) {
                    setActiveCardIndex(0);
                }
            } catch (error) {
                console.error('Failed to fetch students:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, []);

    useEffect(() => {
        const updatePosition = () => {
            if (!listWrapperRef.current || students.length === 0) return;

            const wrapper = listWrapperRef.current;
            const activeIndex = activeCardIndex % students.length;
            const activeContainer = wrapper.children[activeIndex];

            if (activeContainer) {
                const wrapperRect = wrapper.getBoundingClientRect();
                const activeRect = activeContainer.getBoundingClientRect();
                const offset = (wrapperRect.width / 2) - (activeRect.width / 2) - activeRect.left + wrapperRect.left;

                setListWrapperStyle({
                    transform: `translateX(${offset}px)`
                });
            }
        };

        requestAnimationFrame(updatePosition);
        window.addEventListener('resize', updatePosition);
        return () => window.removeEventListener('resize', updatePosition);
    }, [activeCardIndex, students]);

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
        if (students.length === 0) return;

        setActiveCardIndex((prev) => {
            if (prev === 0) {
                return students.length - 1;
            }
            return prev - 1;
        });
    };

    const handleNextClick = () => {
        if (students.length === 0) return;

        setActiveCardIndex((prev) => {
            if (prev === students.length - 1) {
                return 0;
            }
            return prev + 1;
        });
    };

    const handleCardClick = (index) => {
        setActiveCardIndex(index);
    };

    const getDisplayedStudents = () => {
        if (students.length === 0) return [];

        const total = students.length;
        const currentIndex = activeCardIndex % total;

        const indexes = [];
        for (let i = -2; i <= 2; i++) {
            let index = currentIndex + i;
            if (index < 0) index = total + index;
            if (index >= total) index = index % total;
            indexes.push(index);
        }

        return indexes.map(index => ({
            student: students[index],
            originalIndex: index,
            displayIndex: indexes.indexOf(index)
        }));
    };

    const displayedStudents = getDisplayedStudents();
    const activeStudent = students.length > 0 ? students[activeCardIndex] : null;

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

                    <button
                        className={`studentSlider__filter`}
                    >
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
                                    {displayedStudents.map((item, displayIndex) => {
                                        const isActive = item.originalIndex === activeCardIndex;
                                        return (
                                            <div
                                                key={`${item.originalIndex}-${activeCardIndex}`}
                                                className={`studentSlider__cardContainer ${isActive ? 'active' : ''}`}
                                            >
                                                <StudentSliderCard
                                                    student={item.student}
                                                    isActive={isActive}
                                                    onClick={() => handleCardClick(item.originalIndex)}
                                                />
                                            </div>
                                        );
                                    })}
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