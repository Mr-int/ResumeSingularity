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
    const [displayedStudents, setDisplayedStudents] = useState([]);
    const [isAnimating, setIsAnimating] = useState(false);

    const searchInputRef = useRef(null);
    const animationTimeoutRef = useRef(null);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                const data = await getAllStudents();
                setStudents(data);
                if (data.length > 0) {
                    const totalToShow = Math.min(5, data.length);
                    const middleIndex = Math.floor(totalToShow / 2);
                    setActiveCardIndex(middleIndex);

                    const cyclicArray = [];
                    for (let i = 0; i < totalToShow; i++) {
                        cyclicArray.push(data[i]);
                    }

                    const extended = [
                        data[totalToShow - 1],
                        ...cyclicArray,
                        data[0]
                    ];
                    setDisplayedStudents(extended);
                }
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

    const handlePrevClick = () => {
        if (students.length === 0 || isAnimating) return;

        setIsAnimating(true);
        const totalToShow = Math.min(5, students.length);

        setActiveCardIndex(prev => {
            let newIndex = prev - 1;

            if (newIndex < 0) {
                newIndex = totalToShow - 1;
            }

            return newIndex;
        });

        animationTimeoutRef.current = setTimeout(() => {
            setIsAnimating(false);
        }, 300);
    };

    const handleNextClick = () => {
        if (students.length === 0 || isAnimating) return;

        setIsAnimating(true);
        const totalToShow = Math.min(5, students.length);

        setActiveCardIndex(prev => {
            let newIndex = prev + 1;

            if (newIndex >= totalToShow) {
                newIndex = 0;
            }

            return newIndex;
        });

        animationTimeoutRef.current = setTimeout(() => {
            setIsAnimating(false);
        }, 300);
    };

    const handleCardClick = (index) => {
        if (isAnimating) return;
        setActiveCardIndex(index);
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

    const getActiveStudent = () => {
        if (students.length === 0) return null;
        return students[activeCardIndex];
    };

    const activeStudent = getActiveStudent();
    const totalToShow = Math.min(5, students.length);

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

                                <div className="studentSlider__listWrapper">
                                    {displayedStudents.map((student, index) => {
                                        const isActive = index === activeCardIndex + 1;
                                        const isClickable = index > 0 && index <= totalToShow;

                                        return (
                                            <div
                                                key={`${student.id}-${index}`}
                                                className={`studentSlider__cardContainer ${isActive ? 'active' : ''} ${isAnimating ? 'animating' : ''}`}
                                                onClick={() => isClickable && handleCardClick(index - 1)}
                                            >
                                                <StudentSliderCard
                                                    student={student}
                                                    isActive={isActive}
                                                    onClick={() => isClickable && handleCardClick(index - 1)}
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