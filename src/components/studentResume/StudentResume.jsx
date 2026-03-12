import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import "./studentResume.css";
// Плейсхолдер аватара, когда у студента нет фото
const PLACEHOLDER_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Ccircle fill='%23444' cx='100' cy='100' r='100'/%3E%3Ccircle fill='%23666' cx='100' cy='82' r='28'/%3E%3Cellipse fill='%23666' cx='100' cy='165' rx='45' ry='38'/%3E%3C/svg%3E";
import mailIcon from "../../assets/icons/mailIcon.svg";
import BehindOrange from "../../assets/other/BehindOrange.png";
import BehindPink from "../../assets/other/BehindPink.png";
import BehindBlue from "../../assets/other/BehindBlue.png";
import {
    getStudentById,
    getPortfolioByStudentId,
    getExperienceByStudentId,
    getAllStudents,
    getSkillsByStudentId,
    getEducationDetailsByStudentId
} from "../../services/studentApi.js";
import StudentSliderCard from "../studentSlider/studentSliderCard/StudentSliderCard.jsx";
import ApplicationForm from "../applicationForm/ApplicationForm.jsx";
import numbersImg from "../../assets/other/numbers.png";
import sunIcon from "../../assets/other/sun.png";
import cloudMailIcon from "../../assets/other/cloudMail.png";

const StudentResume = () => {
    const { id } = useParams();
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
                    getExperienceByStudentId(id),
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

                    let experienceArray = [];
                    if (Array.isArray(experienceData)) {
                        experienceArray = experienceData;
                    }

                    const formattedExperience = experienceArray.map((exp, index) => {
                        if (!exp || typeof exp !== 'object') {
                            return null;
                        }

                        const experience = exp.experience || {};
                        const company = exp.company || {};

                        return {
                            id: experience.id || exp.experienceId || `exp-${index}`,
                            position: experience.position || exp.position || exp.jobTitle || '',
                            company: company.name || exp.companyName || exp.employer || '',
                            description: experience.additionalInfo || exp.description ||
                                experience.responsibilities || '',
                            startDate: experience.startDate || exp.startDate || '',
                            endDate: experience.endDate || exp.endDate ||
                                (experience.current ? 'по настоящее время' : ''),
                            current: experience.current || exp.current || false
                        };
                    }).filter(item => item !== null);

                    setExperienceDetails(formattedExperience);
                }

                if (allStudentsResult.status === 'fulfilled') {
                    const allStudents = allStudentsResult.value;
                    const similar = allStudents
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
                setError(err.message || 'Ошибка загрузки данных студента');
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

    const getStudentImageUrl = (studentData) => {
        if (!studentData) return PLACEHOLDER_AVATAR;

        const imagePath = studentData.imagePath || studentData.image || studentData.photo || studentData.avatar;

        if (!imagePath) return PLACEHOLDER_AVATAR;

        if (imagePath.startsWith('http')) {
            return imagePath;
        }

        const baseUrl = 'https://api.singularity-resume.ru/main/photo';
        const studentId = id;
        return `${baseUrl}/${studentId}.jpg`;
    };

    if (loading) {
        return (
            <section className="StudentResume">
                <div className="StudentResume__mainContent">
                    <div className="StudentResume__loading">
                        <p>Загрузка данных студента...</p>
                    </div>
                </div>
            </section>
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

    return (
        <section className="StudentResume">
            <div className="StudentResume__mainContent">
                <div className="StudentResume__wrapper">
                    <img src={numbersImg} alt="" className="StudentResume__numbersImg"/>
                    <div className="StudentResume__profile">
                        <div className="StudentResume__header">
                            <div className="StudentResume__person">
                                <div className="StudentResume__personFace">
                                    <img src={imageSrc} alt={`Фото ${fullName}`} width="300" height="300"/>
                                </div>

                                <div className="StudentResume__personName">
                                    <h2>{fullName}</h2>
                                    <p>{student.speciality || student.profession || 'Специальность не указана'}</p>
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

                            <div className="StudentResume__section">
                                <h3 className="StudentResume__sectionTitle">Портфолио и ссылки</h3>
                                <div className="StudentResume__portfolio">
                                    {portfolio.length > 0 ? (
                                        portfolio.map((project, index) => (
                                            <a
                                                key={project.id || index}
                                                href={project.link || project.url || project.website}
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

                                                    {project.description || project.additionalInfo ? (
                                                        <p className="StudentResume__portfolioDescription">
                                                            {project.description || project.additionalInfo}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </a>
                                        ))
                                    ) : (
                                        <div className="StudentResume__portfolioItem" style={{ backgroundImage: `url(${getRandomPortfolioBackground(0)})` }}>
                                            <div className="StudentResume__portfolioContent">
                                                <p className="StudentResume__portfolioTitle">Ссылки будут добавлены позже</p>
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
                                    <div className="StudentResume__experienceList">
                                        {experienceDetails.map((exp, index) => (
                                            <div key={exp.id || index} className="StudentResume__experienceItem">
                                                <div className="StudentResume__experienceTimeline">
                                                    <div className="StudentResume__experienceYears">
                                                        {exp.startDate && exp.endDate ? (
                                                            exp.endDate === 'по настоящее время' ? (
                                                                <span>{exp.startDate} - {exp.endDate}</span>
                                                            ) : (
                                                                <span>{exp.startDate} - {exp.endDate}</span>
                                                            )
                                                        ) : exp.startDate ? (
                                                            <span>С {exp.startDate}</span>
                                                        ) : exp.endDate ? (
                                                            <span>До {exp.endDate}</span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                                <div className="StudentResume__experienceInfo">
                                                    <h3 className="StudentResume__experiencePosition">{exp.position}</h3>
                                                    {exp.company && (
                                                        <h4 className="StudentResume__experienceCompany">{exp.company}</h4>
                                                    )}
                                                    {exp.description && (
                                                        <p className="StudentResume__experienceDescription">{exp.description}</p>
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

                    <div className="StudentResume__expandableSection">
                        <div className="StudentResume__expandableHeader" onClick={toggleEducation}>
                            <h3 className="StudentResume__expandableTitle">Образование</h3>
                            <span className={`StudentResume__expandableArrow ${expandedEducation ? 'expanded' : ''}`}></span>
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
                                                            <span>{edu.startDate} - {edu.endDate}<br/></span>
                                                        ) : edu.startDate ? (
                                                            <span>С {edu.startDate}</span>
                                                        ) : edu.endDate ? (
                                                            <span>До {edu.endDate}</span>
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
                                <button onClick={() => setShowApplicationForm(true)}>
                                    Связаться
                                    <img src={mailIcon} alt="Mail icon"/>
                                </button>
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
                />
            )}
        </section>
    );
};

export default StudentResume;