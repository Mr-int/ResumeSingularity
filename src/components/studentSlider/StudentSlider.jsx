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
    const [visibleCards, setVisibleCards] = useState([]);
    const [direction, setDirection] = useState(null); // 'prev' | 'next' | null
    const [slideKey, setSlideKey] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    const searchInputRef = useRef(null);
    const animationTimeoutRef = useRef(null);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                const data = await getAllStudents();
                setStudents(data);

                if (data.length > 0) {
                    const middleIndex = Math.floor(data.length / 2);
                    setActiveCardIndex(middleIndex);
                    updateVisibleCards(data, middleIndex);
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

    const updateVisibleCards = (studentsArray, centerIndex) => {
        const total = studentsArray.length;
        if (total === 0) {
            setVisibleCards([]);
            return;
        }

        const cards = [];
        for (let offset = -2; offset <= 2; offset++) {
            const idx = (centerIndex + offset + total) % total;
            cards.push(studentsArray[idx]);
        }
        setVisibleCards(cards);
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

    const ANIMATION_DURATION = 550;

    const triggerDirectionReset = (dir) => {
        setDirection(dir);
        if (animationTimeoutRef.current) {
            clearTimeout(animationTimeoutRef.current);
        }
        animationTimeoutRef.current = setTimeout(() => {
            setDirection(null);
        }, ANIMATION_DURATION);
    };

    const runSlideAnimation = (dir) => {
        if (animationTimeoutRef.current) {
            clearTimeout(animationTimeoutRef.current);
        }
        setSlideKey((k) => k + 1);
        setDirection(dir);
        animationTimeoutRef.current = setTimeout(() => {
            setDirection(null);
        }, ANIMATION_DURATION);
    };

    const handlePrevClick = () => {
        if (students.length === 0) return;

        const total = students.length;
        const newIndex = (activeCardIndex - 1 + total) % total;
        setActiveCardIndex(newIndex);
        updateVisibleCards(students, newIndex);
        runSlideAnimation('prev');
    };

    const handleNextClick = () => {
        if (students.length === 0) return;

        const total = students.length;
        const newIndex = (activeCardIndex + 1) % total;
        setActiveCardIndex(newIndex);
        updateVisibleCards(students, newIndex);
        runSlideAnimation('next');
    };

    const handleCardClick = (indexInWindow) => {
        if (students.length === 0) return;

        if (indexInWindow === 2) return;

        const total = students.length;
        const offset = indexInWindow - 2;
        const newIndex = (activeCardIndex + offset + total) % total;
        const dir = offset < 0 ? 'prev' : 'next';

        setActiveCardIndex(newIndex);
        updateVisibleCards(students, newIndex);
        runSlideAnimation(dir);
    };

    const activeStudent = visibleCards[2] || null;

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

                                <div key={slideKey} className={`studentSlider__listWrapper${direction === 'next' ? ' studentSlider__listWrapper_sliding-next' : ''}${direction === 'prev' ? ' studentSlider__listWrapper_sliding-prev' : ''}`}>
                                    {visibleCards.map((student, index) => (
                                        <div
                                            key={student?.id ?? index}
                                            className={`studentSlider__cardContainer ${index === 2 ? 'active' : ''}`}
                                        >
                                            <StudentSliderCard
                                                student={student}
                                                isActive={index === 2}
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