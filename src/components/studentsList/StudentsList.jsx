import React, { useState, useEffect, useRef } from "react";
import "./studentsList.css";
import searchIcon from "../../assets/icons/searchIcon.svg";
import filterIcon from "../../assets/icons/filterIcon.svg";
import StudentsListCard from "./StudentsListCard/StudentsListCard.jsx";
import { getAllStudents } from "../../services/studentApi.js";

const StudentsList = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchExpanded, setSearchExpanded] = useState(false);
    const [filterExpanded, setFilterExpanded] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState("1");
    const [isAdult, setIsAdult] = useState(false);
    const [selectedSpecialty, setSelectedSpecialty] = useState(null);
    const searchRef = useRef(null);
    const filterRef = useRef(null);
    const filtersRef = useRef(null);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                const data = await getAllStudents();
                setStudents(data);
            } catch (err) {
                setError(err.message);
                console.error('Failed to fetch students:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();

        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (!mobile) {
                setSearchExpanded(false);
                setFilterExpanded(false);
            }
        };

        const handleClickOutside = (event) => {
            if (isMobile) {
                if (searchExpanded && searchRef.current && !searchRef.current.contains(event.target)) {
                    setSearchExpanded(false);
                }
                if (filterExpanded && filterRef.current && !filterRef.current.contains(event.target)) {
                    setFilterExpanded(false);
                }
            }
            if (showFilters && filtersRef.current && !filtersRef.current.contains(event.target) && !filterRef.current.contains(event.target)) {
                setShowFilters(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape' && showFilters) {
                setShowFilters(false);
            }
        };

        window.addEventListener('resize', handleResize);
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isMobile, searchExpanded, filterExpanded, showFilters]);

    const handleSearchClick = () => {
        if (isMobile) {
            setSearchExpanded(!searchExpanded);
            if (!searchExpanded) {
                setFilterExpanded(false);
            }
        }
    };

    const handleFilterClick = () => {
        if (isMobile) {
            setFilterExpanded(!filterExpanded);
            if (!filterExpanded) {
                setSearchExpanded(false);
            }
        }
        setShowFilters(!showFilters);
    };

    const handleCourseSelect = (course) => {
        setSelectedCourse(course);
    };

    const handleSpecialtySelect = (specialty) => {
        setSelectedSpecialty(specialty);
    };

    const handleApplyFilters = () => {
        console.log('Applied filters:', {
            course: selectedCourse,
            adult: isAdult,
            specialty: selectedSpecialty
        });
        setShowFilters(false);
    };

    const handleResetFilters = () => {
        setSelectedCourse("1");
        setIsAdult(false);
        setSelectedSpecialty(null);
        setShowFilters(false);
    };

    if (loading) {
        return (
            <section className="studentsList-section">
                <div className="studentsList">
                    <p style={{color: '#fff', textAlign: 'center'}}>Загрузка студентов...</p>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="studentsList-section">
                <div className="studentsList">
                    <p style={{color: '#fff', textAlign: 'center'}}>Ошибка загрузки: {error}</p>
                </div>
            </section>
        );
    }

    return (
        <section className="studentsList-section">
            <div className="studentsList">
                <header className="studentsList__header">
                    <div className="studentsList__top-row">
                        <div
                            ref={searchRef}
                            className={`studentsList__search-wrapper ${searchExpanded ? 'expanded' : ''}`}
                            onClick={handleSearchClick}
                        >
                            <div className="studentsList__search-icon">
                                <img src={searchIcon} alt="search"/>
                            </div>
                            <input
                                type="text"
                                className="studentsList__search"
                                placeholder="Профессия / Стэк ..."
                                autoFocus={searchExpanded}
                            />
                        </div>
                        <h2 className="studentsList__title">Студенты</h2>
                        <button
                            ref={filterRef}
                            className={`studentsList__filter ${filterExpanded ? 'expanded' : ''}`}
                            onClick={handleFilterClick}
                        >
                            <img src={filterIcon} alt="filter"/>
                            <span>Фильтр</span>
                        </button>
                    </div>
                </header>

                <div className="studentsList__cardsWrapper">
                    {students.length > 0 ? (
                        students.map((student) => (
                            <StudentsListCard key={student.id} student={student} />
                        ))
                    ) : (
                        <p style={{color: '#fff'}}>Студенты не найдены</p>
                    )}
                </div>
            </div>

            {showFilters && (
                <div className="filters-overlay">
                    <div className="filters-container" ref={filtersRef}>
                        <div className="filter-section">
                            <h3 className="section-title">Курс</h3>
                            <div className="course-buttons">
                                {["1", "2", "3", "4"].map((course) => (
                                    <button
                                        key={course}
                                        className={`course-btn ${selectedCourse === course ? 'active' : ''}`}
                                        onClick={() => handleCourseSelect(course)}
                                    >
                                        {course}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="filter-section">
                            <h3 className="section-title">Возраст</h3>
                            <div
                                className="checkbox-container"
                                onClick={() => setIsAdult(!isAdult)}
                            >
                                <div className={`custom-checkbox ${isAdult ? 'checked' : ''}`}>
                                    <span className="checkbox-tick">✓</span>
                                </div>
                                <span className="checkbox-label">Старше 18 лет</span>
                            </div>
                        </div>

                        <div className="filter-section">
                            <h3 className="section-title">Специальность</h3>
                            <div className="specialty-select">
                                <button className="specialty-btn">
                                    {selectedSpecialty ? selectedSpecialty.name : "Выберите специальность"}
                                </button>
                                <div className="specialty-dropdown">
                                    {[
                                        { id: "1", name: "Java-разработчик" },
                                        { id: "2", name: "Менеджер проектов" },
                                        { id: "3", name: "Графический дизайнер" },
                                        { id: "4", name: "Веб-разработчик" },
                                        { id: "7", name: "Python-разработчик" },
                                        { id: "6", name: "Аналитик данных" },
                                        { id: "9", name: "Тестировщик" }
                                    ].map((specialty) => (
                                        <div
                                            key={specialty.id}
                                            className={`specialty-option ${selectedSpecialty && selectedSpecialty.id === specialty.id ? 'selected' : ''}`}
                                            onClick={() => handleSpecialtySelect(specialty)}
                                        >
                                            {specialty.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="action-buttons">
                            <button className="action-btn apply-btn" onClick={handleApplyFilters}>
                                Применить
                            </button>
                            <button className="action-btn reset-btn" onClick={handleResetFilters}>
                                Сбросить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}

export default StudentsList;