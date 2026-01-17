import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import "./studentResume.css";
import face from "../../assets/other/test.png";
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
    getEducationByStudentId
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
                console.log('[StudentResume] Fetching data for student ID:', id);

                const studentData = await getStudentById(id);
                console.log('[StudentResume] Student data:', studentData);

                if (!studentData || !studentData.id) {
                    throw new Error('Студент не найден');
                }

                setStudent(studentData);

                const [
                    portfolioResult,
                    educationResult,
                    experienceResult,
                    skillsResult,
                    allStudentsResult
                ] = await Promise.allSettled([
                    getPortfolioByStudentId(id),
                    getEducationByStudentId(id),
                    getExperienceByStudentId(id),
                    getSkillsByStudentId(id),
                    getAllStudents()
                ]);

                console.log('[StudentResume] Portfolio result:', portfolioResult);
                console.log('[StudentResume] Education result:', educationResult);
                console.log('[StudentResume] Experience result:', experienceResult);
                console.log('[StudentResume] Skills result:', skillsResult);
                console.log('[StudentResume] All students result:', allStudentsResult);

                if (portfolioResult.status === 'fulfilled') {
                    console.log('[StudentResume] Portfolio data:', portfolioResult.value);
                    setPortfolio(Array.isArray(portfolioResult.value) ? portfolioResult.value : []);
                } else {
                    console.log('[StudentResume] Portfolio error:', portfolioResult.reason);
                    setPortfolio([]);
                }

                if (educationResult.status === 'fulfilled') {
                    const educationData = educationResult.value;
                    console.log('[StudentResume] Raw education data:', educationData);

                    if (Array.isArray(educationData)) {
                        const formattedEducation = educationData.map((edu, index) => {
                            console.log('[StudentResume] Education item:', edu);
                            return {
                                id: edu.id || index,
                                name: edu.institution || edu.name || edu.institutionName || 'Образовательное учреждение',
                                speciality: edu.speciality || edu.fieldOfStudy || edu.additionalInfo || edu.degree,
                                startDate: edu.startYear ? edu.startYear.toString() : edu.startDate || '',
                                endDate: edu.endYear ? edu.endYear.toString() : edu.endDate || '',
                                webUrl: edu.webUrl || edu.website,
                                additionalInfo: edu.additionalInfo || edu.description
                            };
                        });
                        console.log('[StudentResume] Formatted education:', formattedEducation);
                        setEducationDetails(formattedEducation);
                    } else {
                        console.log('[StudentResume] Education data is not array:', educationData);
                        setEducationDetails([]);
                    }
                } else {
                    console.log('[StudentResume] Education error:', educationResult.reason);
                    setEducationDetails([]);
                }

                if (experienceResult.status === 'fulfilled') {
                    const experienceData = experienceResult.value;
                    console.log('[StudentResume] Raw experience data:', experienceData);

                    if (Array.isArray(experienceData)) {
                        const formattedExperience = experienceData.map((exp, index) => {
                            console.log('[StudentResume] Experience item:', exp);
                            return {
                                id: exp.id || index,
                                position: exp.position || exp.jobTitle || '',
                                company: exp.company || exp.companyName || exp.employer || '',
                                description: exp.description || exp.additionalInfo || exp.responsibilities || '',
                                startDate: exp.startDate || exp.startYear || exp.startMonthYear || '',
                                endDate: exp.endDate || exp.endYear || exp.endMonthYear ||
                                    (exp.current ? 'по настоящее время' : ''),
                                current: exp.current || exp.endDate === null || false
                            };
                        });
                        console.log('[StudentResume] Formatted experience:', formattedExperience);
                        setExperienceDetails(formattedExperience);
                    } else {
                        console.log('[StudentResume] Experience data is not array:', experienceData);
                        setExperienceDetails([]);
                    }
                } else {
                    console.log('[StudentResume] Experience error:', experienceResult.reason);
                    setExperienceDetails([]);
                }

                if (skillsResult.status === 'fulfilled') {
                    const skillsData = skillsResult.value;
                    console.log('[StudentResume] Raw skills data:', skillsData);

                    if (Array.isArray(skillsData)) {
                        setSkills(skillsData);
                    } else if (skillsData && Array.isArray(skillsData.skills)) {
                        setSkills(skillsData.skills);
                    } else {
                        if (studentData.skills && Array.isArray(studentData.skills)) {
                            setSkills(studentData.skills);
                        } else {
                            setSkills([]);
                        }
                    }
                } else {
                    console.log('[StudentResume] Skills error:', skillsResult.reason);
                    if (studentData.skills && Array.isArray(studentData.skills)) {
                        setSkills(studentData.skills);
                    } else {
                        setSkills([]);
                    }
                }

                if (allStudentsResult.status === 'fulfilled') {
                    const allStudents = allStudentsResult.value;
                    console.log('[StudentResume] All students:', allStudents);
                    const similar = allStudents
                        .filter(s => {
                            const currentId = s.id ? s.id.toString() : s.id;
                            const targetId = id.toString();
                            return currentId !== targetId;
                        })
                        .slice(0, 6);
                    setSimilarStudents(similar || []);
                } else {
                    console.log('[StudentResume] All students error:', allStudentsResult.reason);
                    setSimilarStudents([]);
                }

            } catch (err) {
                console.error('[StudentResume] Fetch error:', err);
                setError(err.message || 'Ошибка загрузки данных студента');
            } finally {
                setLoading(false);
                console.log('[StudentResume] Loading finished');
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
        if (!studentData) return face;

        const imagePath = studentData.imagePath || studentData.image || studentData.photo || studentData.avatar;

        if (!imagePath) return face;

        if (imagePath.startsWith('http')) {
            return imagePath;
        }

        const baseUrl = 'https://api.singularity-resume.ru/main/photo';

        let studentId = id;
        if (imagePath.includes('/')) {
            const parts = imagePath.split('/');
            studentId = parts[parts.length - 1].replace('.jpg', '').replace('.png', '').replace('.jpeg', '');
        } else if (imagePath.includes('.')) {
            studentId = imagePath.split('.')[0];
        }

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

    console.log('[StudentResume] Render data:', {
        student,
        portfolio,
        educationDetails,
        experienceDetails,
        skills: displaySkills,
        similarStudents
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
                                <p className="StudentResume__sectionText">
                                    {student.bio || student.description || student.about || 'Информация о студенте отсутствует'}
                                </p>
                            </div>

                            <div className="StudentResume__section">
                                <h3 className="StudentResume__sectionTitle">Навыки</h3>
                                <div className="StudentResume__skills">
                                    {displaySkills.length > 0 ? (
                                        displaySkills.map((skill, index) => (
                                            <span key={skill.id || index} className="StudentResume__skillCapsule">
                                                {typeof skill === 'string' ? skill : skill.name || skill.title || 'Навык'}
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