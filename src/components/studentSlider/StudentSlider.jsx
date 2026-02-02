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
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [slideDirection, setSlideDirection] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const animationRef = useRef(null);

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

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    const getVisibleCards = () => {
        if (students.length === 0) return [];

        const visibleCards = [];
        const totalCards = Math.min(5, students.length);

        for (let i = -2; i <= 2; i++) {
            let cardIndex = activeIndex + i;

            if (cardIndex < 0) {
                cardIndex = students.length + cardIndex;
            } else if (cardIndex >= students.length) {
                cardIndex = cardIndex % students.length;
            }

            if (cardIndex >= 0 && cardIndex < students.length) {
                visibleCards.push({
                    student: students[cardIndex],
                    position: i,
                    isActive: i === 0
                });
            }
        }

        return visibleCards;
    };

    const shiftCards = (direction) => {
        if (isAnimating || students.length === 0) return;

        setIsAnimating(true);
        setSlideDirection(direction);

        let newIndex;
        if (direction === 'prev') {
            newIndex = activeIndex === 0 ? students.length - 1 : activeIndex - 1;
        } else {
            newIndex = (activeIndex + 1) % students.length;
        }

        setActiveIndex(newIndex);

        setTimeout(() => {
            setIsAnimating(false);
            setSlideDirection(null);
        }, 300);
    };

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
        shiftCards('prev');
    };

    const handleNextClick = () => {
        shiftCards('next');
    };

    const handleCardClick = (position) => {
        if (isAnimating || position === 0) return;

        if (position < 0) {
            handlePrevClick();
        } else if (position > 0) {
            handleNextClick();
        }
    };

    const activeStudent = students.length > 0 ? students[activeIndex] : null;
    const visibleCards = getVisibleCards();

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
                                <button
                                    className="studentSlider__listButton desktop-only"
                                    onClick={handlePrevClick}
                                    disabled={isAnimating}
                                >
                                    <img src={sliderArrowIcon} alt="Предыдущий"/>
                                </button>

                                <div
                                    className={`studentSlider__listWrapper ${
                                        slideDirection === 'prev' ? 'sliding-left' :
                                            slideDirection === 'next' ? 'sliding-right' : ''
                                    }`}
                                    ref={listWrapperRef}
                                >
                                    {visibleCards.map((card, index) => (
                                        <div
                                            key={`${card.student.id}-${index}`}
                                            className={`studentSlider__cardContainer ${card.isActive ? 'active' : ''}`}
                                            onClick={() => handleCardClick(card.position)}
                                        >
                                            <StudentSliderCard
                                                student={card.student}
                                                isActive={card.isActive}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <button
                                    className="studentSlider__listButton desktop-only"
                                    onClick={handleNextClick}
                                    disabled={isAnimating}
                                >
                                    <img src={sliderArrowIcon} alt="Следующий" className="rotateRight"/>
                                </button>
                            </div>

                            <div className="studentSlider__mobileControls">
                                <button
                                    className="studentSlider__mobileButton"
                                    onClick={handlePrevClick}
                                    disabled={isAnimating}
                                >
                                    <img src={sliderArrowIcon} alt="Предыдущий"/>
                                </button>
                                <button
                                    className="studentSlider__mobileButton"
                                    onClick={handleNextClick}
                                    disabled={isAnimating}
                                >
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