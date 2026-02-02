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
            const wrapperRect = wrapper.getBoundingClientRect();
            const activeContainer = wrapper.children[activeCardIndex % students.length];

            if (activeContainer) {
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
        if (students.length > 0) {
            setActiveCardIndex((prev) => prev - 1);
        }
    };

    const handleNextClick = () => {
        if (students.length > 0) {
            setActiveCardIndex((prev) => prev + 1);
        }
    };

    const handleCardClick = (index) => {
        setActiveCardIndex(index);
    };

    const displayedStudents = students;
    const activeStudent = students.length > 0 ? students[activeCardIndex % students.length] : null;

    const renderedCards = students.length > 0 ? (
        Array.from({ length: Math.max(5, students.length) }, (_, i) => {
            const studentIndex = (activeCardIndex + i - 2 + students.length) % students.length;
            return (
                <div
                    key={`card-${studentIndex}-${i}`}
                    className={`studentSlider__cardContainer ${i === 2 ? 'active' : ''}`}
                >
                    <StudentSliderCard
                        student={students[studentIndex]}
                        isActive={i === 2}
                        onClick={() => handleCardClick(activeCardIndex + i - 2)}
                    />
                </div>
            );
        })
    ) : null;

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

                    <button className="studentSlider__filter">
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
                                    {renderedCards}
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
