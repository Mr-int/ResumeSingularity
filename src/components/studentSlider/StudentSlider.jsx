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
    const [loading, setLoading] = useState(true);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    const searchInputRef = useRef(null);

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
    }, []);

    const total = students.length;
    const SPACERS_PER_SIDE = 2;
    const SLOTS_TOTAL = total > 0 ? SPACERS_PER_SIDE * 2 + total : 0;

    const handleSearchChange = (e) => {
        setSearchValue(e.target.value);
    };

    const handleSearchClick = () => {
        if (window.innerWidth <= 480) {
            setIsSearchExpanded(true);
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    };

    const handleSearchBlur = () => {
        if (window.innerWidth <= 480 && searchValue === '') {
            setIsSearchExpanded(false);
        }
    };

    const goPrev = () => {
        if (total === 0) return;
        setActiveCardIndex((i) => (i > 0 ? i - 1 : total - 1));
    };

    const goNext = () => {
        if (total === 0) return;
        setActiveCardIndex((i) => (i < total - 1 ? i + 1 : 0));
    };

    const handleCardClick = (index) => {
        if (total === 0 || index === activeCardIndex) return;
        setActiveCardIndex(index);
    };

    const activeStudent = total > 0 ? students[activeCardIndex] : null;

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
                    <button className="studentSlider__filter">
                        <span>Фильтр</span>
                        <img src={filterIcon} alt="Фильтр" />
                    </button>
                </div>

                {loading ? (
                    <p style={{ color: '#fff' }}>Загрузка студентов...</p>
                ) : total > 0 ? (
                    <>
                        <div className="studentSlider__container">
                            <div className="studentSlider__list">
                                <button
                                    type="button"
                                    className="studentSlider__listButton desktop-only"
                                    onClick={goPrev}
                                    aria-label="Предыдущий"
                                >
                                    <img src={sliderArrowIcon} alt="Предыдущий" />
                                </button>

                                <div className="studentSlider__viewport">
                                    <div
                                        className="studentSlider__track"
                                        style={{
                                            '--slots-total': SLOTS_TOTAL,
                                            '--active-index': activeCardIndex,
                                        }}
                                    >
                                        {Array.from({ length: SPACERS_PER_SIDE }, (_, i) => (
                                            <div key={`left-${i}`} className="studentSlider__spacer" aria-hidden="true" />
                                        ))}
                                        {students.map((student, index) => (
                                            <div
                                                key={student?.id ?? index}
                                                className={`studentSlider__cardContainer ${index === activeCardIndex ? 'active' : ''}`}
                                            >
                                                <StudentSliderCard
                                                    student={student}
                                                    isActive={index === activeCardIndex}
                                                    onClick={() => handleCardClick(index)}
                                                />
                                            </div>
                                        ))}
                                        {Array.from({ length: SPACERS_PER_SIDE }, (_, i) => (
                                            <div key={`right-${i}`} className="studentSlider__spacer" aria-hidden="true" />
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="studentSlider__listButton desktop-only"
                                    onClick={goNext}
                                    aria-label="Следующий"
                                >
                                    <img src={sliderArrowIcon} alt="Следующий" className="rotateRight" />
                                </button>
                            </div>

                            <div className="studentSlider__mobileControls">
                                <button
                                    type="button"
                                    className="studentSlider__mobileButton"
                                    onClick={goPrev}
                                    aria-label="Предыдущий"
                                >
                                    <img src={sliderArrowIcon} alt="Предыдущий" />
                                </button>
                                <button
                                    type="button"
                                    className="studentSlider__mobileButton"
                                    onClick={goNext}
                                    aria-label="Следующий"
                                >
                                    <img src={sliderArrowIcon} alt="Следующий" className="rotateRight" />
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
                    <p style={{ color: '#fff' }}>Для показа студентов ты должен быть авторизован :(</p>
                )}
            </div>
        </section>
    );
};

export default StudentSlider;
