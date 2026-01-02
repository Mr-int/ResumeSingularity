import React, { useState, useEffect, useRef } from "react";
import "./studentsList.css";
import searchIcon from "../../assets/icons/searchIcon.svg";
import filterIcon from "../../assets/icons/filterIcon.svg";
import StudentsListCard from "./StudentsListCard/StudentsListCard.jsx";
import { getAllStudents } from "../../services/studentApi.js";

const StudentsList = () => {
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchExpanded, setSearchExpanded] = useState(false);
    const [filterExpanded, setFilterExpanded] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState({
        course: null,
        ageOver18: false,
        specialization: "",
        stack: ""
    });

    const searchRef = useRef(null);
    const filterRef = useRef(null);
    const modalRef = useRef(null);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                const data = await getAllStudents();
                setStudents(data);
                setFilteredStudents(data);
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
                if (filterExpanded && modalRef.current && !modalRef.current.contains(event.target) && filterRef.current && !filterRef.current.contains(event.target)) {
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
        applyFilters();
    }, [searchQuery, filters, students]);

    const applyFilters = () => {
        let result = [...students];

        if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase();
            result = result.filter(student =>
                (student.specialization && student.specialization.toLowerCase().includes(query)) ||
                (student.stack && student.stack.toLowerCase().includes(query)) ||
                (student.skills && student.skills.some(skill => skill.toLowerCase().includes(query)))
            );
        }

        if (filters.course !== null) {
            result = result.filter(student => student.course === filters.course);
        }

        if (filters.ageOver18) {
            result = result.filter(student => student.age > 18);
        }

        if (filters.specialization.trim() !== "") {
            result = result.filter(student =>
                student.specialization && student.specialization.toLowerCase().includes(filters.specialization.toLowerCase())
            );
        }

        if (filters.stack.trim() !== "") {
            result = result.filter(student =>
                student.stack && student.stack.toLowerCase().includes(filters.stack.toLowerCase())
            );
        }

        setFilteredStudents(result);
    };

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
    };

    const handleCourseSelect = (course) => {
        setFilters(prev => ({
            ...prev,
            course: prev.course === course ? null : course
        }));
    };

    const handleAgeToggle = () => {
        setFilters(prev => ({
            ...prev,
            ageOver18: !prev.ageOver18
        }));
    };

    const handleSpecializationChange = (e) => {
        setFilters(prev => ({
            ...prev,
            specialization: e.target.value
        }));
    };

    const handleStackChange = (e) => {
        setFilters(prev => ({
            ...prev,
            stack: e.target.value
        }));
    };

    const handleApplyFilters = () => {
        applyFilters();
        setFilterExpanded(false);
    };

    const handleResetFilters = () => {
        setFilters({
            course: null,
            ageOver18: false,
            specialization: "",
            stack: ""
        });
        setSearchQuery("");
        setFilteredStudents(students);
        setFilterExpanded(false);
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
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
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

                {filterExpanded && (
                    <div ref={modalRef} className="studentsList__modal">
                        <div className="studentsList__modal-content">
                            <div className="studentsList__filter-section">
                                <h3 className="studentsList__filter-title">Курс</h3>
                                <div className="studentsList__course-buttons">
                                    {[1, 2, 3, 4].map(course => (
                                        <button
                                            key={course}
                                            className={`studentsList__course-btn ${filters.course === course ? 'active' : ''}`}
                                            onClick={() => handleCourseSelect(course)}
                                        >
                                            {course}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="studentsList__filter-section">
                                <h3 className="studentsList__filter-title">Возраст</h3>
                                <div className="studentsList__age-checkbox">
                                    <input
                                        type="checkbox"
                                        id="ageOver18"
                                        checked={filters.ageOver18}
                                        onChange={handleAgeToggle}
                                    />
                                    <label htmlFor="ageOver18">Старше 18</label>
                                </div>
                            </div>

                            <div className="studentsList__filter-section">
                                <h3 className="studentsList__filter-title">Специальность</h3>
                                <input
                                    type="text"
                                    className="studentsList__filter-input"
                                    placeholder="Введите специальность"
                                    value={filters.specialization}
                                    onChange={handleSpecializationChange}
                                />
                            </div>

                            <div className="studentsList__filter-section">
                                <h3 className="studentsList__filter-title">Стэк</h3>
                                <input
                                    type="text"
                                    className="studentsList__filter-input"
                                    placeholder="Введите стэк"
                                    value={filters.stack}
                                    onChange={handleStackChange}
                                />
                            </div>

                            <div className="studentsList__modal-buttons">
                                <button
                                    className="studentsList__apply-btn"
                                    onClick={handleApplyFilters}
                                >
                                    Принять
                                </button>
                                <button
                                    className="studentsList__reset-btn"
                                    onClick={handleResetFilters}
                                >
                                    Сбросить
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="studentsList__cardsWrapper">
                    {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                            <StudentsListCard key={student.id} student={student} />
                        ))
                    ) : (
                        <p style={{color: '#fff'}}>Студенты не найдены</p>
                    )}
                </div>
            </div>
        </section>
    )
}

export default StudentsList;