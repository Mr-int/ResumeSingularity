import React, { useState, useEffect, useRef } from 'react';
import './studentSlider.css';
import searchIconDark from "../../assets/icons/searchIconDark.svg";
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
    const [filters, setFilters] = useState({
        course: '',
        ageOver18: false,
        specialty: '',
        stack: []
    });

    const searchInputRef = useRef(null);
    const listWrapperRef = useRef(null);
    const filterRef = useRef(null);

    const specialties = ['Frontend', 'Backend', 'Менеджер', 'Дизайнер', 'Аналитик'];
    const stackOptions = ['Js', 'Python', 'Java'];

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                const data = await getAllStudents();
                setStudents(data);
                if (data.length > 0) {
                    const middleIndex = Math.min(2, Math.floor(data.slice(0, 5).length / 2));
                    setActiveCardIndex(middleIndex);
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
            if (!listWrapperRef.current || students.slice(0, 5).length === 0) return;

            const wrapper = listWrapperRef.current;
            const activeIndex = Math.min(activeCardIndex, students.slice(0, 5).length - 1);
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
        if (students.length > 0) {
            setActiveCardIndex((prev) => {
                if (prev === 0) {
                    return Math.min(students.length - 1, 4);
                }
                return prev - 1;
            });
        }
    };

    const handleNextClick = () => {
        if (students.length > 0) {
            const maxIndex = Math.min(students.length - 1, 4);
            setActiveCardIndex((prev) => {
                if (prev === maxIndex) {
                    return 0;
                }
                return prev + 1;
            });
        }
    };

    const handleCardClick = (index) => {
        setActiveCardIndex(index);
    };

    const handleCourseChange = (e) => {
        setFilters({
            ...filters,
            course: e.target.value
        });
    };

    const handleAgeChange = (e) => {
        setFilters({
            ...filters,
            ageOver18: e.target.checked
        });
    };

    const handleSpecialtyChange = (specialty) => {
        setFilters({
            ...filters,
            specialty: filters.specialty === specialty ? '' : specialty
        });
    };

    const handleStackChange = (stack) => {
        setFilters({
            ...filters,
            stack: filters.stack.includes(stack)
                ? filters.stack.filter(s => s !== stack)
                : [...filters.stack, stack]
        });
    };

    const handleResetFilters = () => {
        setFilters({
            course: '',
            ageOver18: false,
            specialty: '',
            stack: []
        });
    };

    const displayedStudents = students.slice(0, 5);
    const activeStudent = displayedStudents.length > 0 ? displayedStudents[activeCardIndex] : null;

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
                        <img
                            src={searchIconDark}
                            alt="Поиск"
                            className="studentSlider__searchIcon"
                            width="20px"
                            height="20px"
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
                                    {displayedStudents.map((student, index) => (
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
                    <p style={{color: '#fff'}}>Студенты не найдены</p>
                )}
            </div>


                <div className="filter-modal-overlay">
                    <div className="filter-modal" ref={filterRef}>
                        <div className="filter-modal__header">
                            <div className="filter-modal__header-left">
                                <img src={filterIcon} alt="Фильтр" className="filter-modal__header-icon" />
                                <h3 className="filter-modal__title">Фильтры</h3>
                            </div>
                        </div>

                        <div className="filter-modal__content">
                            <div className="filter-section">
                                <label className="filter-section__label">Курс</label>
                                <input
                                    type="text"
                                    className="filter-section__input"
                                    placeholder="Введите курс"
                                    value={filters.course}
                                    onChange={handleCourseChange}
                                />
                            </div>

                            <div className="filter-section">
                                <div className="filter-checkbox">
                                    <input
                                        type="checkbox"
                                        id="ageOver18"
                                        checked={filters.ageOver18}
                                        onChange={handleAgeChange}
                                        className="filter-checkbox__input"
                                    />
                                    <label htmlFor="ageOver18" className="filter-checkbox__label">
                                        Старше 18 лет
                                    </label>
                                </div>
                            </div>

                            <div className="filter-section">
                                <label className="filter-section__label">Специальность</label>
                                <div className="filter-options">
                                    {specialties.map((specialty) => (
                                        <button
                                            key={specialty}
                                            className={`filter-option ${filters.specialty === specialty ? 'active' : ''}`}
                                            onClick={() => handleSpecialtyChange(specialty)}
                                        >
                                            {specialty}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="filter-section">
                                <label className="filter-section__label">Стек</label>
                                <div className="filter-options">
                                    {stackOptions.map((stack) => (
                                        <div key={stack} className="filter-checkbox">
                                            <input
                                                type="checkbox"
                                                id={`stack-${stack}`}
                                                checked={filters.stack.includes(stack)}
                                                onChange={() => handleStackChange(stack)}
                                                className="filter-checkbox__input"
                                            />
                                            <label htmlFor={`stack-${stack}`} className="filter-checkbox__label">
                                                {stack}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="filter-modal__buttons">
                                <button
                                    className="filter-button filter-button--reset"
                                    onClick={handleResetFilters}
                                >
                                    Сбросить
                                </button>
                                <button
                                    className="filter-button filter-button--apply"
                                >
                                    Применить
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
        </section>
    );
};

export default StudentSlider;