import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import "./studentResume.css";
import face from "../../assets/other/test.png";
import mailIcon from "../../assets/icons/mailIcon.svg";
import BehindOrange from "../../assets/other/BehindOrange.png";
import BehindPink from "../../assets/other/BehindPink.png";
import BehindBlue from "../../assets/other/BehindBlue.png";
import { getStudentById, getPortfolioByStudentId, getInstitutionsByStudentId, getExperienceByStudentId, getAllStudents } from "../../services/studentApi.js";
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

                try {
                    const portfolioData = await getPortfolioByStudentId(id);
                    setPortfolio(portfolioData || []);
                } catch (err) {
                    setPortfolio([]);
                }

                try {
                    const response = await getInstitutionsByStudentId(id);

                    if (response && response.educationsInstitution && Array.isArray(response.educationsInstitution)) {
                        const formattedEducation = response.educationsInstitution.map((item, index) => {
                            const educationInfo = item.education || {};
                            const institutionInfo = item.educationInstitution || {};

                            return {
                                id: institutionInfo.id || educationInfo.id || index,
                                name: educationInfo.institution || 'Образовательное учреждение',
                                speciality: educationInfo.additionalInfo || educationInfo.speciality,
                                startDate: institutionInfo.startYear ? institutionInfo.startYear.toString() : '',
                                endDate: institutionInfo.endYear ? institutionInfo.endYear.toString() : '',
                                webUrl: educationInfo.webUrl,
                                additionalInfo: educationInfo.additionalInfo
                            };
                        });
                        setEducationDetails(formattedEducation);
                    } else {
                        setEducationDetails([]);
                    }
                } catch (err) {
                    setEducationDetails([]);
                }

                try {
                    console.log('Запрос опыта работы по ID студента:', id);
                    const response = await getExperienceByStudentId(id);
                    console.log('Ответ от /experience/aboutGetByStudentId/{id}:', response);

                    if (response && response.companyExperiences && Array.isArray(response.companyExperiences)) {
                        const formattedExperience = response.companyExperiences.map((item, index) => {
                            const companyInfo = item.company || {};
                            const experienceInfo = item.experience || {};

                            return {
                                id: experienceInfo.id || companyInfo.id || index,
                                position: experienceInfo.position || experienceInfo.jobTitle || '',
                                company: companyInfo.name || companyInfo.company || '',
                                description: experienceInfo.additionalInfo || experienceInfo.description || experienceInfo.responsibilities || '',
                                startDate: experienceInfo.startDate || experienceInfo.startYear || experienceInfo.startMonthYear || '',
                                endDate: experienceInfo.endDate || experienceInfo.endYear || experienceInfo.endMonthYear || (experienceInfo.endDate === null ? 'по настоящее время' : ''),
                                current: experienceInfo.endDate === null || experienceInfo.current || false
                            };
                        });

                        console.log('Форматированные данные опыта работы:', formattedExperience);
                        setExperienceDetails(formattedExperience);
                    } else {
                        console.log('Нет данных опыта работы или неверный формат');
                        setExperienceDetails([]);
                    }
                } catch (err) {
                    console.error('Ошибка при получении опыта работы:', err);
                    setExperienceDetails([]);
                }

                try {
                    const allStudents = await getAllStudents();
                    const similar = allStudents
                        .filter(s => s.id !== parseInt(id) && s.id !== id)
                        .slice(0, 6);
                    setSimilarStudents(similar || []);
                } catch (err) {
                    setSimilarStudents([]);
                }
            } catch (err) {
                setError(err.message);
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
        if (!studentData) return face;

        const imagePath = studentData.imagePath || studentData.image || studentData.photo;

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
    const imageSrc = getStudentImageUrl(student);
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
                                                        <p className="StudentResume__experienceDescription" style={{whiteSpace: 'pre-line'}}>{exp.description}</p>
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
                                                            <span>{edu.startDate} - {edu.endDate}</span>
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
                                                    {edu.additionalInfo && (
                                                        <p className="StudentResume__educationAdditional">{edu.additionalInfo}</p>
                                                    )}
                                                    {edu.webUrl && (
                                                        <a
                                                            href={edu.webUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="StudentResume__educationLink"
                                                        >
                                                            {edu.webUrl}
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
                                                    {edu.name}
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