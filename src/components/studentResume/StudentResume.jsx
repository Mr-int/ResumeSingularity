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
                console.log('[StudentResume] Starting fetch for student:', id);

                const studentData = await getStudentById(id);
                console.log('[StudentResume] Student data received:', studentData);

                if (!studentData || !studentData.id) {
                    throw new Error('Студент не найден');
                }

                setStudent(studentData);
                console.log('[StudentResume] Student set:', studentData);

                if (studentData.skills && Array.isArray(studentData.skills)) {
                    console.log('[StudentResume] Setting skills from student data:', studentData.skills);
                    setSkills(studentData.skills);
                } else {
                    console.log('[StudentResume] No skills in student data');
                    setSkills([]);
                }

                console.log('[StudentResume] Fetching additional data...');
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

                console.log('[StudentResume] Portfolio result:', portfolioResult);
                console.log('[StudentResume] Education result:', educationResult);
                console.log('[StudentResume] Experience result:', experienceResult);
                console.log('[StudentResume] All students result:', allStudentsResult);

                if (portfolioResult.status === 'fulfilled') {
                    const portfolioData = portfolioResult.value;
                    console.log('[StudentResume] Portfolio data:', portfolioData);
                    setPortfolio(Array.isArray(portfolioData) ? portfolioData : []);
                } else {
                    console.log('[StudentResume] Portfolio error:', portfolioResult.reason);
                    setPortfolio([]);
                }

                if (educationResult.status === 'fulfilled') {
                    const educationData = educationResult.value;
                    console.log('[StudentResume] Raw education data:', educationData);
                    if (Array.isArray(educationData)) {
                        console.log('[StudentResume] Education array length:', educationData.length);
                        const formattedEducation = educationData.map((edu, index) => {
                            console.log('[StudentResume] Processing education item:', edu);
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
                        console.log('[StudentResume] Experience array length:', experienceData.length);
                        const formattedExperience = experienceData.map((exp, index) => {
                            console.log('[StudentResume] Processing experience item:', exp);
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
                    console.log('[StudentResume] Similar students:', similar);
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

    console.log('[StudentResume] Render data:', {
        student,
        portfolio,
        educationDetails,
        experienceDetails,
        skills: displaySkills,
        similarStudents,
        fullName,
        imageSrc
    });

    return (
        <section className="StudentResume" style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
            <div className="StudentResume__mainContent">
                <div className="StudentResume__wrapper">
                    <img src={numbersImg} alt="" className="StudentResume__numbersImg"/>
                    <div className="StudentResume__profile" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <div className="StudentResume__header">
                            <div className="StudentResume__person" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div className="StudentResume__personFace">
                                    <img
                                        src={imageSrc}
                                        alt={`Фото ${fullName}`}
                                        width="150"
                                        height="150"
                                        style={{ borderRadius: '50%', objectFit: 'cover', border: '3px solid #ccc' }}
                                        onError={(e) => {
                                            console.log('Image failed to load, using fallback');
                                            e.target.src = face;
                                        }}
                                    />
                                </div>

                                <div className="StudentResume__personName">
                                    <h2 style={{ margin: '0 0 10px 0', color: '#333' }}>{fullName}</h2>
                                    <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '16px' }}>
                                        {student.speciality || student.profession || 'Специальность не указана'}
                                    </p>
                                    <button
                                        className="StudentResume__sendBid"
                                        onClick={() => setShowApplicationForm(true)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '10px 20px',
                                            backgroundColor: '#007bff',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        Оставить заявку
                                        <img src={mailIcon} alt="Иконка почты" width="16" height="16"/>
                                    </button>
                                </div>
                            </div>

                            <div className="StudentResume__flexInfo" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '20px' }}>
                                {ageText && (
                                    <span style={{
                                        backgroundColor: '#e9ecef',
                                        padding: '5px 10px',
                                        borderRadius: '4px',
                                        fontSize: '14px'
                                    }}>
                                        {ageText}
                                    </span>
                                )}
                                {student.city && (
                                    <span style={{
                                        backgroundColor: '#e9ecef',
                                        padding: '5px 10px',
                                        borderRadius: '4px',
                                        fontSize: '14px'
                                    }}>
                                        г. {student.city}
                                    </span>
                                )}
                                {student.hhLink && (
                                    <span style={{
                                        backgroundColor: '#e9ecef',
                                        padding: '5px 10px',
                                        borderRadius: '4px',
                                        fontSize: '14px'
                                    }}>
                                        <a href={student.hhLink} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', textDecoration: 'none' }}>
                                            Анкета hh.ru
                                        </a>
                                    </span>
                                )}
                                {student.email && (
                                    <span style={{
                                        backgroundColor: '#e9ecef',
                                        padding: '5px 10px',
                                        borderRadius: '4px',
                                        fontSize: '14px'
                                    }}>
                                        <a href={`mailto:${student.email}`} style={{ color: '#007bff', textDecoration: 'none' }}>
                                            {student.email}
                                        </a>
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="StudentResume__about" style={{ marginTop: '30px' }}>
                            <div className="StudentResume__section" style={{ marginBottom: '25px' }}>
                                <h3 className="StudentResume__sectionTitle" style={{ margin: '0 0 10px 0', color: '#333' }}>Обо мне</h3>
                                <p className="StudentResume__sectionText" style={{
                                    whiteSpace: 'pre-line',
                                    margin: '0',
                                    color: '#555',
                                    lineHeight: '1.6'
                                }}>
                                    {student.bio || student.description || student.about || 'Информация о студенте отсутствует'}
                                </p>
                            </div>

                            <div className="StudentResume__section" style={{ marginBottom: '25px' }}>
                                <h3 className="StudentResume__sectionTitle" style={{ margin: '0 0 10px 0', color: '#333' }}>Навыки</h3>
                                <div className="StudentResume__skills" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {displaySkills.length > 0 ? (
                                        displaySkills.map((skill, index) => (
                                            <span
                                                key={skill.id || index}
                                                className="StudentResume__skillCapsule"
                                                style={{
                                                    backgroundColor: '#007bff',
                                                    color: 'white',
                                                    padding: '6px 12px',
                                                    borderRadius: '20px',
                                                    fontSize: '14px'
                                                }}
                                            >
                                                {skill.name || skill.title || 'Навык'}
                                            </span>
                                        ))
                                    ) : (
                                        <span style={{ color: '#999' }}>Навыки не указаны</span>
                                    )}
                                </div>
                            </div>

                            <div className="StudentResume__section" style={{ marginBottom: '25px' }}>
                                <h3 className="StudentResume__sectionTitle" style={{ margin: '0 0 10px 0', color: '#333' }}>Портфолио и ссылки</h3>
                                <div className="StudentResume__portfolio" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
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
                                                    width: '200px',
                                                    height: '150px',
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    borderRadius: '8px',
                                                    display: 'flex',
                                                    alignItems: 'flex-end',
                                                    textDecoration: 'none',
                                                    color: 'white',
                                                    position: 'relative'
                                                }}
                                            >
                                                <div className="StudentResume__portfolioContent" style={{
                                                    backgroundColor: 'rgba(0,0,0,0.7)',
                                                    padding: '10px',
                                                    width: '100%',
                                                    borderRadius: '0 0 8px 8px'
                                                }}>
                                                    {project.name && (
                                                        <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '14px' }}>
                                                            {project.name}
                                                        </p>
                                                    )}

                                                    {project.description || project.additionalInfo ? (
                                                        <p style={{ margin: '0', fontSize: '12px', opacity: '0.9' }}>
                                                            {project.description || project.additionalInfo}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </a>
                                        ))
                                    ) : (
                                        <div style={{
                                            width: '200px',
                                            height: '150px',
                                            backgroundImage: `url(${getRandomPortfolioBackground(0)})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <div style={{
                                                backgroundColor: 'rgba(255,255,255,0.9)',
                                                padding: '15px',
                                                borderRadius: '8px',
                                                textAlign: 'center'
                                            }}>
                                                <p style={{ margin: '0', color: '#333' }}>Ссылки будут добавлены позже</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                className="StudentResume__sendBid"
                                onClick={() => setShowApplicationForm(true)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 24px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    marginTop: '20px'
                                }}
                            >
                                Оставить заявку
                                <img src={mailIcon} alt="Иконка почты" width="18" height="18"/>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="StudentResume__additionalSections" style={{ marginTop: '30px' }}>
                    <div className="StudentResume__expandableSection" style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        padding: '20px',
                        marginBottom: '20px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        <div
                            className="StudentResume__expandableHeader"
                            onClick={toggleExperience}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            <h3 className="StudentResume__expandableTitle" style={{ margin: '0', color: '#333' }}>Опыт работы</h3>
                            <span
                                className={`StudentResume__expandableArrow ${expandedExperience ? 'expanded' : ''}`}
                                style={{
                                    display: 'inline-block',
                                    width: '10px',
                                    height: '10px',
                                    borderRight: '2px solid #333',
                                    borderBottom: '2px solid #333',
                                    transform: expandedExperience ? 'rotate(-135deg)' : 'rotate(45deg)',
                                    transition: 'transform 0.3s'
                                }}
                            ></span>
                        </div>

                        {expandedExperience && (
                            <div className="StudentResume__expandableContent StudentResume__expandableContent--bordered" style={{
                                marginTop: '15px',
                                paddingTop: '15px',
                                borderTop: '1px solid #eee'
                            }}>
                                {experienceDetails.length > 0 ? (
                                    <div className="StudentResume__experienceList">
                                        {experienceDetails.map((exp, index) => (
                                            <div key={exp.id || index} className="StudentResume__experienceItem" style={{
                                                marginBottom: '15px',
                                                paddingBottom: '15px',
                                                borderBottom: index < experienceDetails.length - 1 ? '1px solid #f0f0f0' : 'none'
                                            }}>
                                                <div className="StudentResume__experienceTimeline">
                                                    <div className="StudentResume__experienceYears" style={{
                                                        color: '#666',
                                                        fontSize: '14px',
                                                        marginBottom: '5px'
                                                    }}>
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
                                                    <h3 className="StudentResume__experiencePosition" style={{
                                                        margin: '0 0 5px 0',
                                                        color: '#333',
                                                        fontSize: '16px'
                                                    }}>
                                                        {exp.position}
                                                    </h3>
                                                    {exp.company && (
                                                        <h4 className="StudentResume__experienceCompany" style={{
                                                            margin: '0 0 8px 0',
                                                            color: '#666',
                                                            fontSize: '14px',
                                                            fontWeight: 'normal'
                                                        }}>
                                                            {exp.company}
                                                        </h4>
                                                    )}
                                                    {exp.description && (
                                                        <p className="StudentResume__experienceDescription" style={{
                                                            margin: '0',
                                                            color: '#555',
                                                            fontSize: '14px',
                                                            lineHeight: '1.5'
                                                        }}>
                                                            {exp.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: '#999', margin: '0', fontStyle: 'italic' }}>пока пусто :D</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="StudentResume__expandableSection" style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        padding: '20px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        <div
                            className="StudentResume__expandableHeader"
                            onClick={toggleEducation}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            <h3 className="StudentResume__expandableTitle" style={{ margin: '0', color: '#333' }}>Образование</h3>
                            <span
                                className={`StudentResume__expandableArrow ${expandedEducation ? 'expanded' : ''}`}
                                style={{
                                    display: 'inline-block',
                                    width: '10px',
                                    height: '10px',
                                    borderRight: '2px solid #333',
                                    borderBottom: '2px solid #333',
                                    transform: expandedEducation ? 'rotate(-135deg)' : 'rotate(45deg)',
                                    transition: 'transform 0.3s'
                                }}
                            ></span>
                        </div>

                        {expandedEducation && (
                            <div className="StudentResume__expandableContent StudentResume__expandableContent--no-border" style={{ marginTop: '15px' }}>
                                {educationDetails.length > 0 ? (
                                    <div className="StudentResume__educationList">
                                        {educationDetails.map((edu, index) => (
                                            <div key={edu.id || index} className="StudentResume__educationItem" style={{
                                                display: 'flex',
                                                marginBottom: '20px'
                                            }}>
                                                <div className="StudentResume__educationTimeline" style={{
                                                    minWidth: '100px',
                                                    position: 'relative'
                                                }}>
                                                    <div className="StudentResume__educationYears" style={{
                                                        color: '#666',
                                                        fontSize: '14px'
                                                    }}>
                                                        {edu.startDate && edu.endDate ? (
                                                            <span>{edu.startDate} - {edu.endDate}<br/></span>
                                                        ) : edu.startDate ? (
                                                            <span>С {edu.startDate}</span>
                                                        ) : edu.endDate ? (
                                                            <span>До {edu.endDate}</span>
                                                        ) : null}
                                                    </div>
                                                    <div className="StudentResume__educationVerticalLine" style={{
                                                        position: 'absolute',
                                                        right: '0',
                                                        top: '0',
                                                        bottom: '0',
                                                        width: '2px',
                                                        backgroundColor: '#007bff'
                                                    }}></div>
                                                </div>
                                                <div className="StudentResume__educationInfo" style={{ flex: 1, paddingLeft: '20px' }}>
                                                    <h3 className="StudentResume__educationName" style={{
                                                        margin: '0 0 5px 0',
                                                        color: '#333',
                                                        fontSize: '16px'
                                                    }}>
                                                        {edu.name}
                                                    </h3>
                                                    {edu.speciality && (
                                                        <p className="StudentResume__educationSpeciality" style={{
                                                            margin: '0 0 8px 0',
                                                            color: '#666',
                                                            fontSize: '14px'
                                                        }}>
                                                            {edu.speciality}
                                                        </p>
                                                    )}
                                                    {edu.webUrl && (
                                                        <a
                                                            href={edu.webUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="StudentResume__educationLink"
                                                            style={{
                                                                color: '#007bff',
                                                                textDecoration: 'none',
                                                                fontSize: '14px'
                                                            }}
                                                        >
                                                            Узнать больше &#62;
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: '#999', margin: '0', fontStyle: 'italic' }}>пока пусто :D</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {similarStudents.length > 0 && (
                    <div className="StudentResume__similarSection" style={{ marginTop: '40px' }}>
                        <h2 className="StudentResume__similarTitle" style={{
                            margin: '0 0 20px 0',
                            color: '#333',
                            textAlign: 'center'
                        }}>
                            Студенты с похожими навыками
                        </h2>
                        <div className="StudentResume__similarList" style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '20px',
                            justifyContent: 'center'
                        }}>
                            {similarStudents.map((similarStudent) => (
                                <Link
                                    key={similarStudent.id}
                                    to={`/studentsResume/${similarStudent.id}`}
                                    className="StudentResume__similarLink"
                                    style={{
                                        textDecoration: 'none',
                                        color: 'inherit',
                                        width: '200px'
                                    }}
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