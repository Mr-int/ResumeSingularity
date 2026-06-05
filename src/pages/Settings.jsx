import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import Footer from '../components/footer/Footer.jsx';
import StudentRequestsSection from '../components/settings/StudentRequestsSection.jsx';
import RecruiterRequestsSection from '../components/settings/RecruiterRequestsSection.jsx';
import StudentProfileEditor from '../components/settings/StudentProfileEditor.jsx';
import { getStudentMe, getRecruiterMe } from '../services/getApi.js';
import { patchStudentMe, patchRecruiter, uploadStudentPhoto } from '../services/accountApi.js';
import { getAccountStatus } from '../services/authApi.js';
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

const SettingsPage = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [role, setRole] = useState(null);
    const [profile, setProfile] = useState(null);
    const [recruiterForm, setRecruiterForm] = useState(recruiterToForm({}));
    const [consentSaving, setConsentSaving] = useState(false);
    const [consentError, setConsentError] = useState('');
    const [recruiterSaving, setRecruiterSaving] = useState(false);
    const [recruiterSaveError, setRecruiterSaveError] = useState('');
    const [recruiterSaveOk, setRecruiterSaveOk] = useState('');
    const [photoSaving, setPhotoSaving] = useState(false);
    const [photoError, setPhotoError] = useState('');
    const photoInputRef = useRef(null);

    const loadProfile = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            try {
                const s = await getStudentMe();
                setRole('student');
                setProfile(s);
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

    const handlePhotoChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file || !profile?.id) return;
        setPhotoSaving(true);
        setPhotoError('');
        try {
            await uploadStudentPhoto(profile.id, file);
            const updated = await getStudentMe();
            setProfile(updated);
        } catch (e) {
            setPhotoError(e.message || 'Не удалось загрузить фото');
        } finally {
            setPhotoSaving(false);
            if (photoInputRef.current) {
                photoInputRef.current.value = '';
            }
        }
    };

    return (
        <>
            <Header />
            <main className="accountPage">
                <div className="accountPage__inner">
                    <h1 className="accountPage__title">
                        <span className="accountPage__titleAccent">Настройки</span>
                    </h1>
                    <p className="accountPage__lead">
                        {role === 'recruiter'
                            ? 'Контакты и данные компании можно изменить в форме ниже и сохранить.'
                            : role === 'student'
                              ? 'Редактируйте резюме, контакты, навыки, опыт и образование прямо здесь.'
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

                    {!loading && role === 'student' && profile && (
                        <>
                            {profile.course === 'NEW' && (
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
                                    <div className="accountPage__avatarActions">
                                        <input
                                            ref={photoInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="accountPage__fileInput"
                                            onChange={handlePhotoChange}
                                            disabled={photoSaving}
                                        />
                                        <button
                                            type="button"
                                            className="accountPage__submit accountPage__submit--secondary"
                                            onClick={() => photoInputRef.current?.click()}
                                            disabled={photoSaving}
                                        >
                                            {photoSaving ? 'Загрузка…' : 'Изменить фото'}
                                        </button>
                                        {photoError ? (
                                            <div className="accountPage__error" role="alert">
                                                {photoError}
                                            </div>
                                        ) : null}
                                    </div>
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

                                <StudentProfileEditor
                                    onSaved={(updated) => setProfile(updated)}
                                    submitLabel="Сохранить профиль"
                                />
                            </section>

                            <StudentRequestsSection />
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
