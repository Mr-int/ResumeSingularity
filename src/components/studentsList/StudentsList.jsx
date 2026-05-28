import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import "./studentsList.css";
import searchIcon from "../../assets/icons/searchIcon.svg";
import filterIcon from "../../assets/icons/filterIcon.svg";
import arrowIcon from "../../assets/icons/arrow_small.svg";
import StudentsListCard from "./StudentsListCard/StudentsListCard.jsx";
import { filterStudentsPage, getAllSpecialities } from "../../services/studentApi.js";
import { hasStudentProfilePhoto } from "../../utils/hasStudentProfilePhoto.js";

const STUDENTS_PER_PAGE = 5;
const MAX_VISIBLE_PAGES = 5;

const mapCourseToApiEnum = (course) => {
    const map = {
        "1": "FIRST",
        "2": "SECOND",
        "3": "THIRD",
        "4": "FOURTH",
    };
    return map[course] || null;
};

const buildStudentFilterReq = (filters) => {
    const req = {};
    const search = filters.searchQuery?.trim();
    const selectedCourses = Array.isArray(filters.course) ? filters.course : [];
    const apiCourses = selectedCourses.map(mapCourseToApiEnum).filter(Boolean);

    if (search) req.findString = search;
    if (apiCourses.length > 0) req.course = apiCourses;
    if (filters.adult) req.bornAfter = "2006-01-01";
    const selectedSpecialties = Array.isArray(filters.specialty) ? filters.specialty : [];
    const specialtyIds = selectedSpecialties
        .map((specialty) => Number(specialty?.id))
        .filter((id) => Number.isFinite(id));
    if (specialtyIds.length > 0) req.specialitiesIds = specialtyIds;

    return req;
};

const FiltersModal = ({ showFilters, setShowFilters, onApplyFilters, onResetFilters, initialFilters, isMobile, filterRef, specialties }) => {
    const [selectedCourse, setSelectedCourse] = useState(
        Array.isArray(initialFilters.course) ? initialFilters.course : []
    );
    const [isAdult, setIsAdult] = useState(initialFilters.adult || false);
    const [selectedSpecialty, setSelectedSpecialty] = useState(
        Array.isArray(initialFilters.specialty) ? initialFilters.specialty : []
    );
    const [specialtyDropdownOpen, setSpecialtyDropdownOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

    const filtersRef = useRef(null);
    const specialtyBtnRef = useRef(null);
    const specialtyDropdownRef = useRef(null);

    useEffect(() => {
        if (showFilters && !isMobile && filterRef?.current) {
            const rect = filterRef.current.getBoundingClientRect();
            const dropdownWidth = 474;
            const marginFromEdge = 24;
            let left = rect.left + rect.width / 2 - dropdownWidth / 2;
            left = Math.max(marginFromEdge, left);
            left = Math.min(window.innerWidth - dropdownWidth - marginFromEdge, left);
            setDropdownPosition({
                top: rect.bottom + 12,
                left
            });
        }
    }, [showFilters, isMobile, filterRef]);

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
        setSelectedSpecialty((prev) => {
            const exists = prev.some((item) => item.id === specialty.id);
            if (exists) return prev.filter((item) => item.id !== specialty.id);
            return [...prev, specialty];
        });
    };

    const handleSpecialtyClick = (e) => {
        e.stopPropagation();
        setSpecialtyDropdownOpen(!specialtyDropdownOpen);
    };

    const handleCourseClick = (course) => {
        setSelectedCourse((prev) =>
            prev.includes(course) ? prev.filter((c) => c !== course) : [...prev, course]
        );
    };

    const handleApply = () => {
        onApplyFilters({
            course: selectedCourse,
            adult: isAdult,
            specialty: selectedSpecialty
        });
    };

    const handleReset = () => {
        setSelectedCourse([]);
        setIsAdult(false);
        setSelectedSpecialty([]);
        setSpecialtyDropdownOpen(false);
        onResetFilters();
    };

    if (!showFilters) return null;

    const filterContent = (
        <>
            <div className="filter-section">
                <h3 className="section-title">Курс</h3>
                <div className="course-buttons">
                    {["1", "2", "3", "4"].map((course) => (
                        <button
                            key={course}
                            className={`course-btn course-btn--${course} ${selectedCourse.includes(course) ? 'active' : ''}`}
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

            <div className="filter-section filter-section--specialty">
                <div className="specialty-select">
                    <button
                        ref={specialtyBtnRef}
                        className={`specialty-btn ${specialtyDropdownOpen ? 'active' : ''}`}
                        onClick={handleSpecialtyClick}
                    >
                        <span className="specialty-btn__text">
                            {selectedSpecialty.length > 0
                                ? `Специальности: ${selectedSpecialty.length}`
                                : "Специальность"}
                        </span>
                        <img src={arrowIcon} alt="" className="specialty-btn__arrow" />
                    </button>
                    <div
                        ref={specialtyDropdownRef}
                        className={`specialty-dropdown ${specialtyDropdownOpen ? 'open' : ''}`}
                    >
                        {specialties.map((specialty) => (
                            <div
                                key={specialty.id}
                                className={`specialty-option ${selectedSpecialty.some((item) => item.id === specialty.id) ? 'selected' : ''}`}
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
                    <span className="apply-btn__text">Принять</span>
                </button>
                <button className="action-btn reset-btn" onClick={(e) => { e.stopPropagation(); handleReset(); setShowFilters(false); }}>
                    Отмена
                </button>
            </div>
        </>
    );

    if (isMobile) {
        return ReactDOM.createPortal(
            <div
                className="filters-overlay"
                onClick={() => { setShowFilters(false); setSpecialtyDropdownOpen(false); }}
            >
                <div className="filters-container" ref={filtersRef} onClick={(e) => e.stopPropagation()}>
                    {filterContent}
                </div>
            </div>,
            document.body
        );
    }

    return ReactDOM.createPortal(
        <div
            className="filters-overlay filters-overlay--dropdown"
            onClick={() => { setShowFilters(false); setSpecialtyDropdownOpen(false); }}
        >
            <div
                className="filters-dropdown"
                style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
                ref={filtersRef}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="filters-dropdown__triangle" />
                <div className="filters-container filters-container--dropdown">
                    {filterContent}
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
    const [specialties, setSpecialties] = useState([]);
    const [currentFilters, setCurrentFilters] = useState({
        course: [],
        adult: false,
        specialty: [],
        searchQuery: "" // Добавляем searchQuery в фильтры
    });
    const [tempSearchQuery, setTempSearchQuery] = useState(""); // Для временного хранения значения в поле ввода
    const [currentPage, setCurrentPage] = useState(1);

    const searchRef = useRef(null);
    const filterRef = useRef(null);
    const searchInputRef = useRef(null);

    // Мемоизированная функция для получения студентов с фильтрами
    const fetchFilteredStudents = useCallback(async (filters) => {
        try {
            setLoading(true);

            const filterData = buildStudentFilterReq(filters);

            // /student/filter is pageable. В API page/size должны быть в query (?page=&size=),
            // а в ответе используем PageResponseStudentDTO { data, totalPages, totalElements }.
            const pageSize = 200;
            const maxPages = 200; // safety cap
            const byId = new Map();
            const first = await filterStudentsPage(filterData, { page: 0, size: pageSize });
            const totalPages = typeof first.totalPages === 'number' ? first.totalPages : 0;
            const pagesToFetch = Math.min(totalPages, maxPages);

            for (const s of first.data) {
                const key = s?.id != null ? String(s.id) : JSON.stringify(s);
                if (!byId.has(key)) byId.set(key, s);
            }

            for (let page = 1; page < pagesToFetch; page += 1) {
                const res = await filterStudentsPage(filterData, { page, size: pageSize });
                for (const s of res.data) {
                    const key = s?.id != null ? String(s.id) : JSON.stringify(s);
                    if (!byId.has(key)) byId.set(key, s);
                }
            }

            const all = Array.from(byId.values());
            console.log('[API] Received filtered students (all pages, deduped):', all);
            return all;
        } catch (err) {
            console.error('Failed to fetch filtered students:', err);
            if (err?.status !== 403) {
                setError(err.message);
            }
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const loadSpecialities = async () => {
            try {
                const data = await getAllSpecialities();
                const normalized = data
                    .map((item) => ({
                        id: String(item.id),
                        name: item.name || item.specialityName || `Специальность ${item.id}`
                    }))
                    .filter((item) => item.id && item.name)
                    .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
                setSpecialties(normalized);
            } catch (err) {
                console.error('Failed to load specialities:', err);
                setSpecialties([]);
            }
        };

        loadSpecialities();
    }, []);

    // Первоначальная загрузка данных
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setLoading(true);
                const data = await fetchFilteredStudents({
                    course: [],
                    adult: false,
                    specialty: [],
                    searchQuery: ""
                });
                setAllStudents(data);
            } catch (err) {
                if (err?.status !== 403) {
                    setError(err.message);
                }
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [fetchFilteredStudents]);

    // Применение фильтров при изменении currentFilters
    useEffect(() => {
        const applyFilters = async () => {
            const data = await fetchFilteredStudents(currentFilters);
            setAllStudents(data);
        };

        applyFilters();
    }, [currentFilters, fetchFilteredStudents]);

    useEffect(() => {
        setCurrentPage(1);
    }, [currentFilters]);

    useEffect(() => {
        const visibleStudentsCount = allStudents.filter(hasStudentProfilePhoto).length;
        const nextTotalPages = Math.max(1, Math.ceil(visibleStudentsCount / STUDENTS_PER_PAGE));
        setCurrentPage((prev) => Math.min(prev, nextTotalPages));
    }, [allStudents]);

    // Обработчик изменения размеров окна
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

    // Обработчик кликов вне элементов поиска/фильтра
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
        setTempSearchQuery(e.target.value); // Сохраняем во временное состояние
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // Применяем поиск только при нажатии Enter
            setCurrentFilters(prev => ({
                ...prev,
                searchQuery: tempSearchQuery
            }));
            if (isMobile) {
                setSearchExpanded(false);
            }
        }
    };

    const handleSearchSubmit = () => {
        // Применяем поиск при клике на иконку
        setCurrentFilters(prev => ({
            ...prev,
            searchQuery: tempSearchQuery
        }));
        if (isMobile) {
            setSearchExpanded(false);
        }
    };

    const handleFilterClick = () => {
        if (isMobile) {
            // На телефоне фильтр открывает нижнюю панель и не превращает кнопку в "десктопный" вариант
            setFilterExpanded(false);
            setSearchExpanded(false);
            setShowFilters(true);
            return;
        }

        setShowFilters(!showFilters);
    };

    const handleApplyFilters = (filters) => {
        console.log('[ACTION] Applying filters:', filters);
        setCurrentFilters(prev => ({
            ...prev,
            ...filters,
            searchQuery: prev.searchQuery // Сохраняем текущий поисковый запрос
        }));
    };

    const handleResetFilters = () => {
        console.log('[ACTION] Resetting filters');
        setCurrentFilters({
            course: [],
            adult: false,
            specialty: [],
            searchQuery: ""
        });
        setTempSearchQuery("");
    };

    const clearSearch = () => {
        setCurrentFilters(prev => ({
            ...prev,
            searchQuery: ""
        }));
        setTempSearchQuery("");
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    };

    if (loading) {
        return (
            <div className="appRouteLoader" aria-label="Загрузка страницы студентов">
                <div className="appRouteLoader__spinner"></div>
            </div>
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

    const hasActiveFilters =
        (Array.isArray(currentFilters.course) && currentFilters.course.length > 0) ||
        currentFilters.adult ||
        (Array.isArray(currentFilters.specialty) && currentFilters.specialty.length > 0) ||
        currentFilters.searchQuery;
    const visibleStudents = allStudents.filter(hasStudentProfilePhoto);
    const totalPages = Math.max(1, Math.ceil(visibleStudents.length / STUDENTS_PER_PAGE));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const pageStartIndex = (safeCurrentPage - 1) * STUDENTS_PER_PAGE;
    const paginatedStudents = visibleStudents.slice(pageStartIndex, pageStartIndex + STUDENTS_PER_PAGE);

    const getVisiblePages = () => {
        if (totalPages <= MAX_VISIBLE_PAGES) {
            return Array.from({ length: totalPages }, (_, index) => index + 1);
        }

        const halfWindow = Math.floor(MAX_VISIBLE_PAGES / 2);
        let startPage = safeCurrentPage - halfWindow;
        let endPage = safeCurrentPage + halfWindow;

        if (startPage < 1) {
            startPage = 1;
            endPage = MAX_VISIBLE_PAGES;
        }

        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = totalPages - MAX_VISIBLE_PAGES + 1;
        }

        return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
    };

    const visiblePages = getVisiblePages();
    const showLeftEllipsis = visiblePages[0] > 1;
    const showRightEllipsis = visiblePages[visiblePages.length - 1] < totalPages;

    const goToPage = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

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
                                onBlur={() => {
                                    // При потере фокуса можно применить поиск, если нужно
                                    // или просто сохранить значение в temp
                                }}
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
                            className={`studentsList__filter ${filterExpanded ? 'expanded' : ''} ${hasActiveFilters ? 'has-filters' : ''} ${showFilters ? 'studentsList__filter--open' : ''}`}
                            onClick={handleFilterClick}
                        >
                            <span>Фильтр</span>
                            <img src={filterIcon} alt="filter"/>
                            {hasActiveFilters && (
                                <span className="filter-badge"></span>
                            )}
                        </button>
                    </div>

                    {hasActiveFilters && (
                        <div className="active-filters">
                            {Array.isArray(currentFilters.course) && currentFilters.course.length > 0 && (
                                <div className="active-filter-tag">
                                    Курс: {currentFilters.course.join(", ")}
                                </div>
                            )}
                            {currentFilters.adult && (
                                <div className="active-filter-tag">
                                    Старше 18 лет
                                </div>
                            )}
                            {Array.isArray(currentFilters.specialty) && currentFilters.specialty.length > 0 && (
                                <div className="active-filter-tag">
                                    Спец.: {currentFilters.specialty.map((item) => item.name).join(", ")}
                                </div>
                            )}
                            {currentFilters.searchQuery && (
                                <div className="active-filter-tag">
                                    Поиск: "{currentFilters.searchQuery}"
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
                    {visibleStudents.length > 0 ? (
                        paginatedStudents.map((student) => (
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

                {visibleStudents.length > 0 && totalPages > 1 && (
                    <div className="studentsList__pagination" aria-label="Пагинация студентов">
                        <button
                            type="button"
                            className="studentsList__paginationBtn"
                            onClick={() => goToPage(safeCurrentPage - 1)}
                            disabled={safeCurrentPage === 1}
                        >
                            Назад
                        </button>

                        <div className="studentsList__paginationPages">
                            {showLeftEllipsis && (
                                <>
                                    <button
                                        type="button"
                                        className={`studentsList__pageNumber ${safeCurrentPage === 1 ? 'active' : ''}`}
                                        onClick={() => goToPage(1)}
                                    >
                                        1
                                    </button>
                                    <span className="studentsList__paginationEllipsis" aria-hidden="true">...</span>
                                </>
                            )}

                            {visiblePages.map((page) => (
                                <button
                                    key={page}
                                    type="button"
                                    className={`studentsList__pageNumber ${page === safeCurrentPage ? 'active' : ''}`}
                                    onClick={() => goToPage(page)}
                                >
                                    {page}
                                </button>
                            ))}

                            {showRightEllipsis && (
                                <>
                                    <span className="studentsList__paginationEllipsis" aria-hidden="true">...</span>
                                    <button
                                        type="button"
                                        className={`studentsList__pageNumber ${safeCurrentPage === totalPages ? 'active' : ''}`}
                                        onClick={() => goToPage(totalPages)}
                                    >
                                        {totalPages}
                                    </button>
                                </>
                            )}
                        </div>

                        <button
                            type="button"
                            className="studentsList__paginationBtn"
                            onClick={() => goToPage(safeCurrentPage + 1)}
                            disabled={safeCurrentPage === totalPages}
                        >
                            Вперед
                        </button>
                    </div>
                )}
            </div>

            <FiltersModal
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                onApplyFilters={handleApplyFilters}
                onResetFilters={handleResetFilters}
                initialFilters={currentFilters}
                isMobile={isMobile}
                filterRef={filterRef}
                specialties={specialties}
            />
        </section>
    )
}

export default StudentsList;