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
                        <h2 className="studentsList__title">Студенты</h2>

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
        </section>
    )
}

export default StudentsList;