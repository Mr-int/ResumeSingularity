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
    const [visibleCards, setVisibleCards] = useState([]);
    const [isAnimating, setIsAnimating] = useState(false);

    const searchInputRef = useRef(null);
    const listWrapperRef = useRef(null);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                const data = await getAllStudents();
                setStudents(data);
                if (data.length > 0) {
                    const middleIndex = Math.min(2, Math.floor(data.slice(0, 5).length / 2));
                    setActiveCardIndex(middleIndex);
                    setVisibleCards(data.slice(0, 5));
                }
            } catch (error) {
                console.error('Failed to fetch students:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, []);

    const shiftCards = (direction) => {
        if (isAnimating || students.length === 0) return;

        setIsAnimating(true);
        const maxIndex = Math.min(students.length - 1, 4);
        let newActiveIndex;

        if (direction === 'prev') {
            newActiveIndex = activeCardIndex === 0 ? maxIndex : activeCardIndex - 1;
        } else {
            newActiveIndex = activeCardIndex === maxIndex ? 0 : activeCardIndex + 1;
        }

        const newVisibleCards = [];
        for (let i = 0; i < 5; i++) {
            const cardIndex = (newActiveIndex + i - 2 + students.length) % students.length;
            newVisibleCards[i] = students[cardIndex];
        }

        setVisibleCards(newVisibleCards);
        setActiveCardIndex(newActiveIndex);

        setTimeout(() => {
            setIsAnimating(false);
        }, 500);
    };

    useEffect(() => {
        const updatePosition = () => {
            if (!listWrapperRef.current || visibleCards.length === 0) return;

            const wrapper = listWrapperRef.current;
            const activeContainer = wrapper.children[2];

            if (activeContainer) {
                const wrapperRect = wrapper.getBoundingClientRect();
                const activeRect = activeContainer.getBoundingClientRect();
                const offset = (wrapperRect.width / 2) - (activeRect.width / 2) - activeRect.left + wrapperRect.left;

                setListWrapperStyle({
                    transform: `translateX(${offset}px)`,
                    transition: 'transform 0.5s ease'
                });
            }
        };

        requestAnimationFrame(updatePosition);
        window.addEventListener('resize', updatePosition);
        return () => window.removeEventListener('resize', updatePosition);
    }, [visibleCards]);

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
            shiftCards('prev');
        }
    };

    const handleNextClick = () => {
        if (students.length > 0) {
            shiftCards('next');
        }
    };

    const handleCardClick = (index) => {
        if (isAnimating) return;

        setIsAnimating(true);
        const maxIndex = Math.min(students.length - 1, 4);
        const newActiveIndex = Math.min(index, maxIndex);
        const newVisibleCards = [];
        for (let i = 0; i < 5; i++) {
            const cardIndex = (newActiveIndex + i - 2 + students.length) % students.length;
            newVisibleCards[i] = students[cardIndex];
        }
        setVisibleCards(newVisibleCards);
        setActiveCardIndex(newActiveIndex);

        setTimeout(() => {
            setIsAnimating(false);
        }, 500);
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
                                <button className="studentSlider__listButton desktop-only" onClick={handlePrevClick} disabled={isAnimating}>
                                    <img src={sliderArrowIcon} alt="Предыдущий"/>
                                </button>

                                <div className="studentSlider__listWrapper" ref={listWrapperRef} style={listWrapperStyle}>
                                    {visibleCards.map((student, index) => (
                                        <div
                                            key={`${student.id}-${index}`}
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

                                <button className="studentSlider__listButton desktop-only" onClick={handleNextClick} disabled={isAnimating}>
                                    <img src={sliderArrowIcon} alt="Следующий" className="rotateRight"/>
                                </button>
                            </div>

                            <div className="studentSlider__mobileControls">
                                <button className="studentSlider__mobileButton" onClick={handlePrevClick} disabled={isAnimating}>
                                    <img src={sliderArrowIcon} alt="Предыдущий"/>
                                </button>
                                <button className="studentSlider__mobileButton" onClick={handleNextClick} disabled={isAnimating}>
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