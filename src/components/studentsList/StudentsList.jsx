import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import "./studentsList.css";
import searchIcon from "../../assets/icons/searchIcon.svg";
import filterIcon from "../../assets/icons/filterIcon.svg";
import StudentsListCard from "./StudentsListCard/StudentsListCard.jsx";
import { getAllStudents } from "../../services/studentApi.js";

const FiltersModal = ({ showFilters, setShowFilters, onApplyFilters, onResetFilters, initialFilters }) => {
    const [selectedCourse, setSelectedCourse] = useState(initialFilters.course || "1");
    const [isAdult, setIsAdult] = useState(initialFilters.adult || false);
    const [selectedSpecialty, setSelectedSpecialty] = useState(initialFilters.specialty || null);
    const [specialtyDropdownOpen, setSpecialtyDropdownOpen] = useState(false);

    const filtersRef = useRef(null);
    const specialtyBtnRef = useRef(null);
    const specialtyDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (specialtyDropdownOpen &&
                specialtyBtnRef.current &&
                !specialtyBtnRef.current.contains(event.target) &&
                specialtyDropdownRef.current &&
                !specialtyDropdownRef.current.contains(event.target)) {
                setSpecialtyDropdownOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                if (specialtyDropdownOpen) {
                    setSpecialtyDropdownOpen(false);
                } else if (showFilters) {
                    setShowFilters(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [showFilters, specialtyDropdownOpen, setShowFilters]);

    const handleSpecialtySelect = (specialty) => {
        setSelectedSpecialty(specialty);
        setSpecialtyDropdownOpen(false);
    };

    const handleSpecialtyClick = (e) => {
        e.stopPropagation();
        setSpecialtyDropdownOpen(!specialtyDropdownOpen);
    };

    const handleApply = () => {
        onApplyFilters({
            course: selectedCourse,
            adult: isAdult,
            specialty: selectedSpecialty
        });
    };

    const handleReset = () => {
        setSelectedCourse("1");
        setIsAdult(false);
        setSelectedSpecialty(null);
        setSpecialtyDropdownOpen(false);
        onResetFilters();
    };

    const specialties = [
        { id: "1", name: "Java-разработчик" },
        { id: "2", name: "Менеджер проектов" },
        { id: "3", name: "Графический дизайнер" },
        { id: "4", name: "Веб-разработчик" },
        { id: "7", name: "Python-разработчик" },
        { id: "6", name: "Аналитик данных" },
        { id: "9", name: "Тестировщик" }
    ];

    if (!showFilters) return null;

    return ReactDOM.createPortal(
        <div
            className="filters-overlay"
            onClick={() => { setShowFilters(false); setSpecialtyDropdownOpen(false); }}
        >
            <div className="filters-container" ref={filtersRef} onClick={(e) => e.stopPropagation()}>
                <div className="filter-section">
                    <h3 className="section-title">Курс</h3>
                    <div className="course-buttons">
                        {["1", "2", "3", "4"].map((course) => (
                            <button
                                key={course}
                                className={`course-btn ${selectedCourse === course ? 'active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); setSelectedCourse(course); }}
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
                        onClick={(e) => { e.stopPropagation(); setIsAdult(!isAdult); }}
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
                        <button
                            ref={specialtyBtnRef}
                            className={`specialty-btn ${specialtyDropdownOpen ? 'active' : ''}`}
                            onClick={handleSpecialtyClick}
                        >
                            {selectedSpecialty ? selectedSpecialty.name : "Выберите специальность"}
                        </button>
                        <div
                            ref={specialtyDropdownRef}
                            className={`specialty-dropdown ${specialtyDropdownOpen ? 'open' : ''}`}
                        >
                            {specialties.map((specialty) => (
                                <div
                                    key={specialty.id}
                                    className={`specialty-option ${selectedSpecialty && selectedSpecialty.id === specialty.id ? 'selected' : ''}`}
                                    onClick={(e) => { e.stopPropagation(); handleSpecialtySelect(specialty); }}
                                >
                                    {specialty.name}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="action-buttons">
                    <button className="action-btn apply-btn" onClick={(e) => { e.stopPropagation(); handleApply(); setShowFilters(false); }}>
                        Принять
                    </button>
                    <button className="action-btn reset-btn" onClick={(e) => { e.stopPropagation(); handleReset(); setShowFilters(false); }}>
                        Сбросить
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const StudentsList = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchExpanded, setSearchExpanded] = useState(false);
    const [filterExpanded, setFilterExpanded] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [showFilters, setShowFilters] = useState(false);
    const [currentFilters, setCurrentFilters] = useState({
        course: "1",
        adult: false,
        specialty: null
    });

    const searchRef = useRef(null);
    const filterRef = useRef(null);

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
        };

        window.addEventListener('resize', handleResize);
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMobile, searchExpanded, filterExpanded]);

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

    const handleApplyFilters = (filters) => {
        setCurrentFilters(filters);
        console.log('Applied filters:', filters);
    };

    const handleResetFilters = () => {
        setCurrentFilters({
            course: "1",
            adult: false,
            specialty: null
        });
        console.log('Filters reset');
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

            <FiltersModal
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                onApplyFilters={handleApplyFilters}
                onResetFilters={handleResetFilters}
                initialFilters={currentFilters}
            />
        </section>
    )
}

export default StudentsList;