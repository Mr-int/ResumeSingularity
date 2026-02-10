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
    const [displayedCards, setDisplayedCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [listWrapperStyle, setListWrapperStyle] = useState({});

    const searchInputRef = useRef(null);
    const listWrapperRef = useRef(null);
    const sliderContainerRef = useRef(null);
    const isAnimating = useRef(false);

    const DUPLICATE_COUNT = 3;

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                const data = await getAllStudents();
                setStudents(data);

                if (data.length > 0) {
                    const middleIndex = Math.floor(data.length / 2);
                    setActiveCardIndex(middleIndex);
                    createDisplayedCards(data, middleIndex);
                }
            } catch (error) {
                console.error('Failed to fetch students:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, []);

    const createDisplayedCards = (studentsArray, centerIndex) => {
        if (studentsArray.length === 0) {
            setDisplayedCards([]);
            return;
        }

        const total = studentsArray.length;
        const displayed = [];

        for (let i = 0; i < DUPLICATE_COUNT; i++) {
            const index = (centerIndex - DUPLICATE_COUNT + i + total) % total;
            displayed.push({
                student: studentsArray[index],
                originalIndex: index,
                isDuplicate: true
            });
        }

        studentsArray.forEach((student, index) => {
            displayed.push({
                student,
                originalIndex: index,
                isDuplicate: false
            });
        });

        for (let i = 0; i < DUPLICATE_COUNT; i++) {
            const index = (centerIndex + i + 1) % total;
            displayed.push({
                student: studentsArray[index],
                originalIndex: index,
                isDuplicate: true
            });
        }

        setDisplayedCards(displayed);
    };

    useEffect(() => {
        if (students.length > 0) {
            createDisplayedCards(students, activeCardIndex);
        }
    }, [students, activeCardIndex]);

    useEffect(() => {
        const updatePosition = () => {
            if (!listWrapperRef.current || !sliderContainerRef.current || displayedCards.length === 0) return;

            const wrapper = listWrapperRef.current;
            const container = sliderContainerRef.current;

            const children = Array.from(wrapper.children);
            if (children.length === 0) return;

            const firstOriginalIndex = DUPLICATE_COUNT;
            const firstCard = children[firstOriginalIndex];
            const secondCard = children[firstOriginalIndex + 1];

            if (!firstCard) return;

            const firstRect = firstCard.getBoundingClientRect();
            const secondRect = secondCard ? secondCard.getBoundingClientRect() : null;

            const cardWidthWithGap = secondRect
                ? Math.abs(secondRect.left - firstRect.left)
                : firstRect.width;

            const containerWidth = container.offsetWidth;
            const centerOffset = containerWidth / 2 - cardWidthWithGap / 2;

            const displayedActiveIndex = DUPLICATE_COUNT + activeCardIndex;
            const translateX = -(displayedActiveIndex * cardWidthWithGap) + centerOffset;

            setListWrapperStyle({
                transform: `translateX(${translateX}px)`,
                transition: isAnimating.current ? 'transform 0.4s ease' : 'none'
            });

            isAnimating.current = false;
        };

        requestAnimationFrame(updatePosition);
        window.addEventListener('resize', updatePosition);
        return () => window.removeEventListener('resize', updatePosition);
    }, [displayedCards, activeCardIndex]);

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
        if (students.length === 0 || isAnimating.current) return;

        isAnimating.current = true;
        setActiveCardIndex((prevIndex) => {
            const total = students.length;
            return (prevIndex - 1 + total) % total;
        });
    };

    const handleNextClick = () => {
        if (students.length === 0 || isAnimating.current) return;

        isAnimating.current = true;
        setActiveCardIndex((prevIndex) => {
            const total = students.length;
            return (prevIndex + 1) % total;
        });
    };

    const handleCardClick = (index) => {
        if (students.length === 0 || isAnimating.current || index === activeCardIndex) return;

        isAnimating.current = true;
        setActiveCardIndex(index);
    };

    const getIsActive = (originalIndex) => {
        return originalIndex === activeCardIndex;
    };

    const activeStudent = students[activeCardIndex] || null;

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
                        <div className="studentSlider__container" ref={sliderContainerRef}>
                            <div className="studentSlider__list">
                                <button className="studentSlider__listButton desktop-only" onClick={handlePrevClick}>
                                    <img src={sliderArrowIcon} alt="Предыдущий"/>
                                </button>

                                <div className="studentSlider__listWrapper" ref={listWrapperRef} style={listWrapperStyle}>
                                    {displayedCards.map((cardData, index) => (
                                        <div
                                            key={`${cardData.student.id}-${index}-${cardData.isDuplicate ? 'dup' : 'orig'}`}
                                            className={`studentSlider__cardContainer ${getIsActive(cardData.originalIndex) ? 'active' : ''}`}
                                        >
                                            <StudentSliderCard
                                                student={cardData.student}
                                                isActive={getIsActive(cardData.originalIndex)}
                                                onClick={() => handleCardClick(cardData.originalIndex)}
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