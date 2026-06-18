import React, { useState, useEffect, useRef } from 'react';
import './studentSlider.css';
import filterIcon from "../../assets/icons/filterIcon.svg";
import sliderArrowIcon from "../../assets/icons/sliderArrowIcon.svg";
import StudentSliderCard from "./studentSliderCard/StudentSliderCard.jsx";
import StudentsListCard from "../studentsList/StudentsListCard/StudentsListCard.jsx";
import { getHomeSliderStudents } from "../../services/studentApi.js";
import { hasStudentProfilePhoto } from "../../utils/hasStudentProfilePhoto.js";
import { hasApprovedCatalogAccess, isAuthenticated } from "../../services/authApi.js";
import { PENDING_APPROVAL_MESSAGE } from "../../utils/apiErrors.js";
import { fetchAllRegistrationSkills } from "../../services/registrationCatalogApi.js";
import { buildSkillCatalogMap } from "../../utils/skills.js";
import GradientButton from "../common/gradientButton/GradientButton.jsx";

const StudentSlider = () => {
    const [searchValue, setSearchValue] = useState('');
    const [activeCardIndex, setActiveCardIndex] = useState(0);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [emptyReason, setEmptyReason] = useState(null);
    const [skillCatalogMap, setSkillCatalogMap] = useState(() => new Map());

    const searchInputRef = useRef(null);

    const total = students.length;
    const SPACERS_PER_SIDE = 2;
    const SLOTS_TOTAL = total > 0 ? SPACERS_PER_SIDE * 2 + total : 0;

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                const data = await getHomeSliderStudents();
                const visible = (Array.isArray(data) ? data : []).filter(hasStudentProfilePhoto);
                setStudents(visible);
                if (visible.length > 0) {
                    const middleIndex = Math.floor(visible.length / 2);
                    setActiveCardIndex(middleIndex);
                    setEmptyReason(null);
                } else if (!isAuthenticated()) {
                    setEmptyReason('empty');
                } else if (!hasApprovedCatalogAccess()) {
                    setEmptyReason('pending');
                } else {
                    setEmptyReason('empty');
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
        const loadSkillsCatalog = async () => {
            try {
                const data = await fetchAllRegistrationSkills();
                setSkillCatalogMap(buildSkillCatalogMap(data));
            } catch (err) {
                console.error('Failed to load skills catalog:', err);
                setSkillCatalogMap(new Map());
            }
        };

        loadSkillsCatalog();
    }, []);

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
                        <span className="studentSlider__searchText">Поиск</span>
                        <svg
                            className="studentSlider__searchIcon"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                        >
                            <circle cx="10" cy="10" r="7"></circle>
                            <line x1="15" y1="15" x2="21" y2="21"></line>
                        </svg>
                    </div>
                    <h2 className="studentSlider__title">Студенты</h2>
                    <button className="studentSlider__filter">
                        <span>Фильтр</span>
                        <img src={filterIcon} alt="Фильтр" />
                    </button>
                </div>

                {loading ? (
                    <div className="studentSlider__loading" role="status" aria-label="Загрузка">
                        <div className="appRouteLoader__spinner studentSlider__spinner" aria-hidden="true" />
                    </div>
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
                            {activeStudent && (
                                <StudentsListCard
                                    key={activeStudent.id}
                                    student={activeStudent}
                                    skillCatalogMap={skillCatalogMap}
                                />
                            )}
                        </div>

                        <GradientButton
                            as="link"
                            to="/students"
                            className="studentSlider__button"
                            icon={(
                                <svg className="button__icon" viewBox="0 0 24 24" aria-hidden="true">
                                    <circle cx="11" cy="11" r="7"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            )}
                        >
                            Смотреть всех студентов
                        </GradientButton>
                    </>
                ) : (
                    <div className="studentSlider__empty">
                        {emptyReason === 'pending' ? (
                            <>
                                <p className="studentSlider__emptyTitle">Аккаунт на проверке</p>
                                <p className="studentSlider__emptyText">{PENDING_APPROVAL_MESSAGE}</p>
                            </>
                        ) : emptyReason === 'guest' ? (
                            <>
                                <p className="studentSlider__emptyTitle">Войдите в аккаунт</p>
                                <p className="studentSlider__emptyText">
                                    Чтобы увидеть полный каталог студентов.
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="studentSlider__emptyTitle">Студенты скоро появятся</p>
                                <p className="studentSlider__emptyText">Пока нет карточек для показа в слайдере.</p>
                            </>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};

export default StudentSlider;
