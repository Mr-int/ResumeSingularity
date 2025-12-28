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
    const [activeCardIndex, setActiveCardIndex] = useState(0);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const searchInputRef = useRef(null);
    const sliderWrapperRef = useRef(null);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                const data = await getAllStudents();
                setStudents(data);
                if (data.length > 0) {
                    setActiveCardIndex(0);
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
        if (sliderWrapperRef.current && displayedStudents.length > 0) {
            const container = sliderWrapperRef.current;
            const activeCard = container.children[activeCardIndex];

            if (activeCard) {
                const containerWidth = container.offsetWidth;
                const cardWidth = activeCard.offsetWidth;
                const cardLeft = activeCard.offsetLeft;

                const scrollTo = cardLeft - (containerWidth / 2) + (cardWidth / 2);
                container.scrollTo({
                    left: scrollTo,
                    behavior: 'smooth'
                });
            }
        }
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
            setActiveCardIndex((prev) => (prev === 0 ? Math.min(students.length - 1, 4) : prev - 1));
        }
    };

    const handleNextClick = () => {
        if (students.length > 0) {
            const maxIndex = Math.min(students.length - 1, 4);
            setActiveCardIndex((prev) => (prev === maxIndex ? 0 : prev + 1));
        }
    };

    // Ограничиваем количество отображаемых студентов до 5
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

                    <button className="studentSlider__filter">
                        <span>Фильтр</span>
                        <img src={filterIcon} alt="Фильтр"/>
                    </button>
                </div>

                {loading ? (
                    <p style={{color: '#fff'}}>Загрузка студентов...</p>
                ) : students.length > 0 ? (
                    <>
                        <div className="studentSlider__list">
                            <button className="studentSlider__listButton" onClick={handlePrevClick}>
                                <img src={sliderArrowIcon} alt="Предыдущий"/>
                            </button>

                            <div
                                className="studentSlider__listWrapper"
                                ref={sliderWrapperRef}
                            >
                                {displayedStudents.map((student, index) => (
                                    <StudentSliderCard
                                        key={student.id}
                                        student={student}
                                        isActive={index === activeCardIndex}
                                        onClick={() => setActiveCardIndex(index)}
                                    />
                                ))}
                            </div>

                            <button className="studentSlider__listButton" onClick={handleNextClick}>
                                <img src={sliderArrowIcon} alt="Следующий" className="rotateRight"/>
                            </button>
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
        </section>
    );
};

export default StudentSlider;