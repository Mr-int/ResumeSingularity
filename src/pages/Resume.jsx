import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import Footer from '../components/footer/Footer.jsx';
import StudentProfileResume from '../components/studentProfileResume/StudentProfileResume.jsx';
import {
    getEducationDetailsByStudentId,
    getExperienceDetailsByStudentId,
    getStudentById,
} from '../services/studentApi.js';
import { getImageUrl } from '../config/api.js';
import { hasStudentProfilePhoto } from '../utils/hasStudentProfilePhoto.js';
import './accountPage.css';

const specialtyLabel = (student) => {
    if (!student) return '';
    if (typeof student.speciality === 'string') return student.speciality;
    if (student.speciality?.name) return student.speciality.name;
    return student.profession || student.specialityName || '';
};

const Resume = () => {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [student, setStudent] = useState(null);
    const [experiences, setExperiences] = useState([]);
    const [educations, setEducations] = useState([]);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            if (!id) {
                setError('ID студента не указан');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError('');
            try {
                const studentData = await getStudentById(id);
                if (!studentData?.id) {
                    throw new Error('Студент не найден');
                }
                if (!hasStudentProfilePhoto(studentData)) {
                    throw new Error('Студент не найден');
                }
                if (cancelled) return;
                setStudent(studentData);

                const [educationResult, experienceResult] = await Promise.allSettled([
                    getEducationDetailsByStudentId(id),
                    getExperienceDetailsByStudentId(id),
                ]);

                if (cancelled) return;

                if (educationResult.status === 'fulfilled' && Array.isArray(educationResult.value)) {
                    setEducations(
                        educationResult.value
                            .filter((edu) => edu && typeof edu === 'object')
                            .map((edu, index) => ({
                                id: edu.id || `edu-${index}`,
                                name: edu.institution || 'Образовательное учреждение',
                                speciality: edu.additionalInfo || '',
                                startDate: edu.startYear ? String(edu.startYear) : '',
                                endDate: edu.endYear
                                    ? String(edu.endYear)
                                    : (edu.current ? 'по настоящее время' : ''),
                                webUrl: edu.webUrl || '',
                                additionalInfo: edu.additionalInfo || '',
                            })),
                    );
                } else {
                    setEducations([]);
                }

                setExperiences(
                    experienceResult.status === 'fulfilled' && Array.isArray(experienceResult.value)
                        ? experienceResult.value
                        : [],
                );
            } catch (err) {
                if (!cancelled) {
                    setError(err?.message || 'Ошибка загрузки данных студента');
                    setStudent(null);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [id]);

    const avatarUrl = student && hasStudentProfilePhoto(student)
        ? getImageUrl(student.imagePath || student.image || student.photo || student.avatar)
        : null;

    return (
        <>
            <Header />
            <main className="accountPage accountPage--profile">
                <div className="accountPage__inner accountPage__inner--wide">
                    {loading ? (
                        <div className="accountPage__muted">Загрузка…</div>
                    ) : null}

                    {!loading && error ? (
                        <div className="accountPage__error" role="alert">
                            <p>{error}</p>
                            <p>
                                <Link to="/students" className="accountPage__settingsNavLink">
                                    К каталогу студентов
                                </Link>
                            </p>
                        </div>
                    ) : null}

                    {!loading && student ? (
                        <StudentProfileResume
                            variant="public"
                            student={{
                                ...student,
                                speciality: specialtyLabel(student),
                            }}
                            skills={Array.isArray(student.skills) ? student.skills : []}
                            experiences={experiences}
                            educations={educations}
                            avatarSrc={avatarUrl}
                            verified={Boolean(student.publicProfileConsent)}
                        />
                    ) : null}
                </div>
            </main>
            <Footer />
        </>
    );
};

export default Resume;
