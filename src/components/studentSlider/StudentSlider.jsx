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
    const [animations, setAnimations] = useState({});
    const [isAnimating, setIsAnimating] = useState(false);
    const animationTimeoutRef = useRef(null);

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
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
            }
        };
    }, []);

    // Определяем позиции карточек
    const getCardPositions = () => {
        const positions = [];

        if (students.length === 0) return positions;

        // Центральная карточка (активная)
        positions.push({
            index: activeIndex,
            position: 'active'
        });

        // Левая карточка
        const leftIndex = activeIndex > 0 ? activeIndex - 1 : students.length - 1;
        positions.push({
            index: leftIndex,
            position: 'prev-card'
        });

        // Правая карточка
        const rightIndex = activeIndex < students.length - 1 ? activeIndex + 1 : 0;
        positions.push({
            index: rightIndex,
            position: 'next-card'
        });

        // Крайняя левая карточка
        const farLeftIndex = leftIndex > 0 ? leftIndex - 1 : students.length - 1;
        if (farLeftIndex !== activeIndex && farLeftIndex !== rightIndex) {
            positions.push({
                index: farLeftIndex,
                position: 'far-left'
            });
        }

        // Крайняя правая карточка
        const farRightIndex = rightIndex < students.length - 1 ? rightIndex + 1 : 0;
        if (farRightIndex !== activeIndex && farRightIndex !== leftIndex && positions.length < 5) {
            positions.push({
                index: farRightIndex,
                position: 'far-right'
            });
        }

        return positions;
    };

    const shiftCards = (direction) => {
        if (isAnimating || students.length === 0) return;

        setIsAnimating(true);
        setSlideDirection(direction);

        // Определяем новые анимации для карточек
        const newAnimations = {};
        const positions = getCardPositions();

        positions.forEach(card => {
            if (direction === 'prev') {
                if (card.position === 'active') {
                    newAnimations[card.index] = 'become-active-left';
                } else if (card.position === 'prev-card') {
                    newAnimations[card.index] = 'slide-out-left';
                } else if (card.position === 'next-card') {
                    newAnimations[card.index] = 'slide-in-right';
                } else if (card.position === 'far-left') {
                    newAnimations[card.index] = 'slide-in-left';
                }
            } else if (direction === 'next') {
                if (card.position === 'active') {
                    newAnimations[card.index] = 'become-active-right';
                } else if (card.position === 'prev-card') {
                    newAnimations[card.index] = 'slide-in-left';
                } else if (card.position === 'next-card') {
                    newAnimations[card.index] = 'slide-out-right';
                } else if (card.position === 'far-right') {
                    newAnimations[card.index] = 'slide-in-right';
                }
            }
        });

        setAnimations(newAnimations);

        // Обновляем активный индекс после небольшой задержки
        setTimeout(() => {
            let newIndex;
            if (direction === 'prev') {
                newIndex = activeIndex > 0 ? activeIndex - 1 : students.length - 1;
            } else {
                newIndex = activeIndex < students.length - 1 ? activeIndex + 1 : 0;
            }
            setActiveIndex(newIndex);
        }, 100);

        // Сбрасываем анимации
        if (animationTimeoutRef.current) {
            clearTimeout(animationTimeoutRef.current);
        }
        animationTimeoutRef.current = setTimeout(() => {
            setAnimations({});
            setSlideDirection(null);
            setIsAnimating(false);
        }, 500);
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
        if (isAnimating) return;

        if (position === 'prev-card') {
            handlePrevClick();
        } else if (position === 'next-card') {
            handleNextClick();
        }
    };

    const activeStudent = students.length > 0 ? students[activeIndex] : null;
    const cardPositions = getCardPositions();

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

                                <div className="studentSlider__listWrapper" ref={listWrapperRef}>
                                    {cardPositions.map((card, idx) => {
                                        const student = students[card.index];
                                        const animationClass = animations[card.index] || '';

                                        return (
                                            <div
                                                key={`${student.id}-${idx}`}
                                                className={`studentSlider__cardContainer ${card.position} ${animationClass}`}
                                                onClick={() => handleCardClick(card.position)}
                                            >
                                                <StudentSliderCard
                                                    student={student}
                                                    isActive={card.position === 'active'}
                                                />
                                            </div>
                                        );
                                    })}
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