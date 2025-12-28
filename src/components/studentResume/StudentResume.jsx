import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import "./studentResume.css";
import face from "../../assets/other/test.png";
import mailIcon from "../../assets/icons/mailIcon.svg";
import BehindOrange from "../../assets/other/BehindOrange.png";
import BehindPink from "../../assets/other/BehindPink.png";
import BehindBlue from "../../assets/other/BehindBlue.png";
import { getStudentById, getPortfolioByStudentId, getAllEducation, getAllExperience, getAllStudents, getInstitutionById, getExperienceById } from "../../services/studentApi.js";
import { getImageUrl } from "../../config/api.js";
import StudentSliderCard from "../studentSlider/studentSliderCard/StudentSliderCard.jsx";
import ApplicationForm from "../applicationForm/ApplicationForm.jsx";

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
    const [similarStudents, setSimilarStudents] = useState([]);
    const [showApplicationForm, setShowApplicationForm] = useState(false);

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
                const data = await getStudentById(id);
                setStudent(data);

                // Portfolio
                try {
                    const portfolioData = await getPortfolioByStudentId(id);
                    setPortfolio(portfolioData || []);
                } catch (err) {
                    console.error('Failed to fetch portfolio:', err);
                    setPortfolio([]);
                }

                // EDUCATION - ИСПРАВЛЕННЫЙ БЛОК
                try {
                    console.log('=== EDUCATION DEBUG ===');
                    console.log('Raw student.education:', data.education);

                    if (data.education && Array.isArray(data.education) && data.education.length > 0) {
                        const educationWithDetails = await Promise.all(
                            data.education.map(async (edu, index) => {
                                try {
                                    console.log(`[Education ${index}] Processing edu:`, edu);

                                    // Если это уже полный объект с данными
                                    if (typeof edu === 'object' && (edu.name || edu.institution || edu.speciality || edu.institutionId)) {
                                        console.log(`[Education ${index}] Using existing object:`, edu);
                                        return {
                                            ...edu,
                                            name: edu.name || edu.institution || `Образование ${index + 1}`
                                        };
                                    }

                                    // Если это ID учреждения - загружаем детали
                                    const institutionId = edu?.id || edu?.institutionId || edu;
                                    if (institutionId && typeof institutionId === 'number') {
                                        console.log(`[Education ${index}] Fetching institution details for ID:`, institutionId);
                                        const details = await getInstitutionById(institutionId);
                                        console.log(`[Education ${index}] Institution details:`, details);

                                        if (details && (details.name || details.institution)) {
                                            return {
                                                ...details,
                                                name: details.name || details.institution
                                            };
                                        }
                                        return {
                                            id: institutionId,
                                            name: `Учреждение ID ${institutionId}`
                                        };
                                    }

                                    // Fallback для любых других случаев
                                    return {
                                        id: edu || `edu_${index}`,
                                        name: typeof edu === 'string' ? edu : `Образование ${index + 1}`
                                    };
                                } catch (err) {
                                    console.error(`[Education ${index}] Error processing:`, err);
                                    return {
                                        id: edu || `edu_${index}`,
                                        name: typeof edu === 'string' ? edu : `Образование ${index + 1}`,
                                        error: true
                                    };
                                }
                            })
                        );

                        console.log('Processed educationDetails:', educationWithDetails);
                        setEducationDetails(educationWithDetails);
                    } else {
                        console.log('No education data found');
                        setEducationDetails([]);
                    }
                } catch (err) {
                    console.error('Failed to process education:', err);
                    setEducationDetails(data.education || []);
                }
                console.log('=== END EDUCATION DEBUG ===');

                // EXPERIENCE
                try {
                    if (data.experience && Array.isArray(data.experience) && data.experience.length > 0) {
                        console.log('[StudentResume] Student experience IDs:', data.experience);

                        const experienceWithDetails = await Promise.all(
                            data.experience.map(async (exp) => {
                                try {
                                    const experienceId = exp?.id || exp?.experienceId || exp;
                                    if (experienceId) {
                                        console.log('[StudentResume] Fetching experience details for ID:', experienceId);
                                        const details = await getExperienceById(experienceId);
                                        console.log('[StudentResume] Experience details:', details);
                                        return details || exp;
                                    }
                                    return exp;
                                } catch (err) {
                                    console.error('Failed to fetch experience details:', err);
                                    return exp;
                                }
                            })
                        );

                        setExperienceDetails(experienceWithDetails || []);
                    } else {
                        setExperienceDetails([]);
                    }
                } catch (err) {
                    console.error('Failed to fetch experience:', err);
                    setExperienceDetails([]);
                }

                // Similar students
                try {
                    const allStudents = await getAllStudents();
                    const similar = allStudents
                        .filter(s => s.id !== parseInt(id) && s.id !== id)
                        .slice(0, 6);
                    setSimilarStudents(similar || []);
                } catch (err) {
                    console.error('Failed to fetch similar students:', err);
                    setSimilarStudents([]);
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

    const getRandomPortfolioBackground = (index) => {
        return portfolioBackgrounds[index % portfolioBackgrounds.length];
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
    const imagePath = student.imagePath || student.image;
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
                                    <button
                                        className="StudentResume__sendBid"
                                        onClick={() => setShowApplicationForm(true)}
                                    >
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
                                            <a
                                                key={project.id || index}
                                                href={project.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="StudentResume__portfolioItem"
                                                style={{
                                                    backgroundImage: `url(${getRandomPortfolioBackground(index)})`,
                                                }}
                                            >
                                                <div className="StudentResume__portfolioContent">
                                                    {project.name && (
                                                        <p className="StudentResume__portfolioTitle">{project.name}</p>
                                                    )}
                                                    {project.description && (
                                                        <p className="StudentResume__portfolioDescription">{project.description}</p>
                                                    )}
                                                </div>
                                            </a>
                                        ))
                                    ) : (
                                        <div className="StudentResume__portfolioItem" style={{ backgroundImage: `url(${getRandomPortfolioBackground(0)})` }}>
                                            <div className="StudentResume__portfolioContent">
                                                <p className="StudentResume__portfolioTitle">Проекты будут добавлены позже</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                className="StudentResume__sendBid"
                                onClick={() => setShowApplicationForm(true)}
                            >
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
                                    experienceDetails.map((exp, index) => (
                                        <div key={exp.id || index} style={{ marginBottom: '30px' }}>
                                            {exp.position && <h3>{exp.position}</h3>}
                                            {exp.company && <h2>{exp.company}</h2>}
                                            {exp.description && <p>{exp.description}</p>}
                                            {exp.startDate && exp.endDate && (
                                                <p>{exp.startDate} - {exp.endDate}</p>
                                            )}
                                            {!exp.startDate && exp.endDate && (
                                                <p>До {exp.endDate}</p>
                                            )}
                                            {exp.startDate && !exp.endDate && (
                                                <p>С {exp.startDate}</p>
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
                                    educationDetails.map((edu, index) => (
                                        <div key={edu.id || index} style={{ marginBottom: '30px' }}>
                                            <h2>{edu.name || edu.institution || 'Образовательное учреждение'}</h2>
                                            {edu.speciality && (
                                                <p className="StudentResume__educationSubtitle">{edu.speciality}</p>
                                            )}
                                            {edu.startDate && edu.endDate && (
                                                <p>{edu.startDate} - {edu.endDate}</p>
                                            )}
                                            {!edu.startDate && edu.endDate && (
                                                <p>До {edu.endDate}</p>
                                            )}
                                            {edu.startDate && !edu.endDate && (
                                                <p>С {edu.startDate}</p>
                                            )}
                                            {edu.error && <p style={{ color: 'red' }}>Ошибка загрузки данных</p>}
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
                            {student && <StudentSliderCard student={student} />}
                        </div>
                        <div className="StudentResume__contactInfo">
                            <p>Готов проходить стажировку в вашей компании!</p>
                            {(educationDetails.length > 0 || experienceDetails.length > 0) && (
                                <div className="StudentResume__contactDetails">
                                    {educationDetails.length > 0 && (
                                        <div className="StudentResume__contactDetailItem">
                                            <h4>Образование:</h4>
                                            {educationDetails.slice(0, 2).map((edu, index) => (
                                                <p key={index}>
                                                    {edu.name || edu.institution || 'Образовательное учреждение'}
                                                    {edu.speciality && ` - ${edu.speciality}`}
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                    {experienceDetails.length > 0 && (
                                        <div className="StudentResume__contactDetailItem">
                                            <h4>Опыт работы:</h4>
                                            {experienceDetails.slice(0, 2).map((exp, index) => (
                                                <p key={index}>
                                                    {exp.position || 'Должность'}
                                                    {exp.company && ` в ${exp.company}`}
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {similarStudents.length > 0 && (
                    <div className="StudentResume__similarSection">
                        <h2 className="StudentResume__similarTitle">Похожие студенты</h2>
                        <div className="StudentResume__similarList">
                            {similarStudents.map((similarStudent) => (
                                <Link
                                    key={similarStudent.id}
                                    to={`/studentsResume/${similarStudent.id}`}
                                    className="StudentResume__similarLink"
                                    style={{ textDecoration: 'none', color: 'inherit' }}
                                >
                                    <StudentSliderCard student={similarStudent} />
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {showApplicationForm && (
                <ApplicationForm
                    studentName={fullName}
                    onClose={() => setShowApplicationForm(false)}
                    onSubmit={async (formData) => {
                        console.log('Application for student:', fullName, formData);
                    }}
                />
            )}
        </section>
    );
};

export default StudentResume;
