import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import Footer from '../components/footer/Footer.jsx';
import StudentRequestsSection from '../components/settings/StudentRequestsSection.jsx';
import RecruiterRequestsSection from '../components/settings/RecruiterRequestsSection.jsx';
import { getStudentMe, getRecruiterMe } from '../services/getApi.js';
import {
    patchStudentMe,
    patchRecruiter,
    uploadStudentPhoto,
} from '../services/accountApi.js';
import { getStudentResumeForEdit, updateStudentResume } from '../services/onboardingApi.js';
import { changePassword, getAuthMe, logoutServer } from '../services/authApi.js';
import { getImageUrl } from '../config/api.js';
import './accountPage.css';

const COURSES = ['NEW', 'FIRST', 'SECOND', 'THIRD', 'FOURTH'];
const BUSYNESS = ['FREE', 'FREELANCE', 'EMPLOYED'];

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
    skillsIdsText: Array.isArray(s.skillsIds)
        ? s.skillsIds.join(', ')
        : Array.isArray(s.skills)
          ? s.skills.map((sk) => sk.id).filter(Boolean).join(', ')
          : '',
});

const recruiterToForm = (r) => ({
    companyName: r.companyName || '',
    city: r.city || '',
    firstName: r.firstName || '',
    lastName: r.lastName || '',
    email: r.email || '',
    phoneNumber: r.phoneNumber || '',
    telegramUsername: r.telegramUsername || '',
});

const SettingsPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [okMsg, setOkMsg] = useState('');
    const [role, setRole] = useState(null);
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [studentForm, setStudentForm] = useState(studentToForm({}));
    const [recruiterForm, setRecruiterForm] = useState(recruiterToForm({}));
    const [studentSettings, setStudentSettings] = useState({
        publicProfileConsent: false,
        hintsDisabled: false,
    });
    const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '' });
    const [saving, setSaving] = useState('');

    const flashOk = (msg) => {
        setOkMsg(msg);
        setError('');
        window.setTimeout(() => setOkMsg(''), 4000);
    };

    const loadProfile = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            try {
                const me = await getAuthMe();
                setSession(me);
            } catch {
                setSession(null);
            }

            try {
                const s = await getStudentMe();
                setRole('student');
                setProfile(s);
                setStudentForm(studentToForm(s));
                setStudentSettings({
                    publicProfileConsent: Boolean(s.publicProfileConsent),
                    hintsDisabled: Boolean(s.hintsDisabled),
                });
                try {
                    const resume = await getStudentResumeForEdit();
                    if (resume) setStudentForm(studentToForm({ ...s, ...resume }));
                } catch {
                    /* резюме может отсутствовать */
                }
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

    const buildResumeBody = () => {
        const skillIds = studentForm.skillsIdsText
            .split(/[,;\s]+/)
            .map((s) => Number(s.trim()))
            .filter((n) => Number.isFinite(n) && n > 0);
        const specId = Number(studentForm.specialityId);
        return {
            firstName: studentForm.firstName.trim(),
            lastName: studentForm.lastName.trim(),
            city: studentForm.city.trim() || undefined,
            bio: studentForm.bio,
            hhLink: studentForm.hhLink.trim() || undefined,
            birthDate: studentForm.birthDate,
            course: studentForm.course,
            busyness: studentForm.busyness,
            email: studentForm.email.trim(),
            phoneNumber: studentForm.phoneNumber.trim() || undefined,
            telegramUsername: studentForm.telegramUsername.trim() || undefined,
            specialityId: Number.isFinite(specId) && specId > 0 ? specId : undefined,
            skillsIds: skillIds.length ? skillIds : [],
        };
    };

    const saveStudentSettings = async () => {
        setSaving('settings');
        setError('');
        try {
            const updated = await patchStudentMe({
                publicProfileConsent: studentSettings.publicProfileConsent,
                hintsDisabled: studentSettings.hintsDisabled,
            });
            setProfile(updated);
            flashOk('Настройки сохранены');
        } catch (e) {
            setError(e.message || 'Не удалось сохранить настройки');
        } finally {
            setSaving('');
        }
    };

    const saveStudentResume = async () => {
        setSaving('resume');
        setError('');
        try {
            const updated = await updateStudentResume(buildResumeBody());
            setProfile(updated);
            setStudentForm(studentToForm(updated));
            flashOk('Резюме обновлено');
        } catch (e) {
            setError(e.message || 'Не удалось обновить резюме');
        } finally {
            setSaving('');
        }
    };

    const saveRecruiter = async () => {
        if (!profile?.id) return;
        setSaving('recruiter');
        setError('');
        try {
            const body = {};
            for (const [key, value] of Object.entries(recruiterForm)) {
                const v = typeof value === 'string' ? value.trim() : value;
                if (v !== '') body[key] = v;
            }
            const updated = await patchRecruiter(profile.id, body);
            setProfile(updated);
            setRecruiterForm(recruiterToForm(updated));
            flashOk('Профиль рекрутера сохранён');
        } catch (e) {
            setError(e.message || 'Не удалось сохранить профиль');
        } finally {
            setSaving('');
        }
    };

    const savePassword = async (e) => {
        e.preventDefault();
        setSaving('password');
        setError('');
        try {
            await changePassword(pwdForm.currentPassword, pwdForm.newPassword);
            setPwdForm({ currentPassword: '', newPassword: '' });
            flashOk('Пароль изменён');
        } catch (err) {
            setError(err.message || 'Не удалось сменить пароль');
        } finally {
            setSaving('');
        }
    };

    const onPhotoSelected = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file || !profile?.id) return;
        setSaving('photo');
        setError('');
        try {
            await uploadStudentPhoto(profile.id, file);
            await loadProfile();
            flashOk('Фото обновлено');
        } catch (err) {
            setError(err.message || 'Не удалось загрузить фото');
        } finally {
            setSaving('');
        }
    };

    const setStudentField = (key, value) =>
        setStudentForm((prev) => ({ ...prev, [key]: value }));

    const setRecruiterField = (key, value) =>
        setRecruiterForm((prev) => ({ ...prev, [key]: value }));

    const handleLogout = async () => {
        await logoutServer();
        navigate('/');
    };

    return (
        <>
            <Header />
            <main className="accountPage">
                <div className="accountPage__inner">
                    <h1 className="accountPage__title">Профиль</h1>
                    <p className="accountPage__lead">
                        Личный кабинет: редактирование данных, резюме и параметров аккаунта.
                    </p>
                    <p className="accountPage__settingsNav">
                        <Link to="/chats" className="accountPage__settingsNavLink">
                            Перейти к чатам
                        </Link>
                    </p>

                    {session ? (
                        <section className="accountPage__card accountPage__card--muted">
                            <h2 className="accountPage__cardTitle">Аккаунт</h2>
                            <p className="accountPage__text">
                                {session.username} · {session.role}
                                {session.accountStatus ? ` · ${session.accountStatus}` : ''}
                            </p>
                            <button
                                type="button"
                                className="accountPage__submit accountPage__submit--secondary"
                                onClick={handleLogout}
                            >
                                Выйти
                            </button>
                        </section>
                    ) : null}

                    {loading && <div className="accountPage__muted">Загрузка…</div>}
                    {error ? <div className="accountPage__error" role="alert">{error}</div> : null}
                    {okMsg ? <div className="accountPage__ok" role="status">{okMsg}</div> : null}

                    {!loading && role === 'recruiter_pending' && (
                        <section className="accountPage__card">
                            <h2 className="accountPage__cardTitle">Профиль рекрутера</h2>
                            <p className="accountPage__text">
                                Профиль ещё не привязан. Оставьте заявку на сайте — после одобрения
                                данные появятся здесь.
                            </p>
                        </section>
                    )}

                    {!loading && role === 'student' && profile && (
                        <>
                            {studentForm.course === 'NEW' && (
                                <div className="accountPage__banner" role="status">
                                    Профиль с курсом NEW не показывается рекрутерам до модерации.
                                </div>
                            )}

                            <section className="accountPage__card">
                                <h2 className="accountPage__cardTitle">Настройки витрины</h2>
                                <div className="accountPage__form">
                                    <label className="accountPage__field">
                                        <span>
                                            <input
                                                type="checkbox"
                                                checked={studentSettings.publicProfileConsent}
                                                onChange={(e) =>
                                                    setStudentSettings((p) => ({
                                                        ...p,
                                                        publicProfileConsent: e.target.checked,
                                                    }))
                                                }
                                            />{' '}
                                            Показывать карточку анонимам на публичной витрине
                                        </span>
                                    </label>
                                    <label className="accountPage__field">
                                        <span>
                                            <input
                                                type="checkbox"
                                                checked={studentSettings.hintsDisabled}
                                                onChange={(e) =>
                                                    setStudentSettings((p) => ({
                                                        ...p,
                                                        hintsDisabled: e.target.checked,
                                                    }))
                                                }
                                            />{' '}
                                            Отключить подсказки
                                        </span>
                                    </label>
                                    <button
                                        type="button"
                                        className="accountPage__submit"
                                        disabled={saving === 'settings'}
                                        onClick={saveStudentSettings}
                                    >
                                        {saving === 'settings' ? 'Сохранение…' : 'Сохранить настройки'}
                                    </button>
                                </div>
                            </section>

                            <section className="accountPage__card">
                                <h2 className="accountPage__cardTitle">Фото профиля</h2>
                                <div className="accountPage__avatarRow">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="" className="accountPage__avatar" width={96} height={96} />
                                    ) : (
                                        <div className="accountPage__avatar accountPage__avatar--placeholder" aria-hidden>?</div>
                                    )}
                                    <label className="accountPage__fileLabel">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="accountPage__fileInput"
                                            onChange={onPhotoSelected}
                                            disabled={saving === 'photo'}
                                        />
                                        <span className="accountPage__fileLabelText">
                                            {saving === 'photo' ? 'Загрузка…' : 'Загрузить фото'}
                                        </span>
                                    </label>
                                </div>
                            </section>

                            <section className="accountPage__card">
                                <h2 className="accountPage__cardTitle">Резюме</h2>
                                <div className="accountPage__form">
                                    <div className="accountPage__grid2">
                                        <label className="accountPage__field">
                                            <span>Имя</span>
                                            <input value={studentForm.firstName} onChange={(e) => setStudentField('firstName', e.target.value)} />
                                        </label>
                                        <label className="accountPage__field">
                                            <span>Фамилия</span>
                                            <input value={studentForm.lastName} onChange={(e) => setStudentField('lastName', e.target.value)} />
                                        </label>
                                    </div>
                                    <div className="accountPage__grid2">
                                        <label className="accountPage__field">
                                            <span>Город</span>
                                            <input value={studentForm.city} onChange={(e) => setStudentField('city', e.target.value)} />
                                        </label>
                                        <label className="accountPage__field">
                                            <span>Дата рождения</span>
                                            <input type="date" value={studentForm.birthDate} onChange={(e) => setStudentField('birthDate', e.target.value)} />
                                        </label>
                                    </div>
                                    <label className="accountPage__field">
                                        <span>Ссылка на HH</span>
                                        <input value={studentForm.hhLink} onChange={(e) => setStudentField('hhLink', e.target.value)} />
                                    </label>
                                    <label className="accountPage__field">
                                        <span>О себе</span>
                                        <textarea rows={4} value={studentForm.bio} onChange={(e) => setStudentField('bio', e.target.value)} />
                                    </label>
                                    <div className="accountPage__grid2">
                                        <label className="accountPage__field">
                                            <span>Курс</span>
                                            <select value={studentForm.course} onChange={(e) => setStudentField('course', e.target.value)}>
                                                {COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </label>
                                        <label className="accountPage__field">
                                            <span>Занятость</span>
                                            <select value={studentForm.busyness} onChange={(e) => setStudentField('busyness', e.target.value)}>
                                                {BUSYNESS.map((b) => <option key={b} value={b}>{b}</option>)}
                                            </select>
                                        </label>
                                    </div>
                                    <div className="accountPage__grid2">
                                        <label className="accountPage__field">
                                            <span>Email</span>
                                            <input type="email" value={studentForm.email} onChange={(e) => setStudentField('email', e.target.value)} />
                                        </label>
                                        <label className="accountPage__field">
                                            <span>Телефон</span>
                                            <input value={studentForm.phoneNumber} onChange={(e) => setStudentField('phoneNumber', e.target.value)} />
                                        </label>
                                    </div>
                                    <label className="accountPage__field">
                                        <span>Telegram</span>
                                        <input value={studentForm.telegramUsername} onChange={(e) => setStudentField('telegramUsername', e.target.value)} />
                                    </label>
                                    <label className="accountPage__field">
                                        <span>ID специальности</span>
                                        <input type="number" min="1" value={studentForm.specialityId} onChange={(e) => setStudentField('specialityId', e.target.value)} />
                                    </label>
                                    <label className="accountPage__field">
                                        <span>ID навыков (через запятую)</span>
                                        <input value={studentForm.skillsIdsText} onChange={(e) => setStudentField('skillsIdsText', e.target.value)} />
                                    </label>
                                    <button
                                        type="button"
                                        className="accountPage__submit"
                                        disabled={saving === 'resume'}
                                        onClick={saveStudentResume}
                                    >
                                        {saving === 'resume' ? 'Сохранение…' : 'Сохранить резюме'}
                                    </button>
                                </div>
                            </section>

                            <StudentRequestsSection studentId={profile.id} />
                        </>
                    )}

                    {!loading && role === 'recruiter' && profile && (
                        <>
                            <section className="accountPage__card">
                                <h2 className="accountPage__cardTitle">Профиль рекрутера</h2>
                                <div className="accountPage__form">
                                    <label className="accountPage__field">
                                        <span>Компания</span>
                                        <input value={recruiterForm.companyName} onChange={(e) => setRecruiterField('companyName', e.target.value)} />
                                    </label>
                                    <label className="accountPage__field">
                                        <span>Город</span>
                                        <input value={recruiterForm.city} onChange={(e) => setRecruiterField('city', e.target.value)} />
                                    </label>
                                    <div className="accountPage__grid2">
                                        <label className="accountPage__field">
                                            <span>Имя</span>
                                            <input value={recruiterForm.firstName} onChange={(e) => setRecruiterField('firstName', e.target.value)} />
                                        </label>
                                        <label className="accountPage__field">
                                            <span>Фамилия</span>
                                            <input value={recruiterForm.lastName} onChange={(e) => setRecruiterField('lastName', e.target.value)} />
                                        </label>
                                    </div>
                                    <label className="accountPage__field">
                                        <span>Email</span>
                                        <input type="email" value={recruiterForm.email} onChange={(e) => setRecruiterField('email', e.target.value)} />
                                    </label>
                                    <label className="accountPage__field">
                                        <span>Телефон</span>
                                        <input value={recruiterForm.phoneNumber} onChange={(e) => setRecruiterField('phoneNumber', e.target.value)} />
                                    </label>
                                    <label className="accountPage__field">
                                        <span>Telegram</span>
                                        <input value={recruiterForm.telegramUsername} onChange={(e) => setRecruiterField('telegramUsername', e.target.value)} />
                                    </label>
                                    <button
                                        type="button"
                                        className="accountPage__submit"
                                        disabled={saving === 'recruiter'}
                                        onClick={saveRecruiter}
                                    >
                                        {saving === 'recruiter' ? 'Сохранение…' : 'Сохранить профиль'}
                                    </button>
                                </div>
                            </section>
                            <RecruiterRequestsSection recruiterId={profile.id} />
                        </>
                    )}

                    {!loading && role && role !== 'recruiter_pending' && (
                        <section className="accountPage__card">
                            <h2 className="accountPage__cardTitle">Смена пароля</h2>
                            <form className="accountPage__form" onSubmit={savePassword}>
                                <label className="accountPage__field">
                                    <span>Текущий пароль</span>
                                    <input
                                        type="password"
                                        value={pwdForm.currentPassword}
                                        onChange={(e) => setPwdForm((p) => ({ ...p, currentPassword: e.target.value }))}
                                        required
                                    />
                                </label>
                                <label className="accountPage__field">
                                    <span>Новый пароль</span>
                                    <input
                                        type="password"
                                        value={pwdForm.newPassword}
                                        onChange={(e) => setPwdForm((p) => ({ ...p, newPassword: e.target.value }))}
                                        required
                                    />
                                </label>
                                <button type="submit" className="accountPage__submit" disabled={saving === 'password'}>
                                    {saving === 'password' ? 'Сохранение…' : 'Сменить пароль'}
                                </button>
                            </form>
                        </section>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
};

export default SettingsPage;
