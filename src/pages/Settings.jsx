import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import Footer from '../components/footer/Footer.jsx';
import StudentProfileResume from '../components/studentProfileResume/StudentProfileResume.jsx';
import StudentRequestsSection from '../components/settings/StudentRequestsSection.jsx';
import RecruiterRequestsSection from '../components/settings/RecruiterRequestsSection.jsx';
import { getStudentMe, getRecruiterMe } from '../services/getApi.js';
import {
    getEducationDetailsByStudentId,
    getExperienceDetailsByStudentId,
    getPortfolioByStudentId,
} from '../services/studentApi.js';
import { logoutServer } from '../services/authApi.js';
import { getImageUrl } from '../config/api.js';
import './accountPage.css';

const recruiterToForm = (r) => ({
    companyName: r.companyName || '',
    firstName: r.firstName || '',
    lastName: r.lastName || '',
    email: r.email || '',
    phoneNumber: r.phoneNumber || '',
    telegramUsername: r.telegramUsername || '',
});

const ReadOnlyInput = ({ value, ...rest }) => (
    <input {...rest} value={value ?? ''} readOnly className="accountPage__inputReadonly" />
);

const specialtyLabel = (student) => {
    if (!student) return '';
    if (typeof student.speciality === 'string') return student.speciality;
    if (student.speciality?.name) return student.speciality.name;
    return student.profession || student.specialityName || '';
};

const SettingsPage = () => {
    const navigate = useNavigate();
    const accountRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);
    const [error, setError] = useState('');
    const [role, setRole] = useState(null);
    const [profile, setProfile] = useState(null);
    const [recruiterForm, setRecruiterForm] = useState(recruiterToForm({}));
    const [portfolio, setPortfolio] = useState([]);
    const [experiences, setExperiences] = useState([]);
    const [educations, setEducations] = useState([]);

    const handleLogout = async () => {
        if (loggingOut) return;
        setLoggingOut(true);
        try {
            await logoutServer();
        } finally {
            navigate('/', { replace: true });
            setLoggingOut(false);
        }
    };

    const loadProfile = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            try {
                const s = await getStudentMe();
                setRole('student');
                setProfile(s);

                const [portfolioResult, educationResult, experienceResult] = await Promise.allSettled([
                    getPortfolioByStudentId(s.id),
                    getEducationDetailsByStudentId(s.id),
                    getExperienceDetailsByStudentId(s.id),
                ]);

                setPortfolio(
                    portfolioResult.status === 'fulfilled' && Array.isArray(portfolioResult.value)
                        ? portfolioResult.value
                        : [],
                );

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
                return;
            } catch (e) {
                if (e.status !== 404 && e.status !== 403) throw e;
            }
            try {
                const r = await getRecruiterMe();
                setRole('recruiter');
                setProfile(r);
                setRecruiterForm(recruiterToForm(r));
            } catch (e2) {
                if (e2.status === 404) {
                    setRole('recruiter_pending');
                    setProfile(null);
                    setError('');
                    return;
                }
                throw e2;
            }
        } catch (err) {
            setRole(null);
            setProfile(null);
            setError(err.message || 'Не удалось загрузить профиль');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const avatarUrl = profile?.imagePath ? getImageUrl(profile.imagePath) : null;
    const isStudentProfile = role === 'student' && profile;

    return (
        <>
            <Header />
            <main className={`accountPage${isStudentProfile ? ' accountPage--profile' : ''}`}>
                <div className={`accountPage__inner${isStudentProfile ? ' accountPage__inner--wide' : ''}`}>
                    {!isStudentProfile ? (
                        <>
                            <h1 className="accountPage__title">Настройки</h1>
                            <p className="accountPage__lead">
                                Просмотр профиля. Изменения в анкете вносит администратор после модерации.
                            </p>
                            <p className="accountPage__settingsNav">
                                <Link to="/chats" className="accountPage__settingsNavLink">
                                    Перейти к чатам
                                </Link>
                                <button
                                    type="button"
                                    className="accountPage__settingsNavLink accountPage__settingsNavLink--btn"
                                    onClick={handleLogout}
                                    disabled={loggingOut}
                                >
                                    {loggingOut ? 'Выходим…' : 'Выйти'}
                                </button>
                            </p>
                        </>
                    ) : null}

                    {loading && <div className="accountPage__muted">Загрузка…</div>}

                    {!loading && role === 'recruiter_pending' && (
                        <section className="accountPage__card">
                            <h2 className="accountPage__cardTitle">Профиль рекрутера</h2>
                            <p className="accountPage__text">
                                Профиль ещё не привязан. Оставьте заявку на сайте — после одобрения администратором
                                данные появятся здесь.
                            </p>
                        </section>
                    )}

                    {!loading && error && !role && (
                        <div className="accountPage__error" role="alert">
                            {error}
                        </div>
                    )}

                    {!loading && isStudentProfile ? (
                        <>
                            {profile.course === 'NEW' && (
                                <div className="accountPage__banner" role="status">
                                    Профиль с курсом NEW не показывается рекрутерам до модерации и заполнения.
                                </div>
                            )}

                            <StudentProfileResume
                                student={{
                                    ...profile,
                                    speciality: specialtyLabel(profile),
                                }}
                                skills={Array.isArray(profile.skills) ? profile.skills : []}
                                portfolio={portfolio}
                                experiences={experiences}
                                educations={educations}
                                avatarSrc={avatarUrl}
                                verified={Boolean(profile.publicProfileConsent)}
                                onEdit={() => navigate('/plug')}
                                onEditAvatar={() => navigate('/plug')}
                                onEmployerView={() => navigate(`/studentsResume/${profile.id}`)}
                                onSettings={() => {
                                    accountRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }}
                            />

                            <div ref={accountRef} id="account-settings" className="accountPage__accountBlock">
                                <h2 className="accountPage__cardTitle">Настройки аккаунта</h2>
                                <p className="accountPage__settingsNav">
                                    <Link to="/chats" className="accountPage__settingsNavLink">
                                        Перейти к чатам
                                    </Link>
                                    <button
                                        type="button"
                                        className="accountPage__settingsNavLink accountPage__settingsNavLink--btn"
                                        onClick={handleLogout}
                                        disabled={loggingOut}
                                    >
                                        {loggingOut ? 'Выходим…' : 'Выйти'}
                                    </button>
                                </p>
                                <StudentRequestsSection studentId={profile.id} />
                            </div>
                        </>
                    ) : null}

                    {!loading && role === 'recruiter' && profile && (
                        <>
                            <section className="accountPage__card">
                                <h2 className="accountPage__cardTitle">Профиль рекрутера</h2>
                                <div className="accountPage__form accountPage__form--readonly">
                                    <label className="accountPage__field">
                                        <span>Компания</span>
                                        <ReadOnlyInput value={recruiterForm.companyName} />
                                    </label>
                                    <div className="accountPage__grid2">
                                        <label className="accountPage__field">
                                            <span>Имя</span>
                                            <ReadOnlyInput value={recruiterForm.firstName} />
                                        </label>
                                        <label className="accountPage__field">
                                            <span>Фамилия</span>
                                            <ReadOnlyInput value={recruiterForm.lastName} />
                                        </label>
                                    </div>
                                    <label className="accountPage__field">
                                        <span>Email</span>
                                        <ReadOnlyInput value={recruiterForm.email} />
                                    </label>
                                    <div className="accountPage__grid2">
                                        <label className="accountPage__field">
                                            <span>Телефон</span>
                                            <ReadOnlyInput value={recruiterForm.phoneNumber} />
                                        </label>
                                        <label className="accountPage__field">
                                            <span>Telegram</span>
                                            <ReadOnlyInput value={recruiterForm.telegramUsername} />
                                        </label>
                                    </div>
                                </div>
                            </section>
                            <RecruiterRequestsSection recruiterId={profile.id} />
                        </>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
};

export default SettingsPage;
