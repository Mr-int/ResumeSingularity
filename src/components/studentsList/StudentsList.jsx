import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import "./studentsList.css";
import searchIcon from "../../assets/icons/searchIcon.svg";
import filterIcon from "../../assets/icons/filterIcon.svg";
import StudentsListCard from "./StudentsListCard/StudentsListCard.jsx";
import { filterStudents } from "../../services/studentApi.js";

const FiltersModal = ({ showFilters, setShowFilters, onApplyFilters, onResetFilters, initialFilters }) => {
    const [selectedCourse, setSelectedCourse] = useState(initialFilters.course || null);
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

    const handleCourseClick = (course) => {
        if (selectedCourse === course) {
            setSelectedCourse(null);
        } else {
            setSelectedCourse(course);
        }
    };

    const handleApply = () => {
        onApplyFilters({
            course: selectedCourse,
            adult: isAdult,
            specialty: selectedSpecialty
        });
    };

    const handleReset = () => {
        setSelectedCourse(null);
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
                                onClick={(e) => { e.stopPropagation(); handleCourseClick(course); }}
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
                        Применить
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
    const [allStudents, setAllStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchExpanded, setSearchExpanded] = useState(false);
    const [filterExpanded, setFilterExpanded] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [showFilters, setShowFilters] = useState(false);
    const [currentFilters, setCurrentFilters] = useState({
        course: null,
        adult: false,
        specialty: null
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [tempSearchQuery, setTempSearchQuery] = useState("");
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const searchRef = useRef(null);
    const filterRef = useRef(null);
    const searchInputRef = useRef(null);

    const fetchFilteredStudents = useCallback(async (filters, query) => {
        try {
            setLoading(true);

            const filterData = {
                findString: query?.trim() || null,
                course: filters.course ? [filters.course] : [],
                bornAfter: filters.adult ? "2006-01-01" : null,
                specialitiesIds: filters.specialty ? [filters.specialty.id] : []
            };

            console.log('[API] Sending filter request:', filterData);
            const data = await filterStudents(filterData);
            console.log('[API] Received filtered students:', data);

            return data || [];
        } catch (err) {
            console.error('Failed to fetch filtered students:', err);
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setLoading(true);
                const data = await fetchFilteredStudents({}, "");
                setAllStudents(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
                setIsInitialLoad(false);
            }
        };

        if (isInitialLoad) {
            loadInitialData();
        }
    }, [isInitialLoad, fetchFilteredStudents]);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (!mobile) {
                setSearchExpanded(false);
                setFilterExpanded(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
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

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMobile, searchExpanded, filterExpanded]);

    useEffect(() => {
        const applyFilters = async () => {
            const data = await fetchFilteredStudents(currentFilters, searchQuery);
            setAllStudents(data);
        };

        applyFilters();
    }, [currentFilters, fetchFilteredStudents]);

    const handleSearchClick = () => {
        if (isMobile) {
            setSearchExpanded(!searchExpanded);
            if (!searchExpanded) {
                setFilterExpanded(false);
                setTimeout(() => {
                    if (searchInputRef.current) {
                        searchInputRef.current.focus();
                    }
                }, 100);
            }
        }
    };

    const handleSearchChange = (e) => {
        setTempSearchQuery(e.target.value);
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            setSearchQuery(tempSearchQuery);
            if (isMobile) {
                setSearchExpanded(false);
            }
        }
    };

    const handleSearchSubmit = () => {
        setSearchQuery(tempSearchQuery);
        if (isMobile) {
            setSearchExpanded(false);
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
        console.log('[ACTION] Applying filters:', filters);
        setCurrentFilters(filters);
    };

    const handleResetFilters = () => {
        console.log('[ACTION] Resetting filters');
        setCurrentFilters({
            course: null,
            adult: false,
            specialty: null
        });
        setSearchQuery("");
        setTempSearchQuery("");
    };

    const clearSearch = () => {
        setSearchQuery("");
        setTempSearchQuery("");
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    };

    if (loading && isInitialLoad) {
        return (
            <section className="studentsList-section">
                <div className="studentsList">
                    <p style={{color: '#fff', textAlign: 'center', fontFamily: 'StratosSemiLight'}}>Загрузка студентов...</p>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="studentsList-section">
                <div className="studentsList">
                    <p style={{color: '#fff', textAlign: 'center', fontFamily: 'StratosSemiLight'}}>Ошибка загрузки: {error}</p>
                </div>
            </section>
        );
    }

    const hasActiveFilters = currentFilters.course || currentFilters.adult || currentFilters.specialty || searchQuery;

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
                            <div
                                className="studentsList__search-icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSearchSubmit();
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                <img src={searchIcon} alt="search"/>
                            </div>
                            <input
                                ref={searchInputRef}
                                type="text"
                                className="studentsList__search"
                                placeholder="Профессия / Стэк ..."
                                autoFocus={searchExpanded}
                                value={tempSearchQuery}
                                onChange={handleSearchChange}
                                onKeyDown={handleSearchKeyDown}
                            />
                            {tempSearchQuery && (
                                <div
                                    className="clear-search"
                                    onClick={(e) => { e.stopPropagation(); clearSearch(); }}
                                    style={{
                                        position: 'absolute',
                                        right: '20px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        cursor: 'pointer',
                                        color: '#fff',
                                        fontSize: '20px',
                                        width: '20px',
                                        height: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    ×
                                </div>
                            )}
                        </div>
                        <h2 className="studentsList__title">Студенты</h2>
                        <button
                            ref={filterRef}
                            className={`studentsList__filter ${filterExpanded ? 'expanded' : ''} ${hasActiveFilters ? 'has-filters' : ''}`}
                            onClick={handleFilterClick}
                        >
                            <img src={filterIcon} alt="filter"/>
                            <span>Фильтр</span>
                            {hasActiveFilters && (
                                <span className="filter-badge"></span>
                            )}
                        </button>
                    </div>

                    {hasActiveFilters && (
                        <div className="active-filters">
                            {currentFilters.course && (
                                <div className="active-filter-tag">
                                    Курс: {currentFilters.course}
                                </div>
                            )}
                            {currentFilters.adult && (
                                <div className="active-filter-tag">
                                    Старше 18 лет
                                </div>
                            )}
                            {currentFilters.specialty && (
                                <div className="active-filter-tag">
                                    {currentFilters.specialty.name}
                                </div>
                            )}
                            {searchQuery && (
                                <div className="active-filter-tag">
                                    Поиск: "{searchQuery}"
                                </div>
                            )}
                            <button
                                className="clear-all-filters"
                                onClick={handleResetFilters}
                            >
                                Сбросить все
                            </button>
                        </div>
                    )}
                </header>

                <div className="studentsList__cardsWrapper">
                    {allStudents.length > 0 ? (
                        allStudents.map((student) => (
                            <StudentsListCard key={student.id} student={student} />
                        ))
                    ) : (
                        <div className="no-results-message">
                            {hasActiveFilters
                                ? "Студенты по заданным критериям не найдены"
                                : "Студенты не найдены"}
                            <br />
                            {hasActiveFilters && (
                                <button
                                    onClick={handleResetFilters}
                                    style={{
                                        marginTop: '20px',
                                        background: 'transparent',
                                        border: '1px solid #fff',
                                        color: '#fff',
                                        padding: '10px 20px',
                                        borderRadius: '25px',
                                        cursor: 'pointer',
                                        fontFamily: 'StratosSemiLight',
                                        fontSize: '16px'
                                    }}
                                >
                                    Сбросить фильтры
                                </button>
                            )}
                        </div>
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