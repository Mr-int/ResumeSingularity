import React, { useState, useEffect, useRef, useCallback } from "react";
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
    const [filteredStudents, setFilteredStudents] = useState([]);
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

    const searchRef = useRef(null);
    const filterRef = useRef(null);
    const searchInputRef = useRef(null);

    const calculateAge = (dateOfBirth) => {
        if (!dateOfBirth) return 0;
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const applyFilters = useCallback((students, filters, query) => {
        let result = [...students];

        if (filters.course) {
            result = result.filter(student => {
                const education = student.educationDetails || [];
                return education.some(edu => edu.course?.toString() === filters.course);
            });
        }

        if (filters.adult) {
            result = result.filter(student => {
                const age = calculateAge(student.dateOfBirth);
                return age >= 18;
            });
        }

        if (filters.specialty) {
            result = result.filter(student => {
                const skills = student.skills || [];
                return skills.some(skill =>
                    skill.name?.toLowerCase().includes(filters.specialty.name.toLowerCase()) ||
                    (filters.specialty.name === "Веб-разработчик" &&
                        (skill.name?.toLowerCase().includes("frontend") ||
                            skill.name?.toLowerCase().includes("backend") ||
                            skill.name?.toLowerCase().includes("fullstack"))) ||
                    (filters.specialty.name === "Аналитик данных" &&
                        skill.name?.toLowerCase().includes("аналитик")) ||
                    (filters.specialty.name === "Тестировщик" &&
                        skill.name?.toLowerCase().includes("тестиров"))
                );
            });
        }

        if (query.trim()) {
            const searchTerm = query.toLowerCase().trim();
            result = result.filter(student => {
                const fullName = `${student.firstName || ''} ${student.lastName || ''} ${student.middleName || ''}`.toLowerCase();
                const skillsText = (student.skills || []).map(skill => skill.name?.toLowerCase() || '').join(' ');
                const experienceText = (student.experience || []).map(exp =>
                    `${exp.position || ''} ${exp.company || ''}`.toLowerCase()
                ).join(' ');
                const educationText = (student.educationDetails || []).map(edu =>
                    `${edu.specialization || ''} ${edu.universityName || ''}`.toLowerCase()
                ).join(' ');

                return (
                    fullName.includes(searchTerm) ||
                    (student.email?.toLowerCase() || '').includes(searchTerm) ||
                    (student.phone || '').includes(searchTerm) ||
                    skillsText.includes(searchTerm) ||
                    experienceText.includes(searchTerm) ||
                    educationText.includes(searchTerm)
                );
            });
        }

        return result;
    }, []);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                const data = await getAllStudents();

                const studentsWithDetails = await Promise.all(
                    data.map(async (student) => {
                        try {
                            const educationDetails = student.educationDetails || [];
                            const skills = student.skills || [];
                            const experience = student.experience || [];

                            return {
                                ...student,
                                educationDetails,
                                skills,
                                experience
                            };
                        } catch (err) {
                            console.error(`Error processing student ${student.id}:`, err);
                            return student;
                        }
                    })
                );

                setAllStudents(studentsWithDetails);
                setFilteredStudents(studentsWithDetails);
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

    useEffect(() => {
        const filtered = applyFilters(allStudents, currentFilters, searchQuery);
        setFilteredStudents(filtered);
    }, [allStudents, currentFilters, searchQuery, applyFilters]);

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
        setSearchQuery(e.target.value);
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (isMobile) {
                setSearchExpanded(false);
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
            course: null,
            adult: false,
            specialty: null
        });
        setSearchQuery("");
        console.log('Filters reset');
    };

    const clearSearch = () => {
        setSearchQuery("");
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    };

    if (loading) {
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
                            <div className="studentsList__search-icon">
                                <img src={searchIcon} alt="search"/>
                            </div>
                            <input
                                ref={searchInputRef}
                                type="text"
                                className="studentsList__search"
                                placeholder="Профессия / Стэк ..."
                                autoFocus={searchExpanded}
                                value={searchQuery}
                                onChange={handleSearchChange}
                                onKeyDown={handleSearchKeyDown}
                            />
                            {searchQuery && (
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
                    {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
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