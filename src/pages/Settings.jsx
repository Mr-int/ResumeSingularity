import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { changePassword, getAuthMe, logoutServer, getAuthRole, getAccountStatus, isAuthenticated, AUTH_USERNAME_KEY } from '../services/authApi.js';
import { formatApiUserMessage } from '../utils/apiErrors.js';
import { getImageUrl } from '../config/api.js';
import { fetchAllRegistrationSkills, fetchAllRegistrationSpecialities } from '../services/registrationCatalogApi.js';
import { extractSkillIds } from '../utils/skills.js';
import { COURSE_OPTIONS, BUSYNESS_OPTIONS, COURSE_LABELS, BUSYNESS_LABELS } from '../utils/studentEnums.js';
import './accountPage.css';

const COURSES = COURSE_OPTIONS;
const BUSYNESS = BUSYNESS_OPTIONS;

const ROLE_LABELS = {
    STUDENT: 'Студент',
    RECRUITER: 'Рекрутер',
    USER: 'Рекрутер',
    ADMIN: 'Администратор',
    GUEST: 'Гость',
};

const STATUS_LABELS = {
    PENDING: 'На проверке',
    APPROVED: 'Одобрен',
    REJECTED: 'Отклонён',
};

const profileRoleToApiRole = (profileRole) => {
    if (profileRole === 'student') return 'STUDENT';
    if (profileRole === 'recruiter') return 'RECRUITER';
    if (profileRole === 'recruiter_pending') return 'RECRUITER';
    return null;
};

const roleBadgeClass = (apiRole, profileRole) => {
    if (apiRole === 'ADMIN') return 'accountPage__roleBadge--admin';
    if (profileRole === 'student_pending' || profileRole === 'recruiter_pending') {
        return 'accountPage__roleBadge--pending';
    }
    if (apiRole === 'STUDENT' || profileRole === 'student') return 'accountPage__roleBadge--student';
    return 'accountPage__roleBadge--recruiter';
};

const resolveIdentity = (session, profileRole) => {
    const apiRole =
        session?.role ||
        profileRoleToApiRole(profileRole) ||
        getAuthRole() ||
        null;
    const username =
        session?.username ||
        (() => {
            try {
                return (localStorage.getItem(AUTH_USERNAME_KEY) || '').trim();
            } catch {
                return '';
            }
        })() ||
        'Аккаунт';
    const accountStatus = session?.accountStatus || getAccountStatus() || null;
    let roleLabel = ROLE_LABELS[apiRole] || 'Пользователь';
    if (profileRole === 'recruiter_pending') {
        roleLabel = 'Рекрутер';
    }
    const statusLabel = accountStatus ? STATUS_LABELS[accountStatus] || accountStatus : null;
    return { apiRole, username, roleLabel, statusLabel };
};

const studentToForm = (s) => ({
    firstName: s.firstName || '',
    lastName: s.lastName || '',
    city: s.city || '',
    bio: s.bio || '',
    birthDate: s.birthDate || '',
    course: s.course || 'FIRST',
    busyness: s.busyness || 'FREE',
    email: s.email || '',
    phoneNumber: s.phoneNumber || '',
    telegramUsername: s.telegramUsername || '',
    specialityId: s.specialityId != null ? String(s.specialityId) : '',
    skillsIds: extractSkillIds(s.skillsIds ?? s.skills),
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
    const [skillsCatalog, setSkillsCatalog] = useState([]);
    const [skillsCatalogLoading, setSkillsCatalogLoading] = useState(false);
    const [specialitiesCatalog, setSpecialitiesCatalog] = useState([]);
    const [specialitiesCatalogLoading, setSpecialitiesCatalogLoading] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarVersion, setAvatarVersion] = useState(0);

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
                if (e2.status === 404 || e2.status === 403) {
                    const apiRole = getAuthRole();
                    setRole(apiRole === 'STUDENT' ? 'student_pending' : 'recruiter_pending');
                    setProfile(null);
                    return;
                }
                throw e2;
            }
        } catch (err) {
            setRole(null);
            setProfile(null);
            setError(formatApiUserMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    useEffect(() => {
        if (role !== 'student') return undefined;

        let cancelled = false;
        setSkillsCatalogLoading(true);
        setSpecialitiesCatalogLoading(true);

        Promise.all([fetchAllRegistrationSkills(), fetchAllRegistrationSpecialities()])
            .then(([skills, specialities]) => {
                if (!cancelled) {
                    setSkillsCatalog(skills);
                    setSpecialitiesCatalog(specialities);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setSkillsCatalog([]);
                    setSpecialitiesCatalog([]);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setSkillsCatalogLoading(false);
                    setSpecialitiesCatalogLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [role]);

    useEffect(() => {
        return () => {
            if (avatarPreview) {
                URL.revokeObjectURL(avatarPreview);
            }
        };
    }, [avatarPreview]);

    const avatarUrl = useMemo(() => {
        if (avatarPreview) return avatarPreview;
        if (!profile?.imagePath) return null;
        const base = getImageUrl(profile.imagePath);
        return avatarVersion > 0 ? `${base}?v=${avatarVersion}` : base;
    }, [avatarPreview, profile?.imagePath, avatarVersion]);

    const buildResumeBody = () => {
        const skillIds = Array.isArray(studentForm.skillsIds)
            ? studentForm.skillsIds.map(Number).filter((n) => Number.isFinite(n) && n > 0)
            : [];
        const specId = Number(studentForm.specialityId);
        return {
            firstName: studentForm.firstName.trim(),
            lastName: studentForm.lastName.trim(),
            city: studentForm.city.trim() || undefined,
            bio: studentForm.bio,
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

        const previewUrl = URL.createObjectURL(file);
        setAvatarPreview((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return previewUrl;
        });

        setSaving('photo');
        setError('');
        try {
            await uploadStudentPhoto(profile.id, file);
            await loadProfile();
            setAvatarVersion(Date.now());
            setAvatarPreview((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return null;
            });
            flashOk('Фото обновлено');
        } catch (err) {
            setAvatarPreview((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return null;
            });
            setError(err.message || 'Не удалось загрузить фото');
        } finally {
            setSaving('');
        }
    };

    const setStudentField = (key, value) =>
        setStudentForm((prev) => ({ ...prev, [key]: value }));

    const toggleStudentSkill = (skillId) => {
        const id = Number(skillId);
        if (!Number.isFinite(id) || id <= 0) return;
        setStudentForm((prev) => {
            const selected = new Set(prev.skillsIds || []);
            if (selected.has(id)) {
                selected.delete(id);
            } else {
                selected.add(id);
            }
            return { ...prev, skillsIds: Array.from(selected) };
        });
    };

    const setRecruiterField = (key, value) =>
        setRecruiterForm((prev) => ({ ...prev, [key]: value }));

    const handleLogout = async () => {
        await logoutServer();
        navigate('/');
    };

    const identity = resolveIdentity(session, role);
    const showIdentity = !loading && (role || isAuthenticated());

    return (
        <>
            <Header />
            <main className="accountPage">
                <div className="accountPage__inner">
                    <h1 className="accountPage__title">Профиль</h1>

                    {showIdentity ? (
                        <section className="accountPage__identity" aria-label="Роль и аккаунт">
                            <div className="accountPage__identityMain">
                                <span
                                    className={`accountPage__roleBadge ${roleBadgeClass(identity.apiRole, role)}`}
                                >
                                    {identity.roleLabel}
                                </span>
                                <div className="accountPage__identityMeta">
                                    <span className="accountPage__identityUsername">{identity.username}</span>
                                    {identity.statusLabel ? (
                                        <span className="accountPage__identityStatus">{identity.statusLabel}</span>
                                    ) : null}
                                    {role === 'recruiter_pending' || role === 'student_pending' ? (
                                        <span className="accountPage__identityStatus accountPage__identityStatus--warn">
                                            Аккаунт на проверке
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                            <button
                                type="button"
                                className="accountPage__logoutBtn"
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
                        <section className="accountPage__section">
                            <h2 className="accountPage__sectionTitle">Профиль рекрутера</h2>
                            <div className="accountPage__banner" role="status">
                                Ваш аккаунт ещё на проверке. После одобрения администратором откроется
                                доступ к каталогу студентов и настройкам профиля.
                            </div>
                            <p className="accountPage__text">
                                Если вы уже оставляли заявку, дождитесь решения модератора. Обычно это
                                занимает немного времени.
                            </p>
                        </section>
                    )}

                    {!loading && role === 'student_pending' && (
                        <section className="accountPage__section">
                            <h2 className="accountPage__sectionTitle">Профиль студента</h2>
                            <div className="accountPage__banner" role="status">
                                Ваш аккаунт ещё на проверке. После одобрения администратором откроется
                                полный доступ к вакансиям, каталогу и редактированию резюме.
                            </div>
                            <p className="accountPage__text">
                                Пока модерация не завершена, часть разделов сайта может быть недоступна.
                                Это нормально — вам не нужно ничего делать дополнительно.
                            </p>
                        </section>
                    )}

                    {!loading && role === 'student' && profile && (
                        <>
                            {studentForm.course === 'NEW' && (
                                <div className="accountPage__banner" role="status">
                                    Профиль с курсом «Новый» не показывается рекрутерам до модерации.
                                </div>
                            )}

                            <section className="accountPage__section">
                                <h2 className="accountPage__sectionTitle">Настройки витрины</h2>
                                <div className="accountPage__formRow">
                                    <label className="accountPage__formGroup accountPage__formGroup--checkbox accountPage__fullWidth">
                                        <input
                                            type="checkbox"
                                            checked={studentSettings.publicProfileConsent}
                                            onChange={(e) =>
                                                setStudentSettings((p) => ({
                                                    ...p,
                                                    publicProfileConsent: e.target.checked,
                                                }))
                                            }
                                        />
                                        <span>Показывать карточку анонимам на публичной витрине</span>
                                    </label>
                                    <label className="accountPage__formGroup accountPage__formGroup--checkbox accountPage__fullWidth">
                                        <input
                                            type="checkbox"
                                            checked={studentSettings.hintsDisabled}
                                            onChange={(e) =>
                                                setStudentSettings((p) => ({
                                                    ...p,
                                                    hintsDisabled: e.target.checked,
                                                }))
                                            }
                                        />
                                        <span>Отключить подсказки</span>
                                    </label>
                                </div>
                                <div className="accountPage__btnContainer">
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

                            <section className="accountPage__section">
                                <h2 className="accountPage__sectionTitle">Фото профиля</h2>
                                <div className="accountPage__avatarRow">
                                    {avatarUrl ? (
                                        <img
                                            key={avatarUrl}
                                            src={avatarUrl}
                                            alt=""
                                            className="accountPage__avatar"
                                            width={96}
                                            height={96}
                                        />
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

                            <section className="accountPage__section">
                                <h2 className="accountPage__sectionTitle">Резюме</h2>
                                <div className="accountPage__formRow">
                                    <label className="accountPage__formGroup">
                                        <span>Имя</span>
                                        <input value={studentForm.firstName} onChange={(e) => setStudentField('firstName', e.target.value)} />
                                    </label>
                                    <label className="accountPage__formGroup">
                                        <span>Фамилия</span>
                                        <input value={studentForm.lastName} onChange={(e) => setStudentField('lastName', e.target.value)} />
                                    </label>
                                    <label className="accountPage__formGroup">
                                        <span>Город</span>
                                        <input value={studentForm.city} onChange={(e) => setStudentField('city', e.target.value)} placeholder="Не указан" />
                                    </label>
                                    <label className="accountPage__formGroup">
                                        <span>Дата рождения</span>
                                        <input type="date" value={studentForm.birthDate} onChange={(e) => setStudentField('birthDate', e.target.value)} />
                                    </label>
                                    <label className="accountPage__formGroup accountPage__fullWidth">
                                        <span>О себе</span>
                                        <textarea rows={4} value={studentForm.bio} onChange={(e) => setStudentField('bio', e.target.value)} />
                                    </label>
                                    <label className="accountPage__formGroup">
                                        <span>Курс</span>
                                        <select value={studentForm.course} onChange={(e) => setStudentField('course', e.target.value)}>
                                            {COURSES.map((c) => (
                                                <option key={c} value={c}>{COURSE_LABELS[c] || c}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="accountPage__formGroup">
                                        <span>Занятость</span>
                                        <select value={studentForm.busyness} onChange={(e) => setStudentField('busyness', e.target.value)}>
                                            {BUSYNESS.map((b) => (
                                                <option key={b} value={b}>{BUSYNESS_LABELS[b] || b}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="accountPage__formGroup accountPage__fullWidth">
                                        <span>Email</span>
                                        <input type="email" value={studentForm.email} onChange={(e) => setStudentField('email', e.target.value)} />
                                    </label>
                                    <label className="accountPage__formGroup accountPage__fullWidth">
                                        <span>Телефон</span>
                                        <input value={studentForm.phoneNumber} onChange={(e) => setStudentField('phoneNumber', e.target.value)} />
                                    </label>
                                    <label className="accountPage__formGroup accountPage__fullWidth">
                                        <span>Telegram</span>
                                        <input value={studentForm.telegramUsername} onChange={(e) => setStudentField('telegramUsername', e.target.value)} />
                                    </label>
                                    <label className="accountPage__formGroup accountPage__fullWidth">
                                        <span>Специальность</span>
                                        {specialitiesCatalogLoading ? (
                                            <p className="accountPage__skillsEmpty">Загрузка списка специальностей…</p>
                                        ) : specialitiesCatalog.length === 0 ? (
                                            <p className="accountPage__skillsEmpty">Список специальностей временно недоступен</p>
                                        ) : (
                                            <select
                                                value={studentForm.specialityId}
                                                onChange={(e) => setStudentField('specialityId', e.target.value)}
                                            >
                                                <option value="">Не выбрана</option>
                                                {specialitiesCatalog.map((speciality) => {
                                                    const specId = Number(speciality.id);
                                                    const specName =
                                                        speciality.name ||
                                                        speciality.specialityName ||
                                                        speciality.title ||
                                                        `Специальность ${specId}`;
                                                    return (
                                                        <option key={specId} value={String(specId)}>
                                                            {specName}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        )}
                                    </label>
                                    <label className="accountPage__formGroup accountPage__fullWidth">
                                        <span>Навыки</span>
                                        {skillsCatalogLoading ? (
                                            <p className="accountPage__skillsEmpty">Загрузка списка навыков…</p>
                                        ) : skillsCatalog.length === 0 ? (
                                            <p className="accountPage__skillsEmpty">Список навыков временно недоступен</p>
                                        ) : (
                                            <div className="accountPage__skillsGrid" role="group" aria-label="Навыки">
                                                {skillsCatalog.map((skill) => {
                                                    const skillId = Number(skill.id);
                                                    const skillName = skill.name || skill.title || `Навык ${skillId}`;
                                                    const checked = (studentForm.skillsIds || []).includes(skillId);
                                                    return (
                                                        <label key={skillId} className="accountPage__skillOption">
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={() => toggleStudentSkill(skillId)}
                                                            />
                                                            <span>{skillName}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </label>
                                </div>
                                <div className="accountPage__btnContainer">
                                    <button
                                        type="button"
                                        className="accountPage__submit"
                                        disabled={saving === 'resume'}
                                        onClick={saveStudentResume}
                                    >
                                        {saving === 'resume' ? 'Сохранение…' : 'Сохранить изменения'}
                                    </button>
                                </div>
                            </section>

                            <StudentRequestsSection studentId={profile.id} />
                        </>
                    )}

                    {!loading && role === 'recruiter' && profile && (
                        <>
                            <section className="accountPage__section">
                                <h2 className="accountPage__sectionTitle">Профиль рекрутера</h2>
                                <div className="accountPage__formRow">
                                    <label className="accountPage__formGroup accountPage__fullWidth">
                                        <span>Компания</span>
                                        <input value={recruiterForm.companyName} onChange={(e) => setRecruiterField('companyName', e.target.value)} />
                                    </label>
                                    <label className="accountPage__formGroup accountPage__fullWidth">
                                        <span>Город</span>
                                        <input value={recruiterForm.city} onChange={(e) => setRecruiterField('city', e.target.value)} placeholder="Не указан" />
                                    </label>
                                    <label className="accountPage__formGroup">
                                        <span>Имя</span>
                                        <input value={recruiterForm.firstName} onChange={(e) => setRecruiterField('firstName', e.target.value)} />
                                    </label>
                                    <label className="accountPage__formGroup">
                                        <span>Фамилия</span>
                                        <input value={recruiterForm.lastName} onChange={(e) => setRecruiterField('lastName', e.target.value)} />
                                    </label>
                                    <label className="accountPage__formGroup accountPage__fullWidth">
                                        <span>Email</span>
                                        <input type="email" value={recruiterForm.email} onChange={(e) => setRecruiterField('email', e.target.value)} />
                                    </label>
                                    <label className="accountPage__formGroup accountPage__fullWidth">
                                        <span>Телефон</span>
                                        <input value={recruiterForm.phoneNumber} onChange={(e) => setRecruiterField('phoneNumber', e.target.value)} />
                                    </label>
                                    <label className="accountPage__formGroup accountPage__fullWidth">
                                        <span>Telegram</span>
                                        <input value={recruiterForm.telegramUsername} onChange={(e) => setRecruiterField('telegramUsername', e.target.value)} />
                                    </label>
                                </div>
                                <div className="accountPage__btnContainer">
                                    <button
                                        type="button"
                                        className="accountPage__submit"
                                        disabled={saving === 'recruiter'}
                                        onClick={saveRecruiter}
                                    >
                                        {saving === 'recruiter' ? 'Сохранение…' : 'Сохранить изменения'}
                                    </button>
                                </div>
                            </section>
                            <RecruiterRequestsSection recruiterId={profile.id} />
                        </>
                    )}

                    {!loading && role && role !== 'recruiter_pending' && (
                        <section className="accountPage__section">
                            <h2 className="accountPage__sectionTitle">Смена пароля</h2>
                            <form onSubmit={savePassword}>
                                <div className="accountPage__formRow">
                                    <label className="accountPage__formGroup accountPage__fullWidth">
                                        <span>Текущий пароль</span>
                                        <input
                                            type="password"
                                            value={pwdForm.currentPassword}
                                            onChange={(e) => setPwdForm((p) => ({ ...p, currentPassword: e.target.value }))}
                                            required
                                        />
                                    </label>
                                    <label className="accountPage__formGroup accountPage__fullWidth">
                                        <span>Новый пароль</span>
                                        <input
                                            type="password"
                                            value={pwdForm.newPassword}
                                            onChange={(e) => setPwdForm((p) => ({ ...p, newPassword: e.target.value }))}
                                            required
                                        />
                                    </label>
                                </div>
                                <div className="accountPage__btnContainer">
                                    <button type="submit" className="accountPage__submit" disabled={saving === 'password'}>
                                        {saving === 'password' ? 'Сохранение…' : 'Сменить пароль'}
                                    </button>
                                </div>
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
