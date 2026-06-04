import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import Footer from '../components/footer/Footer.jsx';
import StudentRequestsSection from '../components/settings/StudentRequestsSection.jsx';
import RecruiterRequestsSection from '../components/settings/RecruiterRequestsSection.jsx';
import { getStudentMe, getRecruiterMe } from '../services/getApi.js';
import { patchStudentMe } from '../services/accountApi.js';
import { getImageUrl } from '../config/api.js';
import './accountPage.css';

const studentToForm = (s) => ({
    firstName: s.firstName || '',
    lastName: s.lastName || '',
    city: s.city || '',
    bio: s.bio || '',
    hhLink: s.hhLink || '',
    birthDate: s.birthDate || '',
    course: s.course || 'FIRST',
    busyness: s.busyness || 'FREE',
    email: s.email || '',
    phoneNumber: s.phoneNumber || '',
    telegramUsername: s.telegramUsername || '',
    specialityId: s.specialityId != null ? String(s.specialityId) : '',
    skillsLabel: Array.isArray(s.skills)
        ? s.skills.map((sk) => sk.name || sk.title || sk.id).filter(Boolean).join(', ')
        : '',
});

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

const SettingsPage = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [role, setRole] = useState(null);
    const [profile, setProfile] = useState(null);
    const [studentForm, setStudentForm] = useState(studentToForm({}));
    const [recruiterForm, setRecruiterForm] = useState(recruiterToForm({}));
    const [consentSaving, setConsentSaving] = useState(false);
    const [consentError, setConsentError] = useState('');

    const loadProfile = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            try {
                const s = await getStudentMe();
                setRole('student');
                setProfile(s);
                setStudentForm(studentToForm(s));
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

    const handleConsentChange = async (checked) => {
        setConsentSaving(true);
        setConsentError('');
        try {
            const updated = await patchStudentMe({ publicProfileConsent: checked });
            setProfile(updated);
            setStudentForm(studentToForm(updated));
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
                <div className="accountPage__inner">
                    <h1 className="accountPage__title">Настройки</h1>
                    <p className="accountPage__lead">
                        Просмотр профиля. Изменения в анкете вносит администратор после модерации.
                    </p>
                    <p className="accountPage__settingsNav">
                        <Link to="/chats" className="accountPage__settingsNavLink">
                            Перейти к чатам
                        </Link>
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

                    {!loading && role === 'student' && profile && (
                        <>
                            {studentForm.course === 'NEW' && (
                                <div className="accountPage__banner" role="status">
                                    Профиль с курсом NEW не показывается рекрутерам до модерации и заполнения.
                                </div>
                            )}
                            <section className="accountPage__card">
                                <h2 className="accountPage__cardTitle">Профиль студента</h2>
                                <div className="accountPage__avatarRow">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="" className="accountPage__avatar" width={96} height={96} />
                                    ) : (
                                        <div className="accountPage__avatar accountPage__avatar--placeholder" aria-hidden>
                                            ?
                                        </div>
                                    )}
                                </div>

                                <div className="accountPage__readonlyMeta">
                                    {profile.profileTextScore != null && (
                                        <p>
                                            Заполненность профиля: <strong>{profile.profileTextScore}</strong>
                                        </p>
                                    )}
                                    <label className="accountPage__field accountPage__field--checkbox">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(profile.publicProfileConsent)}
                                            disabled={consentSaving}
                                            onChange={(e) => handleConsentChange(e.target.checked)}
                                        />
                                        <span>
                                            Показывать мою карточку на публичной витрине (без входа на сайт)
                                        </span>
                                    </label>
                                    {consentError ? (
                                        <div className="accountPage__error" role="alert">
                                            {consentError}
                                        </div>
                                    ) : null}
                                </div>

                                <div className="accountPage__form accountPage__form--readonly">
                                    <div className="accountPage__grid2">
                                        <label className="accountPage__field">
                                            <span>Имя</span>
                                            <ReadOnlyInput value={studentForm.firstName} />
                                        </label>
                                        <label className="accountPage__field">
                                            <span>Фамилия</span>
                                            <ReadOnlyInput value={studentForm.lastName} />
                                        </label>
                                    </div>
                                    <div className="accountPage__grid2">
                                        <label className="accountPage__field">
                                            <span>Город</span>
                                            <ReadOnlyInput value={studentForm.city} />
                                        </label>
                                        <label className="accountPage__field">
                                            <span>Дата рождения</span>
                                            <ReadOnlyInput type="date" value={studentForm.birthDate} />
                                        </label>
                                    </div>
                                    <label className="accountPage__field">
                                        <span>Ссылка на HH</span>
                                        <ReadOnlyInput value={studentForm.hhLink} />
                                    </label>
                                    <label className="accountPage__field">
                                        <span>О себе</span>
                                        <textarea
                                            className="accountPage__inputReadonly"
                                            value={studentForm.bio}
                                            readOnly
                                            rows={4}
                                        />
                                    </label>
                                    <div className="accountPage__grid2">
                                        <label className="accountPage__field">
                                            <span>Курс</span>
                                            <ReadOnlyInput value={studentForm.course} />
                                        </label>
                                        <label className="accountPage__field">
                                            <span>Занятость</span>
                                            <ReadOnlyInput value={studentForm.busyness} />
                                        </label>
                                    </div>
                                    <div className="accountPage__grid2">
                                        <label className="accountPage__field">
                                            <span>Email</span>
                                            <ReadOnlyInput value={studentForm.email} />
                                        </label>
                                        <label className="accountPage__field">
                                            <span>Телефон</span>
                                            <ReadOnlyInput value={studentForm.phoneNumber} />
                                        </label>
                                    </div>
                                    <label className="accountPage__field">
                                        <span>Telegram</span>
                                        <ReadOnlyInput value={studentForm.telegramUsername} />
                                    </label>
                                    {profile.speciality ? (
                                        <p className="accountPage__hint">Специальность: {profile.speciality}</p>
                                    ) : null}
                                    {studentForm.skillsLabel ? (
                                        <p className="accountPage__hint">Навыки: {studentForm.skillsLabel}</p>
                                    ) : null}
                                </div>
                            </section>

                            <StudentRequestsSection />
                        </>
                    )}

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
                                    <label className="accountPage__field">
                                        <span>Телефон</span>
                                        <ReadOnlyInput value={recruiterForm.phoneNumber} />
                                    </label>
                                    <label className="accountPage__field">
                                        <span>Telegram</span>
                                        <ReadOnlyInput value={recruiterForm.telegramUsername} />
                                    </label>
                                </div>
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
