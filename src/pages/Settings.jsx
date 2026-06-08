import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import StudentProfileEditor from '../components/settings/StudentProfileEditor.jsx';
import '../components/studentResume/studentResume.css';
import '../components/settings/studentOwnProfile.css';
import Header from '../components/header/Header.jsx';
import Footer from '../components/footer/Footer.jsx';
import RecruiterRequestsSection from '../components/settings/RecruiterRequestsSection.jsx';
import StudentOwnProfile from '../components/settings/StudentOwnProfile.jsx';
import { getStudentMe, getRecruiterMe } from '../services/getApi.js';
import { patchStudentMe, patchRecruiter } from '../services/accountApi.js';
import { getAccountStatus } from '../services/authApi.js';
import { setCachedOnboardingStatus } from '../services/onboardingApi.js';
import './accountPage.css';

const recruiterToForm = (r) => ({
    companyName: r.companyName || '',
    firstName: r.firstName || '',
    lastName: r.lastName || '',
    email: r.email || '',
    city: r.city || '',
    phoneNumber: r.phoneNumber || '',
    telegramUsername: r.telegramUsername || '',
});

const SettingsPage = () => {
    const [searchParams] = useSearchParams();
    const resumeSetup = searchParams.get('setup') === 'resume';
    const [loading, setLoading] = useState(true);
    const [needsResumeSetup, setNeedsResumeSetup] = useState(false);
    const [error, setError] = useState('');
    const [role, setRole] = useState(null);
    const [profile, setProfile] = useState(null);
    const [recruiterForm, setRecruiterForm] = useState(recruiterToForm({}));
    const [consentSaving, setConsentSaving] = useState(false);
    const [consentError, setConsentError] = useState('');
    const [recruiterSaving, setRecruiterSaving] = useState(false);
    const [recruiterSaveError, setRecruiterSaveError] = useState('');
    const [recruiterSaveOk, setRecruiterSaveOk] = useState('');
    const loadProfile = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            try {
                const s = await getStudentMe();
                setRole('student');
                setProfile(s);
                setNeedsResumeSetup(false);
                return;
            } catch (e) {
                if (e.status === 404) {
                    setRole('student');
                    setProfile(null);
                    setNeedsResumeSetup(true);
                    setError('');
                    return;
                }
                if (e.status !== 403) throw e;
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

    const handleRecruiterField = (field, value) => {
        setRecruiterForm((prev) => ({ ...prev, [field]: value }));
        setRecruiterSaveOk('');
        setRecruiterSaveError('');
    };

    const handleRecruiterSave = async (e) => {
        e.preventDefault();
        if (!profile?.id) return;
        setRecruiterSaving(true);
        setRecruiterSaveError('');
        setRecruiterSaveOk('');
        try {
            const updated = await patchRecruiter(profile.id, {
                companyName: recruiterForm.companyName.trim(),
                firstName: recruiterForm.firstName.trim(),
                lastName: recruiterForm.lastName.trim(),
                email: recruiterForm.email.trim(),
                city: recruiterForm.city.trim(),
                phoneNumber: recruiterForm.phoneNumber.trim(),
                telegramUsername: recruiterForm.telegramUsername.trim().replace(/^@/, '') || undefined,
            });
            setProfile(updated);
            setRecruiterForm(recruiterToForm(updated));
            setRecruiterSaveOk('Профиль сохранён');
        } catch (err) {
            if (err.status === 403 || getAccountStatus() === 'PENDING_APPROVAL') {
                setRecruiterSaveError(
                    'Сохранение недоступно: аккаунт на проверке у администратора.',
                );
            } else {
                setRecruiterSaveError(err.message || 'Не удалось сохранить профиль');
            }
        } finally {
            setRecruiterSaving(false);
        }
    };

    const handleConsentChange = async (checked) => {
        setConsentSaving(true);
        setConsentError('');
        try {
            const updated = await patchStudentMe({ publicProfileConsent: checked });
            setProfile(updated);
        } catch (e) {
            setConsentError(e.message || 'Не удалось сохранить настройку');
        } finally {
            setConsentSaving(false);
        }
    };

    return (
        <>
            <Header />
            <main className="accountPage">
                <div
                    className={`accountPage__inner${
                        role === 'student' ? ' accountPage__inner--resumeView' : ''
                    }`}
                >
                    <h1 className="accountPage__title">
                        <span className="accountPage__titleAccent">
                            {role === 'student' && (needsResumeSetup || resumeSetup)
                                ? 'Заполнение резюме'
                                : 'Настройки'}
                        </span>
                    </h1>
                    <p className="accountPage__lead">
                        {role === 'recruiter'
                            ? 'Контакты и данные компании можно изменить в форме ниже и сохранить.'
                            : role === 'student' && (needsResumeSetup || resumeSetup)
                              ? 'Соберите резюме в макете витрины: фото, навыки, портфолио, опыт и образование.'
                              : role === 'student'
                                ? 'Так рекрутеры видят ваше резюме. Нажмите «Изменить», чтобы заполнить или обновить данные.'
                                : 'Просмотр профиля и настройки аккаунта.'}
                    </p>

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

                    {!loading && role === 'student' && needsResumeSetup && (
                        <div className="accountPage__resumePreview">
                            <StudentProfileEditor
                                resumeLayout
                                submitLabel="Сохранить резюме"
                                onSaved={(updated) => {
                                    setCachedOnboardingStatus('student', true);
                                    setProfile(updated);
                                    setNeedsResumeSetup(false);
                                }}
                            />
                        </div>
                    )}

                    {!loading && role === 'student' && profile && (
                        <>
                            {getAccountStatus() === 'PENDING_APPROVAL' && (
                                <div className="accountPage__banner" role="status">
                                    Профиль не показывается рекрутерам до одобрения аккаунта администратором.
                                </div>
                            )}

                            <StudentOwnProfile
                                profile={profile}
                                defaultEditing={resumeSetup}
                                onProfileUpdate={setProfile}
                                onConsentChange={handleConsentChange}
                                consentSaving={consentSaving}
                                consentError={consentError}
                            />
                        </>
                    )}

                    {!loading && role === 'recruiter' && profile && (
                        <>
                            {getAccountStatus() === 'PENDING_APPROVAL' && (
                                <div className="accountPage__banner" role="status">
                                    Аккаунт на проверке. После одобрения администратором изменения профиля будут
                                    сохраняться на сервере.
                                </div>
                            )}
                            <section className="accountPage__card">
                                <h2 className="accountPage__cardTitle">Профиль рекрутера</h2>
                                <p className="accountPage__hint">
                                    <Link to="/vacancies/mine">Мои вакансии</Link>
                                </p>
                                <form className="accountPage__form" onSubmit={handleRecruiterSave}>
                                    <label className="accountPage__field">
                                        <span>Компания</span>
                                        <input
                                            value={recruiterForm.companyName}
                                            onChange={(e) => handleRecruiterField('companyName', e.target.value)}
                                            required
                                        />
                                    </label>
                                    <div className="accountPage__grid2">
                                        <label className="accountPage__field">
                                            <span>Имя</span>
                                            <input
                                                value={recruiterForm.firstName}
                                                onChange={(e) => handleRecruiterField('firstName', e.target.value)}
                                                required
                                            />
                                        </label>
                                        <label className="accountPage__field">
                                            <span>Фамилия</span>
                                            <input
                                                value={recruiterForm.lastName}
                                                onChange={(e) => handleRecruiterField('lastName', e.target.value)}
                                                required
                                            />
                                        </label>
                                    </div>
                                    <label className="accountPage__field">
                                        <span>Email</span>
                                        <input
                                            type="email"
                                            value={recruiterForm.email}
                                            onChange={(e) => handleRecruiterField('email', e.target.value)}
                                            required
                                        />
                                    </label>
                                    <label className="accountPage__field">
                                        <span>Город</span>
                                        <input
                                            value={recruiterForm.city}
                                            onChange={(e) => handleRecruiterField('city', e.target.value)}
                                            required
                                        />
                                    </label>
                                    <label className="accountPage__field">
                                        <span>Телефон</span>
                                        <input
                                            value={recruiterForm.phoneNumber}
                                            onChange={(e) => handleRecruiterField('phoneNumber', e.target.value)}
                                        />
                                    </label>
                                    <label className="accountPage__field">
                                        <span>Telegram</span>
                                        <input
                                            value={recruiterForm.telegramUsername}
                                            onChange={(e) => handleRecruiterField('telegramUsername', e.target.value)}
                                            placeholder="@username"
                                        />
                                    </label>
                                    {recruiterSaveError ? (
                                        <div className="accountPage__error" role="alert">
                                            {recruiterSaveError}
                                        </div>
                                    ) : null}
                                    {recruiterSaveOk ? (
                                        <div className="accountPage__ok" role="status">
                                            {recruiterSaveOk}
                                        </div>
                                    ) : null}
                                    <button type="submit" className="accountPage__submit" disabled={recruiterSaving}>
                                        {recruiterSaving ? 'Сохранение…' : 'Сохранить профиль'}
                                    </button>
                                </form>
                            </section>
                            <RecruiterRequestsSection />
                        </>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
};

export default SettingsPage;
