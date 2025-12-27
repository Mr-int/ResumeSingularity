import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./studentResume.css";
import face from "../../assets/other/test.png";
import mailIcon from "../../assets/icons/mailIcon.svg";
import { getStudentById, getPortfolioByStudentId, getInstitutionById, getExperienceById } from "../../services/studentApi.js";
import { getImageUrl } from "../../config/api.js";
import StudentSliderCard from "../studentSlider/studentSliderCard/StudentSliderCard.jsx";

const StudentResume = () => {
    const { id } = useParams();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedExperience, setExpandedExperience] = useState(false);
    const [expandedEducation, setExpandedEducation] = useState(false);
    const [portfolio, setPortfolio] = useState([]);
    const [educationDetails, setEducationDetails] = useState([]);
    const [experienceDetails, setExperienceDetails] = useState([]);

    useEffect(() => {
        const fetchStudent = async () => {
            if (!id) {
                setError('ID студента не указан');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const data = await getStudentById(id);
                setStudent(data);

                // Fetch portfolio projects
                try {
                    const portfolioData = await getPortfolioByStudentId(id);
                    setPortfolio(portfolioData || []);
                } catch (err) {
                    console.error('Failed to fetch portfolio:', err);
                    setPortfolio([]);
                }

                // Fetch education details if education IDs exist
                if (data.education && data.education.length > 0) {
                    const educationPromises = data.education
                        .filter(edu => edu.id || edu.institutionId)
                        .map(async (edu) => {
                            try {
                                const eduId = edu.id || edu.institutionId;
                                if (eduId) {
                                    const eduDetails = await getInstitutionById(eduId);
                                    return { ...edu, details: eduDetails };
                                }
                                return edu;
                            } catch (err) {
                                console.error('Failed to fetch education details:', err);
                                return edu;
                            }
                        });
                    const educationWithDetails = await Promise.all(educationPromises);
                    setEducationDetails(educationWithDetails);
                }

                // Fetch experience details if experience IDs exist
                if (data.experience && data.experience.length > 0) {
                    const experiencePromises = data.experience
                        .filter(exp => exp.id || exp.experienceId)
                        .map(async (exp) => {
                            try {
                                const expId = exp.id || exp.experienceId;
                                if (expId) {
                                    const expDetails = await getExperienceById(expId);
                                    return { ...exp, details: expDetails };
                                }
                                return exp;
                            } catch (err) {
                                console.error('Failed to fetch experience details:', err);
                                return exp;
                            }
                        });
                    const experienceWithDetails = await Promise.all(experiencePromises);
                    setExperienceDetails(experienceWithDetails);
                }
            } catch (err) {
                setError(err.message);
                console.error('Failed to fetch student:', err);
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

    if (loading) {
        return (
            <section className="StudentResume">
                <div className="StudentResume__mainContent">
                    <p>Загрузка данных студента...</p>
                </div>
            </section>
        );
    }

    if (error || !student) {
        return (
            <section className="StudentResume">
                <div className="StudentResume__mainContent">
                    <p>Ошибка загрузки: {error || 'Студент не найден'}</p>
                </div>
            </section>
        );
    }

    const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Имя не указано';
    const imagePath = student.image || student.imagePath;
    const imageSrc = imagePath ? getImageUrl(imagePath) : face;
    const age = calculateAge(student.birthDate);
    const ageText = age ? `${age}лет` : '';

    return (
        <section className="StudentResume">
            <div className="StudentResume__mainContent">
                <div className="StudentResume__wrapper">
                    <div className="StudentResume__profile">
                        <div className="StudentResume__header">
                            <div className="StudentResume__person">
                                <div className="StudentResume__personFace">
                                    <img src={imageSrc} alt={`Фото ${fullName}`} width="300" height="300"/>
                                </div>

                                <div className="StudentResume__personName">
                                    <h2>{fullName}</h2>
                                    <p>{student.speciality || 'Специальность не указана'}</p>
                                    <button className="StudentResume__sendBid">
                                        Оставить заявку
                                        <img src={mailIcon} alt="Иконка почты"/>
                                    </button>
                                </div>
                            </div>

                            <div className="StudentResume__flexInfo">
                                {ageText && <span>{ageText}</span>}
                                {student.city && <span>г.{student.city}</span>}
                                {student.hhLink && (
                                    <span>
                                        <a href={student.hhLink} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                                            Анкета hh.ru
                                        </a>
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="StudentResume__about">
                            <div className="StudentResume__section">
                                <h3 className="StudentResume__sectionTitle">Обо мне</h3>
                                <p className="StudentResume__sectionText">
                                    {student.bio || 'Информация о студенте отсутствует'}
                                </p>
                            </div>

                            <div className="StudentResume__section">
                                <h3 className="StudentResume__sectionTitle">Hard-скиллы (навыки)</h3>
                                <div className="StudentResume__skills">
                                    {student.skills && student.skills.length > 0 ? (
                                        student.skills.map((skill) => (
                                            <span key={skill.id} className="StudentResume__skillCapsule">
                                                {skill.name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="StudentResume__skillCapsule">Навыки не указаны</span>
                                    )}
                                </div>
                            </div>

                            <div className="StudentResume__section">
                                <h3 className="StudentResume__sectionTitle">Портфолио</h3>
                                <div className="StudentResume__portfolio">
                                    {portfolio && portfolio.length > 0 ? (
                                        portfolio.map((project, index) => (
                                            <div key={project.id || index} className="StudentResume__portfolioItem">
                                                {project.name && <p className="StudentResume__portfolioTitle">{project.name}</p>}
                                                {project.description && <p className="StudentResume__portfolioDescription">{project.description}</p>}
                                                {project.link && (
                                                    <a href={project.link} target="_blank" rel="noopener noreferrer" style={{ color: '#bdf7ff' }}>
                                                        Ссылка на проект
                                                    </a>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="StudentResume__portfolioItem">
                                            <p className="StudentResume__portfolioTitle">Проекты будут добавлены позже</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button className="StudentResume__sendBid">
                                Оставить заявку
                                <img src={mailIcon} alt="Иконка почты"/>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="StudentResume__additionalSections">
                    <div className="StudentResume__expandableSection">
                        <div className="StudentResume__expandableHeader" onClick={toggleExperience}>
                            <h3 className="StudentResume__expandableTitle">Опыт работы</h3>
                            <span className={`StudentResume__expandableArrow ${expandedExperience ? 'expanded' : ''}`}></span>
                        </div>

                        {expandedExperience && (
                            <div className="StudentResume__expandableContent StudentResume__expandableContent--bordered">
                                {experienceDetails.length > 0 ? (
                                    experienceDetails.map((exp, index) => {
                                        const expData = exp.details || exp;
                                        return (
                                            <div key={exp.id || index} style={{ marginBottom: '30px' }}>
                                                {expData.position && <h3>{expData.position}</h3>}
                                                {expData.company && <h2>{expData.company}</h2>}
                                                {expData.description && <p>{expData.description}</p>}
                                                {expData.startDate && expData.endDate && (
                                                    <p>{expData.startDate} - {expData.endDate}</p>
                                                )}
                                                {!expData.startDate && expData.endDate && (
                                                    <p>До {expData.endDate}</p>
                                                )}
                                                {expData.startDate && !expData.endDate && (
                                                    <p>С {expData.startDate}</p>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : student.experience && student.experience.length > 0 ? (
                                    student.experience.map((exp, index) => (
                                        <div key={index} style={{ marginBottom: '30px' }}>
                                            {exp.position && <h3>{exp.position}</h3>}
                                            {exp.company && <h2>{exp.company}</h2>}
                                            {exp.description && <p>{exp.description}</p>}
                                            {exp.startDate && exp.endDate && (
                                                <p>{exp.startDate} - {exp.endDate}</p>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p>пока пусто :D</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="StudentResume__expandableSection">
                        <div className="StudentResume__expandableHeader" onClick={toggleEducation}>
                            <h3 className="StudentResume__expandableTitle">Образование</h3>
                            <span className={`StudentResume__expandableArrow ${expandedEducation ? 'expanded' : ''}`}></span>
                        </div>

                        {expandedEducation && (
                            <div className="StudentResume__expandableContent StudentResume__expandableContent--no-border">
                                {educationDetails.length > 0 ? (
                                    educationDetails.map((edu, index) => {
                                        const eduData = edu.details || edu;
                                        return (
                                            <div key={edu.id || index} style={{ marginBottom: '30px' }}>
                                                {eduData.name || eduData.institution ? (
                                                    <h2>{eduData.name || eduData.institution}</h2>
                                                ) : null}
                                                {eduData.speciality && (
                                                    <p className="StudentResume__educationSubtitle">{eduData.speciality}</p>
                                                )}
                                                {eduData.startDate && eduData.endDate && (
                                                    <p>{eduData.startDate} - {eduData.endDate}</p>
                                                )}
                                                {!eduData.startDate && eduData.endDate && (
                                                    <p>До {eduData.endDate}</p>
                                                )}
                                                {eduData.startDate && !eduData.endDate && (
                                                    <p>С {eduData.startDate}</p>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : student.education && student.education.length > 0 ? (
                                    student.education.map((edu, index) => (
                                        <div key={index} style={{ marginBottom: '30px' }}>
                                            {edu.institution && <h2>{edu.institution}</h2>}
                                            {edu.speciality && (
                                                <p className="StudentResume__educationSubtitle">{edu.speciality}</p>
                                            )}
                                            {edu.startDate && edu.endDate && (
                                                <p>{edu.startDate} - {edu.endDate}</p>
                                            )}
                                        </div>
                                    ))
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
                            <StudentSliderCard />
                        </div>
                        <div className="StudentResume__contactInfo">
                            <p>Готов проходить стажировку в вашей компании!</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default StudentResume;