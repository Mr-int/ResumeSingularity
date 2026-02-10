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
    const [activeCardIndex, setActiveCardIndex] = useState(2); // индекс активной карточки в общем списке
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [listWrapperStyle, setListWrapperStyle] = useState({});
    const [visibleCards, setVisibleCards] = useState([]); // всегда 5 карточек в слайдере
    const [direction, setDirection] = useState(null); // 'prev' | 'next' | null
    const animationTimeoutRef = useRef(null);

    const searchInputRef = useRef(null);
    const listWrapperRef = useRef(null);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                const data = await getAllStudents();
                setStudents(data);

                if (data.length > 0) {
                    const middleIndex = Math.floor(data.length / 2);
                    setActiveCardIndex(middleIndex);

                    // сформировать первоначальное окно из 5 карточек, где центральная всегда по индексу 2
                    const newVisibleCards = [];
                    for (let i = 0; i < 5; i++) {
                        const cardIndex = (middleIndex + i - 2 + data.length) % data.length;
                        newVisibleCards[i] = data[cardIndex];
                    }
                    setVisibleCards(newVisibleCards);
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

    // центрируем контейнер так, чтобы карточка с индексом 2 (середина окна) всегда была строго по центру слайдера
    useEffect(() => {
        const updatePosition = () => {
            if (!listWrapperRef.current || visibleCards.length === 0) return;

            const wrapper = listWrapperRef.current;
            const activeContainer = wrapper.children[2]; // центральная карточка в окне

            if (activeContainer) {
                const wrapperRect = wrapper.getBoundingClientRect();
                const activeRect = activeContainer.getBoundingClientRect();

                const offset =
                    (wrapperRect.width / 2) -
                    (activeRect.width / 2) -
                    activeRect.left +
                    wrapperRect.left;

                setListWrapperStyle({
                    transform: `translateX(${offset}px)`,
                    transition: 'transform 0.4s ease'
                });
            }
        };

        requestAnimationFrame(updatePosition);
        window.addEventListener('resize', updatePosition);
        return () => window.removeEventListener('resize', updatePosition);
    }, [visibleCards]);

    // сдвиг окна карточек по кругу, при этом центральная остаётся в геометрическом центре,
    // а данные для неё обновляются (бесконечный цикл по students)
    const shiftCards = (newDirection) => {
        if (students.length === 0) return;

        setDirection(newDirection);

        const total = students.length;
        const newActiveIndex =
            newDirection === 'prev'
                ? (activeCardIndex - 1 + total) % total
                : (activeCardIndex + 1) % total;

        const newVisibleCards = [];
        for (let i = 0; i < 5; i++) {
            const cardIndex = (newActiveIndex + i - 2 + total) % total;
            newVisibleCards[i] = students[cardIndex];
        }

        setActiveCardIndex(newActiveIndex);
        setVisibleCards(newVisibleCards);

        if (animationTimeoutRef.current) {
            clearTimeout(animationTimeoutRef.current);
        }
        animationTimeoutRef.current = setTimeout(() => {
            setDirection(null);
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
        if (students.length === 0) return;

        // центральная уже в фокусе
        if (index === 2) return;

        const clickedStudent = visibleCards[index];
        if (!clickedStudent) return;

        // найти глобальный индекс кликнутого студента
        const globalIndex = students.findIndex((s) => s.id === clickedStudent.id);
        if (globalIndex === -1) return;

        const newDirection = index < 2 ? 'prev' : 'next';
        setDirection(newDirection);

        const total = students.length;
        const newActiveIndex = globalIndex;

        const newVisibleCards = [];
        for (let i = 0; i < 5; i++) {
            const cardIndex = (newActiveIndex + i - 2 + total) % total;
            newVisibleCards[i] = students[cardIndex];
        }

        setActiveCardIndex(newActiveIndex);
        setVisibleCards(newVisibleCards);

        if (animationTimeoutRef.current) {
            clearTimeout(animationTimeoutRef.current);
        }
        animationTimeoutRef.current = setTimeout(() => {
            setDirection(null);
        }, 300);
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

                                <div className="studentSlider__listWrapper" ref={listWrapperRef} style={listWrapperStyle}>
                                    {visibleCards.map((student, index) => (
                                        <div
                                            key={`${student.id}-${index}`}
                                            className={`studentSlider__cardContainer ${index === 2 ? 'active' : ''} ${
                                                direction === 'prev' && index === 4
                                                    ? 'slide-in-left'
                                                    : direction === 'next' && index === 0
                                                        ? 'slide-in-right'
                                                        : direction === 'prev' && index === 0
                                                            ? 'slide-out-right'
                                                            : direction === 'next' && index === 4
                                                                ? 'slide-out-left'
                                                                : ''
                                            }`}
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