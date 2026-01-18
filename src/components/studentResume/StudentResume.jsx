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

// Простой временный компонент для отладки
const DebugStudentSliderCard = ({ student, isActive }) => {
    console.log('DebugStudentSliderCard student:', student);

    if (!student || typeof student !== 'object') {
        console.error('DebugStudentSliderCard: invalid student', student);
        return <div>Нет данных</div>;
    }

    return (
        <div style={{ border: '1px solid #ccc', padding: '10px', margin: '10px' }}>
            <h4>Студент (отладка)</h4>
            <p>ID: {student.id || 'нет'}</p>
            <p>Имя: {student.firstName || student.name || 'нет'}</p>
            <p>Фамилия: {student.lastName || 'нет'}</p>
        </div>
    );
};

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

                console.log('Fetching student with ID:', id);
                const studentData = await getStudentById(id);
                console.log('Raw student data:', studentData);

                if (!studentData || typeof studentData !== 'object') {
                    throw new Error('Студент не найден или данные некорректны');
                }

                if (!studentData.id) {
                    console.warn('Student data missing id:', studentData);
                }

                setStudent(studentData);

                // Проверяем и логируем навыки
                console.log('Student skills raw:', studentData.skills);
                if (studentData.skills) {
                    if (Array.isArray(studentData.skills)) {
                        console.log('Skills is array, length:', studentData.skills.length);
                        setSkills(studentData.skills);
                    } else if (typeof studentData.skills === 'string') {
                        const skillsArray = studentData.skills.split(',').map(skill => ({
                            id: Math.random().toString(36).substr(2, 9),
                            name: skill.trim()
                        }));
                        console.log('Skills parsed from string:', skillsArray);
                        setSkills(skillsArray);
                    } else {
                        console.warn('Skills is not array or string:', typeof studentData.skills, studentData.skills);
                        setSkills([]);
                    }
                } else {
                    setSkills([]);
                }

                const [
                    portfolioResult,
                    educationResult,
                    experienceResult,
                    allStudentsResult
                ] = await Promise.allSettled([
                    getPortfolioByStudentId(id),
                    getEducationByStudentId(id),
                    getExperienceByStudentId(id),
                    getAllStudents()
                ]);

                console.log('=== API RESULTS ===');
                console.log('Portfolio result:', portfolioResult);
                console.log('Education result:', educationResult);
                console.log('Experience result:', experienceResult);
                console.log('All students result:', allStudentsResult);

                // Обработка портфолио
                if (portfolioResult.status === 'fulfilled') {
                    const portfolioData = portfolioResult.value;
                    console.log('Portfolio raw data:', portfolioData);

                    let portfolioArray = [];
                    if (Array.isArray(portfolioData)) {
                        portfolioArray = portfolioData;
                    } else if (portfolioData && portfolioData.data && Array.isArray(portfolioData.data)) {
                        portfolioArray = portfolioData.data;
                    } else if (portfolioData && portfolioData.content && Array.isArray(portfolioData.content)) {
                        portfolioArray = portfolioData.content;
                    }

                    console.log('Portfolio array:', portfolioArray);
                    setPortfolio(portfolioArray);
                }

                // Обработка образования - ВНИМАНИЕ: здесь может быть проблема
                if (educationResult.status === 'fulfilled') {
                    const educationData = educationResult.value;
                    console.log('Education raw data:', educationData);
                    console.log('Type of educationData:', typeof educationData);

                    let educationArray = [];
                    if (Array.isArray(educationData)) {
                        educationArray = educationData;
                    } else if (educationData && educationData.data && Array.isArray(educationData.data)) {
                        educationArray = educationData.data;
                    } else if (educationData && educationData.content && Array.isArray(educationData.content)) {
                        educationArray = educationData.content;
                    } else if (educationData && typeof educationData === 'object') {
                        console.error('Education data is object but not array structure:', educationData);
                        // Попробуем преобразовать объект в массив
                        if (educationData.id) {
                            educationArray = [educationData];
                        }
                    }

                    console.log('Education array before formatting:', educationArray);

                    const formattedEducation = educationArray.map((edu, index) => {
                        console.log(`Processing edu ${index}:`, edu);

                        if (!edu || typeof edu !== 'object') {
                            console.warn(`Invalid edu at index ${index}:`, edu);
                            return {
                                id: `edu-invalid-${index}`,
                                name: 'Некорректные данные',
                                speciality: '',
                                startDate: '',
                                endDate: '',
                                webUrl: '',
                                additionalInfo: ''
                            };
                        }

                        // Обратите внимание: startYear и endYear могут быть числами
                        const startYear = edu.startYear;
                        const endYear = edu.endYear;

                        return {
                            id: edu.id || `edu-${index}`,
                            name: edu.institution || edu.name || edu.institutionName ||
                                edu.educationalInstitution || 'Образовательное учреждение',
                            speciality: edu.speciality || edu.fieldOfStudy ||
                                edu.additionalInfo || edu.degree || edu.specialty || '',
                            startDate: startYear ? startYear.toString() :
                                edu.startDate || edu.start || '',
                            endDate: endYear ? endYear.toString() :
                                edu.endDate || edu.end ||
                                (edu.current ? 'по настоящее время' : ''),
                            webUrl: edu.webUrl || edu.website || edu.url || '',
                            additionalInfo: edu.additionalInfo || edu.description || '',
                            // Сохраняем оригинальные данные для отладки
                            _original: edu
                        };
                    });

                    console.log('Formatted education:', formattedEducation);
                    setEducationDetails(formattedEducation);
                }

                // Обработка опыта работы
                if (experienceResult.status === 'fulfilled') {
                    const experienceData = experienceResult.value;
                    console.log('Experience raw data:', experienceData);

                    let experienceArray = [];
                    if (Array.isArray(experienceData)) {
                        experienceArray = experienceData;
                    } else if (experienceData && experienceData.data && Array.isArray(experienceData.data)) {
                        experienceArray = experienceData.data;
                    } else if (experienceData && experienceData.content && Array.isArray(experienceData.content)) {
                        experienceArray = experienceData.content;
                    }

                    console.log('Experience array:', experienceArray);

                    const formattedExperience = experienceArray.map((exp, index) => {
                        if (!exp || typeof exp !== 'object') {
                            console.warn(`Invalid exp at index ${index}:`, exp);
                            return {
                                id: `exp-invalid-${index}`,
                                position: '',
                                company: '',
                                description: '',
                                startDate: '',
                                endDate: '',
                                current: false
                            };
                        }

                        return {
                            id: exp.id || `exp-${index}`,
                            position: exp.position || exp.jobTitle || exp.post || '',
                            company: exp.company || exp.companyName || exp.employer || exp.organization || '',
                            description: exp.description || exp.additionalInfo ||
                                exp.responsibilities || exp.duties || '',
                            startDate: exp.startDate || exp.startYear ||
                                exp.startMonthYear || exp.start || '',
                            endDate: exp.endDate || exp.endYear ||
                                exp.endMonthYear || exp.end ||
                                (exp.current ? 'по настоящее время' : ''),
                            current: exp.current || exp.endDate === null || false
                        };
                    });

                    setExperienceDetails(formattedExperience);
                }

                // Обработка похожих студентов
                if (allStudentsResult.status === 'fulfilled') {
                    const allStudents = allStudentsResult.value;
                    console.log('All students raw:', allStudents);

                    let studentsArray = [];
                    if (Array.isArray(allStudents)) {
                        studentsArray = allStudents;
                    } else if (allStudents && allStudents.data && Array.isArray(allStudents.data)) {
                        studentsArray = allStudents.data;
                    } else if (allStudents && allStudents.content && Array.isArray(allStudents.content)) {
                        studentsArray = allStudents.content;
                    }

                    console.log('Students array:', studentsArray);

                    const similar = studentsArray
                        .filter(s => {
                            if (!s || !s.id) {
                                console.warn('Invalid student in allStudents:', s);
                                return false;
                            }
                            const currentId = s.id.toString();
                            const targetId = id.toString();
                            return currentId !== targetId;
                        })
                        .slice(0, 6);

                    console.log('Similar students:', similar);
                    setSimilarStudents(similar);
                }

            } catch (err) {
                console.error('Fetch error:', err);
                setError(err.message || 'Ошибка загрузки данных студента');
            } finally {
                setLoading(false);
                console.log('=== FINAL STATE ===');
                console.log('student:', student);
                console.log('skills:', skills);
                console.log('portfolio:', portfolio);
                console.log('educationDetails:', educationDetails);
                console.log('experienceDetails:', experienceDetails);
                console.log('similarStudents:', similarStudents);
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
        try {
            const today = new Date();
            const birth = new Date(birthDate);
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            return age;
        } catch (e) {
            console.error('Error calculating age:', e);
            return null;
        }
    };

    const getRandomPortfolioBackground = (index) => {
        return portfolioBackgrounds[index % portfolioBackgrounds.length];
    };

    const getStudentImageUrl = (studentData) => {
        if (!studentData) return face;

        const imagePath = studentData.imagePath || studentData.image ||
            studentData.photo || studentData.avatar || studentData.profileImage;

        if (!imagePath) return face;

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

    const displaySkills = Array.isArray(skills) && skills.length > 0 ?
        skills :
        (Array.isArray(student.skills) ? student.skills : []);

    return (
        <section className="StudentResume">
            <div className="StudentResume__mainContent">
                <div className="StudentResume__wrapper">
                    <img src={numbersImg} alt="" className="StudentResume__numbersImg"/>
                    <div className="StudentResume__profile">
                        <div className="StudentResume__header">
                            <div className="StudentResume__person">
                                <div className="StudentResume__personFace">
                                    <img
                                        src={imageSrc}
                                        alt={`Фото ${fullName}`}
                                        width="300"
                                        height="300"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = face;
                                        }}
                                    />
                                </div>

                                <div className="StudentResume__personName">
                                    <h2>{fullName}</h2>
                                    <p>{student.speciality || student.profession || student.specialty || 'Специальность не указана'}</p>
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
                                    {student.bio || student.description || student.about || student.biography || 'Информация о студенте отсутствует'}
                                </p>
                            </div>

                            <div className="StudentResume__section">
                                <h3 className="StudentResume__sectionTitle">Навыки</h3>
                                <div className="StudentResume__skills">
                                    {displaySkills.length > 0 ? (
                                        displaySkills.map((skill, index) => {
                                            const skillName = skill.name || skill.title || skill.skillName || 'Навык';
                                            const skillId = skill.id || `skill-${index}`;
                                            return (
                                                <span key={skillId} className="StudentResume__skillCapsule">
                                                    {skillName}
                                                </span>
                                            );
                                        })
                                    ) : (
                                        <span className="StudentResume__skillCapsule">Навыки не указаны</span>
                                    )}
                                </div>
                            </div>

                            <div className="StudentResume__section">
                                <h3 className="StudentResume__sectionTitle">Портфолио и ссылки</h3>
                                <div className="StudentResume__portfolio">
                                    {portfolio.length > 0 ? (
                                        portfolio.map((project, index) => {
                                            if (!project) return null;
                                            const projectId = project.id || `project-${index}`;
                                            const projectName = project.name || project.title || 'Проект';
                                            const projectLink = project.link || project.url || project.website || '#';
                                            const projectDescription = project.description || project.additionalInfo || '';

                                            return (
                                                <a
                                                    key={projectId}
                                                    href={projectLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="StudentResume__portfolioItem"
                                                    style={{
                                                        backgroundImage: `url(${getRandomPortfolioBackground(index)})`,
                                                    }}
                                                >
                                                    <div className="StudentResume__portfolioContent">
                                                        <p className="StudentResume__portfolioTitle">{projectName}</p>
                                                        {projectDescription && (
                                                            <p className="StudentResume__portfolioDescription">
                                                                {projectDescription}
                                                            </p>
                                                        )}
                                                    </div>
                                                </a>
                                            );
                                        })
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
                                        {experienceDetails.map((exp, index) => {
                                            if (!exp) return null;
                                            const expId = exp.id || `exp-${index}`;
                                            return (
                                                <div key={expId} className="StudentResume__experienceItem">
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
                                            );
                                        })}
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
                                        {educationDetails.map((edu, index) => {
                                            if (!edu) return null;
                                            const eduId = edu.id || `edu-${index}`;
                                            return (
                                                <div key={eduId} className="StudentResume__educationItem">
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
                                            );
                                        })}
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
                            {/* Временно используем Debug компонент */}
                            <DebugStudentSliderCard student={student} isActive={true} />
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
                            {similarStudents.map((similarStudent, index) => {
                                if (!similarStudent) return null;

                                return (
                                    <div key={similarStudent.id || `similar-${index}`} style={{ margin: '10px' }}>
                                        <DebugStudentSliderCard student={similarStudent} isActive={false} />
                                    </div>
                                );
                            })}
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