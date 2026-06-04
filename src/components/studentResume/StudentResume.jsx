import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import "./studentResume.css";
// Плейсхолдер аватара, когда у студента нет фото
const PLACEHOLDER_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Ccircle fill='%23444' cx='100' cy='100' r='100'/%3E%3Ccircle fill='%23666' cx='100' cy='82' r='28'/%3E%3Cellipse fill='%23666' cx='100' cy='165' rx='45' ry='38'/%3E%3C/svg%3E";
import mailIcon from "../../assets/icons/mailIcon.svg";
import arrowSmallIcon from "../../assets/icons/arrow_small.svg";
import BehindOrange from "../../assets/other/BehindOrange.png";
import BehindPink from "../../assets/other/BehindPink.png";
import BehindBlue from "../../assets/other/BehindBlue.png";
import {
    getStudentById,
    getPortfolioByStudentId,
    getExperienceDetailsByStudentId,
    getAllStudents,
    getSkillsByStudentId,
    getEducationDetailsByStudentId
} from "../../services/studentApi.js";
import StudentSliderCard from "../studentSlider/studentSliderCard/StudentSliderCard.jsx";
import ApplicationForm from "../applicationForm/ApplicationForm.jsx";
import numbersImg from "../../assets/other/numbers.png";
import sunIcon from "../../assets/other/sun.png";
import cloudMailIcon from "../../assets/other/cloudMail.png";
import { hasStudentProfilePhoto } from "../../utils/hasStudentProfilePhoto.js";
import { formatExperiencePeriodText } from "../../utils/formatExperiencePeriod.js";
import GradientButton from "../common/gradientButton/GradientButton.jsx";
import AnonymousApplyCTA from "../common/AnonymousApplyCTA.jsx";
import { getImageUrl } from "../../config/api.js";
import { isAuthenticated } from "../../services/authApi.js";

const StudentResume = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedExperience, setExpandedExperience] = useState(true);
    const [expandedEducation, setExpandedEducation] = useState(true);
    const [portfolio, setPortfolio] = useState([]);
    const [educationDetails, setEducationDetails] = useState([]);
    const [experienceDetails, setExperienceDetails] = useState([]);
    const [skills, setSkills] = useState([]);
    const [similarStudents, setSimilarStudents] = useState([]);
    const [showApplicationForm, setShowApplicationForm] = useState(false);
    const [activeExperienceIndex, setActiveExperienceIndex] = useState(0);
    const experienceItemRefs = useRef([]);

    const portfolioBackgrounds = [BehindOrange, BehindPink, BehindBlue];

    useEffect(() => {
        const fetchStudent = async () => {
            if (!id) {
                setError('ID студента не указан');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                const studentData = await getStudentById(id);

                if (!studentData || !studentData.id) {
                    throw new Error('Студент не найден');
                }
                if (isAuthenticated() && !hasStudentProfilePhoto(studentData)) {
                    throw new Error('Студент не найден');
                }

                setStudent(studentData);

                if (studentData.skills && Array.isArray(studentData.skills)) {
                    setSkills(studentData.skills);
                }

                const [
                    portfolioResult,
                    educationResult,
                    experienceResult,
                    allStudentsResult
                ] = await Promise.allSettled([
                    getPortfolioByStudentId(id),
                    getEducationDetailsByStudentId(id),
                    getExperienceDetailsByStudentId(id),
                    getAllStudents()
                ]);

                if (portfolioResult.status === 'fulfilled') {
                    const portfolioData = portfolioResult.value;
                    setPortfolio(Array.isArray(portfolioData) ? portfolioData : []);
                }

                if (educationResult.status === 'fulfilled') {
                    const educationData = educationResult.value;

                    const formattedEducation = educationData.map((edu, index) => {
                        if (!edu || typeof edu !== 'object') {
                            return null;
                        }

                        return {
                            id: edu.id || `edu-${index}`,
                            name: edu.institution || 'Образовательное учреждение',
                            speciality: edu.additionalInfo || '',
                            startDate: edu.startYear ? edu.startYear.toString() : '',
                            endDate: edu.endYear ? edu.endYear.toString() :
                                (edu.current ? 'по настоящее время' : ''),
                            webUrl: edu.webUrl || '',
                            additionalInfo: edu.additionalInfo || ''
                        };
                    }).filter(item => item !== null);

                    setEducationDetails(formattedEducation);
                }

                if (experienceResult.status === 'fulfilled') {
                    const experienceData = experienceResult.value;
                    setExperienceDetails(Array.isArray(experienceData) ? experienceData : []);
                }

                if (allStudentsResult.status === 'fulfilled') {
                    const allStudents = allStudentsResult.value;
                    const similar = allStudents
                        .filter(hasStudentProfilePhoto)
                        .filter(s => {
                            const currentId = s.id ? s.id.toString() : s.id;
                            const targetId = id.toString();
                            return currentId !== targetId;
                        })
                        .slice(0, 6);
                    setSimilarStudents(similar || []);
                }

            } catch (err) {
                console.error('Fetch error:', err);
                if (err?.status !== 403) {
                    setError(err.message || 'Ошибка загрузки данных студента');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchStudent();
    }, [id]);

    const toggleExperience = () => {
        setExpandedExperience(!expandedExperience);
    };

    const toggleEducation = () => {
        setExpandedEducation(!expandedEducation);
    };

    useEffect(() => {
        experienceItemRefs.current = experienceItemRefs.current.slice(0, experienceDetails.length);
        if (activeExperienceIndex >= experienceDetails.length) {
            setActiveExperienceIndex(0);
        }
    }, [experienceDetails.length, activeExperienceIndex]);

    useEffect(() => {
        if (!expandedExperience || experienceDetails.length === 0) {
            return;
        }

        const items = experienceItemRefs.current.filter(Boolean);
        if (items.length === 0) return;

        const updateActiveByViewportCenter = () => {
            const viewportCenterY = window.innerHeight / 2;
            let nearestIndex = 0;
            let nearestDistance = Number.POSITIVE_INFINITY;

            items.forEach((item) => {
                const rect = item.getBoundingClientRect();
                const itemCenterY = rect.top + rect.height / 2;
                const distance = Math.abs(itemCenterY - viewportCenterY);
                const indexValue = Number(item.dataset.expIndex);

                if (!Number.isNaN(indexValue) && distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestIndex = indexValue;
                }
            });

            setActiveExperienceIndex((prev) => (prev === nearestIndex ? prev : nearestIndex));
        };

        updateActiveByViewportCenter();
        window.addEventListener('scroll', updateActiveByViewportCenter, { passive: true });
        window.addEventListener('resize', updateActiveByViewportCenter);

        return () => {
            window.removeEventListener('scroll', updateActiveByViewportCenter);
            window.removeEventListener('resize', updateActiveByViewportCenter);
        };
    }, [expandedExperience, experienceDetails]);

    const calculateAge = (birthDate) => {
        if (!birthDate) return null;
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    const getRandomPortfolioBackground = (index) => {
        return portfolioBackgrounds[index % portfolioBackgrounds.length];
    };

    const getPortfolioTextSizeClass = (project) => {
        const title = (project?.name || '').toString().trim();
        const description = (project?.description || project?.additionalInfo || '').toString().trim();
        const totalLength = title.length + description.length;

        if (totalLength > 220 || title.length > 48) return 'StudentResume__portfolioContent--dense';
        if (totalLength > 140 || title.length > 32) return 'StudentResume__portfolioContent--compact';
        return '';
    };

    const formatYearLabel = (value) => {
        if (!value) return '';
        const normalized = String(value).trim();
        if (!normalized) return '';
        if (normalized === 'по настоящее время') return normalized;
        return `${normalized} г.`;
    };

    const getStudentImageUrl = (studentData) => {
        if (!studentData) return PLACEHOLDER_AVATAR;

        const imagePath = studentData.imagePath || studentData.image || studentData.photo || studentData.avatar;

        if (!imagePath) return PLACEHOLDER_AVATAR;

        return getImageUrl(imagePath) || PLACEHOLDER_AVATAR;
    };

    if (loading) {
        return (
            <div className="StudentResume__loadingScreen" aria-label="Загрузка страницы резюме">
                <div className="StudentResume__loader"></div>
            </div>
        );
    }

    if (error || !student) {
        return (
            <section className="StudentResume">
                <div className="StudentResume__mainContent">
                    <div className="StudentResume__error">
                        <h2>Ошибка загрузки</h2>
                        <p>{error || 'Студент не найден'}</p>
                        <Link to="/students" className="StudentResume__backLink">
                            Вернуться к списку студентов
                        </Link>
                    </div>
                </div>
            </section>
        );
    }

    const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Имя не указано';
    const imageSrc = getStudentImageUrl(student);
    const age = calculateAge(student.birthDate);
    const ageText = age ? `${age} лет` : '';

    const displaySkills = skills.length > 0 ? skills : (student.skills || []);
    const portfolioWithLinks = (portfolio || []).filter((project) => {
        const link = project?.link || project?.url || project?.website;
        return Boolean(link && String(link).trim());
    });

    return (
        <section className="StudentResume">
            <div className="StudentResume__mainContent">
                <div className="StudentResume__wrapper">
                    <img src={numbersImg} alt="" className="StudentResume__numbersImg"/>
                    <div className="StudentResume__profile">
                        <div className="StudentResume__header">
                            <div className="StudentResume__person">
                                <div className="StudentResume__personFace">
                                    <img src={imageSrc} alt={`Фото ${fullName}`} width="236" height="236"/>
                                </div>

                                <div className="StudentResume__personName">
                                    <h2>{fullName}</h2>
                                    <p>{student.speciality || student.profession || 'Специальность не указана'}</p>
                                    <AnonymousApplyCTA target="student">
                                        <GradientButton
                                            as="button"
                                            type="button"
                                            className="StudentResume__sendBid"
                                            icon={<img src={mailIcon} alt="Иконка почты" />}
                                            onClick={() => setShowApplicationForm(true)}
                                        >
                                            Оставить заявку
                                        </GradientButton>
                                    </AnonymousApplyCTA>
                                </div>
                            </div>

                            <div className="StudentResume__flexInfo">
                                {ageText && <span>{ageText}</span>}
                                {student.city && <span>г. {student.city}</span>}
                                {student.hhLink && (
                                    <span>
                                        <a href={student.hhLink} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                                            Анкета hh.ru
                                        </a>
                                    </span>
                                )}
                                {student.email && (
                                    <span>
                                        <a href={`mailto:${student.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                            {student.email}
                                        </a>
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="StudentResume__about">
                            <div className="StudentResume__section">
                                <h3 className="StudentResume__sectionTitle">Обо мне</h3>
                                <p className="StudentResume__sectionText" style={{ whiteSpace: 'pre-line' }}>
                                    {student.bio || student.description || student.about || 'Информация о студенте отсутствует'}
                                </p>
                            </div>

                            <div className="StudentResume__section">
                                <h3 className="StudentResume__sectionTitle">Навыки</h3>
                                <div className="StudentResume__skills">
                                    {displaySkills.length > 0 ? (
                                        displaySkills.map((skill, index) => (
                                            <span key={skill.id || index} className="StudentResume__skillCapsule">
                                                {skill.name || skill.title || 'Навык'}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="StudentResume__skillCapsule">Навыки не указаны</span>
                                    )}
                                </div>
                            </div>

                            {portfolioWithLinks.length > 0 && (
                                <div className="StudentResume__section">
                                    <h3 className="StudentResume__sectionTitle">Портфолио и ссылки</h3>
                                    <div className="StudentResume__portfolio">
                                        {portfolioWithLinks.map((project, index) => (
                                            <a
                                                key={project.id || index}
                                                href={(project.link || project.url || project.website).toString().trim()}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="StudentResume__portfolioItem"
                                                style={{
                                                    backgroundImage: `url(${getRandomPortfolioBackground(index)})`,
                                                }}
                                            >
                                                <div className={`StudentResume__portfolioContent ${getPortfolioTextSizeClass(project)}`.trim()}>
                                                    {project.name && (
                                                        <p className="StudentResume__portfolioTitle">{project.name}</p>
                                                    )}

                                                    {project.description || project.additionalInfo ? (
                                                        <p className="StudentResume__portfolioDescription">
                                                            {project.description || project.additionalInfo}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <AnonymousApplyCTA target="student">
                                <GradientButton
                                    as="button"
                                    type="button"
                                    className="StudentResume__sendBid"
                                    icon={<img src={mailIcon} alt="Иконка почты" />}
                                    onClick={() => setShowApplicationForm(true)}
                                >
                                    Оставить заявку
                                </GradientButton>
                            </AnonymousApplyCTA>
                        </div>
                    </div>
                </div>

                <div className="StudentResume__additionalSections">
                    <div className="StudentResume__expandableSection">
                        <div className="StudentResume__expandableHeader" onClick={toggleExperience}>
                            <h3 className="StudentResume__expandableTitle">Опыт работы</h3>
                            <img
                                src={arrowSmallIcon}
                                alt=""
                                aria-hidden="true"
                                className={`StudentResume__expandableArrow ${expandedExperience ? 'expanded' : ''}`}
                            />
                        </div>

                        {expandedExperience && (
                            <div className="StudentResume__expandableContent StudentResume__expandableContent--bordered">
                                {experienceDetails.length > 0 ? (
                                    <div className="StudentResume__experienceWithTimeline">
                                        <div className="StudentResume__experienceList">
                                            {experienceDetails.map((exp, index) => (
                                                <article
                                                    key={exp.id || index}
                                                    ref={(el) => { experienceItemRefs.current[index] = el; }}
                                                    data-exp-index={index}
                                                    className={`StudentResume__experienceItem StudentResume__experienceItem--card ${activeExperienceIndex === index ? 'active' : ''}`}
                                                    tabIndex={0}
                                                    onFocus={() => setActiveExperienceIndex(index)}
                                                >
                                                    <div className="StudentResume__experienceTimeline">
                                                        <div className="StudentResume__experienceYears">
                                                            {formatExperiencePeriodText(exp.startDate, exp.endDate, exp.current)}
                                                        </div>
                                                    </div>

                                                    <div className="StudentResume__experienceInfo">
                                                        {exp.company?.trim() && (
                                                            <h3 className="StudentResume__experienceCompany">{exp.company}</h3>
                                                        )}
                                                        {exp.position?.trim() && (
                                                            <h4 className="StudentResume__experiencePosition">{exp.position}</h4>
                                                        )}
                                                        {exp.description && (
                                                            <p className="StudentResume__experienceDescription">{exp.description}</p>
                                                        )}
                                                    </div>
                                                </article>
                                            ))}
                                        </div>

                                        <div className="StudentResume__experienceTimelineNav" aria-label="Навигация по опыту">
                                            {experienceDetails.map((_, index) => (
                                                <button
                                                    key={`exp-dot-${index}`}
                                                    type="button"
                                                    className={`StudentResume__experienceTimelineDot ${activeExperienceIndex === index ? 'active' : ''}`}
                                                    onClick={() => {
                                                        const item = experienceItemRefs.current[index];
                                                        if (item) {
                                                            item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                            item.focus({ preventScroll: true });
                                                        }
                                                    }}
                                                    aria-label={`Опыт ${index + 1}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p>пока пусто :D</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="StudentResume__expandableSection">
                        <div className="StudentResume__expandableHeader" onClick={toggleEducation}>
                            <h3 className="StudentResume__expandableTitle">Образование</h3>
                            <img
                                src={arrowSmallIcon}
                                alt=""
                                aria-hidden="true"
                                className={`StudentResume__expandableArrow ${expandedEducation ? 'expanded' : ''}`}
                            />
                        </div>

                        {expandedEducation && (
                            <div className="StudentResume__expandableContent StudentResume__expandableContent--no-border">
                                {educationDetails.length > 0 ? (
                                    <div className="StudentResume__educationList">
                                        {educationDetails.map((edu, index) => (
                                            <div key={edu.id || index} className="StudentResume__educationItem">
                                                <div className="StudentResume__educationTimeline">
                                                    <div className="StudentResume__educationYears">
                                                        {edu.startDate && edu.endDate ? (
                                                            <span>
                                                                {`с ${formatYearLabel(edu.startDate)}`}
                                                                <br/>
                                                                {edu.endDate === 'по настоящее время'
                                                                    ? 'по настоящее время'
                                                                    : `по ${formatYearLabel(edu.endDate)}`}
                                                            </span>
                                                        ) : edu.startDate ? (
                                                            <span>{`с ${formatYearLabel(edu.startDate)}`}</span>
                                                        ) : edu.endDate ? (
                                                            <span>
                                                                {edu.endDate === 'по настоящее время'
                                                                    ? 'по настоящее время'
                                                                    : `по ${formatYearLabel(edu.endDate)}`}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                    <div className="StudentResume__educationVerticalLine"></div>
                                                </div>
                                                <div className="StudentResume__educationInfo">
                                                    <h3 className="StudentResume__educationName">{edu.name}</h3>
                                                    {edu.speciality && (
                                                        <p className="StudentResume__educationSpeciality">{edu.speciality}</p>
                                                    )}
                                                    {edu.webUrl && (
                                                        <a
                                                            href={edu.webUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="StudentResume__educationLink"
                                                        >
                                                            Узнать больше &#62;
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p>пока пусто :D</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="StudentResume__contactSection">
                    <h2 className="StudentResume__contactTitle">Свяжитесь со студентом</h2>
                    <div className="StudentResume__contactContent">
                        <div className="StudentResume__contactSlider">
                            {student && <StudentSliderCard student={student} isActive={true} />}
                        </div>

                        <div className="StudentResume__contactInfo">
                            <img src={sunIcon} alt="Sun_icon" className="StudentResume__sunIcon "/>
                            <div className="StudentResume__contactWrapper">
                                <p>Студент готов проходить стажировку в вашей компании!</p>
                                <AnonymousApplyCTA target="student">
                                    <button type="button" onClick={() => setShowApplicationForm(true)}>
                                        Связаться
                                        <img src={mailIcon} alt="Mail icon"/>
                                    </button>
                                </AnonymousApplyCTA>
                            </div>
                        </div>

                        <img
                            src={cloudMailIcon}
                            alt="Cloud mail icon"
                            className="StudentResume__cloudMailIcon"
                        />
                    </div>
                </div>

                {similarStudents.length > 0 && (
                    <div className="StudentResume__similarSection">
                        <h2 className="StudentResume__similarTitle">Студенты с похожими навыками</h2>
                        <div className="StudentResume__similarList">
                            {similarStudents.map((similarStudent) => (
                                <Link
                                    key={similarStudent.id}
                                    to={`/studentsResume/${similarStudent.id}`}
                                    className="StudentResume__similarLink"
                                    style={{ textDecoration: 'none', color: 'inherit' }}
                                >
                                    <StudentSliderCard student={similarStudent} isActive={false} />
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {showApplicationForm && (
                <ApplicationForm
                    studentName={fullName}
                    studentId={id}
                    onClose={() => setShowApplicationForm(false)}
                    onSubmit={async (formData) => {
                        console.log('Application for student:', fullName, formData);
                    }}
                    onGoToChats={(chatId) => {
                        setShowApplicationForm(false);
                        navigate(
                            chatId
                                ? `/chats?chatId=${encodeURIComponent(chatId)}`
                                : '/chats',
                        );
                    }}
                />
            )}
        </section>
    );
};

export default StudentResume;