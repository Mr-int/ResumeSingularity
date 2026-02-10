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
    const [activeCardIndex, setActiveCardIndex] = useState(0); // индекс активной карточки в общем списке
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [listWrapperStyle, setListWrapperStyle] = useState({});
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

    // центрируем контейнер так, чтобы активная карточка из общего списка была в центре.
    // при этом используем плавный translateX контейнера + transition карточек (scale/opacity),
    // чтобы старая центральная карточка "усаживалась" в сторону, а новая мягко выезжала в центр.
    useEffect(() => {
        const updatePosition = () => {
            if (!listWrapperRef.current || students.length === 0) return;

            const wrapper = listWrapperRef.current;
            const container = wrapper.parentElement;
            if (!container) return;

            const children = Array.from(wrapper.children);
            if (children.length === 0) return;

            const firstRect = children[0].getBoundingClientRect();
            const secondRect = children[1] ? children[1].getBoundingClientRect() : null;

            const cardWidthWithGap = secondRect
                ? Math.abs(secondRect.left - firstRect.left)
                : firstRect.width;

            const containerRect = container.getBoundingClientRect();
            const offset = containerRect.width / 2 - cardWidthWithGap / 2;

            const translateX = -(activeCardIndex * cardWidthWithGap) + offset;

            setListWrapperStyle({
                transform: `translateX(${translateX}px)`,
                transition: 'transform 0.4s ease'
            });
        };

        requestAnimationFrame(updatePosition);
        window.addEventListener('resize', updatePosition);
        return () => window.removeEventListener('resize', updatePosition);
    }, [students, activeCardIndex]);

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

        setActiveCardIndex((prevIndex) => {
            if (students.length === 0) return prevIndex;
            // бесконечный цикл по списку
            return (prevIndex - 1 + students.length) % students.length;
        });
    };

    const handleNextClick = () => {
        if (students.length === 0) return;

        setActiveCardIndex((prevIndex) => {
            if (students.length === 0) return prevIndex;
            // бесконечный цикл по списку
            return (prevIndex + 1) % students.length;
        });
    };

    const handleCardClick = (index) => {
        if (students.length === 0) return;

        if (index === activeCardIndex) return;

        setActiveCardIndex(index);
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
                        <div className="studentSlider__container">
                            <div className="studentSlider__list">
                                <button className="studentSlider__listButton desktop-only" onClick={handlePrevClick}>
                                    <img src={sliderArrowIcon} alt="Предыдущий"/>
                                </button>

                                <div className="studentSlider__listWrapper" ref={listWrapperRef} style={listWrapperStyle}>
                                    {students.map((student, index) => (
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