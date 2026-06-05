import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import Footer from '../components/footer/Footer.jsx';
import {
    completeStudentResumeOnboarding,
    getStudentResumeEdit,
    updateStudentResume,
    setCachedOnboardingStatus,
} from '../services/onboardingApi.js';
import {
    getRegistrationSpecialities,
    getRegistrationSkills,
    catalogRows,
} from '../services/registrationCatalogApi.js';
import GuidedHints from '../components/common/GuidedHints.jsx';
import { getStudentMe } from '../services/getApi.js';
import { getAccountStatus } from '../services/authApi.js';
import './accountPage.css';

const BUSYNESS_OPTIONS = [
    { value: 'FREE', label: 'Свободен' },
    { value: 'FREELANCE', label: 'Фриланс' },
    { value: 'EMPLOYED', label: 'Занят' },
];

const emptyExperienceRow = () => ({
    key: `exp-${Date.now()}-${Math.random()}`,
    companyName: '',
    position: '',
    additionalInfo: '',
    startDate: '',
    endDate: '',
});

const emptyInstitutionRow = () => ({
    key: `edu-${Date.now()}-${Math.random()}`,
    institution: '',
    webUrl: '',
    additionalInfo: '',
    startYear: '',
    endYear: '',
});

const emptyForm = () => ({
    firstName: '',
    lastName: '',
    email: '',
    city: '',
    hhLink: '',
    birthDate: '',
    bio: '',
    busyness: 'FREE',
    phoneNumber: '',
    telegramUsername: '',
    specialityId: '',
    skillsIds: [],
});

const mapExperiencePayload = (rows) =>
    rows
        .filter((row) => row.position.trim() && row.companyName.trim() && row.startDate)
        .map((row) => ({
            companyName: row.companyName.trim(),
            position: row.position.trim(),
            additionalInfo: row.additionalInfo.trim() || undefined,
            startDate: row.startDate,
            endDate: row.endDate || undefined,
        }));

const mapInstitutionPayload = (rows) =>
    rows
        .filter((row) => row.institution.trim() && row.webUrl.trim() && row.startYear && row.endYear)
        .map((row) => ({
            institution: row.institution.trim(),
            webUrl: row.webUrl.trim(),
            additionalInfo: row.additionalInfo.trim() || undefined,
            startYear: Number(row.startYear),
            endYear: Number(row.endYear),
        }));

const OnboardingResume = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState(emptyForm);
    const [editMode, setEditMode] = useState(false);
    const [existingExperiences, setExistingExperiences] = useState([]);
    const [existingInstitutions, setExistingInstitutions] = useState([]);
    const [experienceRows, setExperienceRows] = useState([emptyExperienceRow()]);
    const [institutionRows, setInstitutionRows] = useState([emptyInstitutionRow()]);
    const [specialities, setSpecialities] = useState([]);
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [ok, setOk] = useState('');
    const [accessLimited, setAccessLimited] = useState(false);

    const mapProfileToEditForm = (profile) => {
        if (!profile) return null;
        const hasProfile =
            profile.specialityId != null ||
            profile.firstName ||
            profile.lastName ||
            profile.email;
        if (!hasProfile) return null;
        return {
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            email: profile.email || '',
            city: profile.city || '',
            hhLink: profile.hhLink || '',
            birthDate: profile.birthDate || '',
            bio: profile.bio || '',
            busyness: profile.busyness || 'FREE',
            phoneNumber: profile.phoneNumber || '',
            telegramUsername: profile.telegramUsername || '',
            specialityId: profile.specialityId != null ? String(profile.specialityId) : '',
            skillsIds: Array.isArray(profile.skills)
                ? profile.skills.map((s) => s.id).filter((id) => id != null)
                : Array.isArray(profile.skillsIds)
                  ? profile.skillsIds
                  : [],
            experiences: profile.experiences || [],
            institutions: profile.institutions || [],
        };
    };

    const loadResumeEditData = async () => {
        try {
            return await getStudentResumeEdit();
        } catch (e) {
            if (e.status !== 403) throw e;
            setAccessLimited(true);
            try {
                return mapProfileToEditForm(await getStudentMe());
            } catch {
                return null;
            }
        }
    };

    useEffect(() => {
        (async () => {
            try {
                const [specRes, skillRes, editRes] = await Promise.all([
                    getRegistrationSpecialities(0, 100),
                    getRegistrationSkills(0, 200),
                    loadResumeEditData(),
                ]);
                setSpecialities(catalogRows(specRes));
                setSkills(catalogRows(skillRes));

                if (editRes?.specialityId) {
                    setEditMode(true);
                    setForm({
                        firstName: editRes.firstName || '',
                        lastName: editRes.lastName || '',
                        email: editRes.email || '',
                        city: editRes.city || '',
                        hhLink: editRes.hhLink || '',
                        birthDate: editRes.birthDate || '',
                        bio: editRes.bio || '',
                        busyness: editRes.busyness || 'FREE',
                        phoneNumber: editRes.phoneNumber || '',
                        telegramUsername: editRes.telegramUsername || '',
                        specialityId: String(editRes.specialityId),
                        skillsIds: Array.isArray(editRes.skillsIds) ? editRes.skillsIds : [],
                    });
                    setExistingExperiences(editRes.experiences || []);
                    setExistingInstitutions(editRes.institutions || []);
                }
            } catch (e) {
                setError(e.message || 'Не удалось загрузить данные');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const toggleSkill = (id) => {
        setForm((prev) => {
            const ids = prev.skillsIds.includes(id)
                ? prev.skillsIds.filter((x) => x !== id)
                : [...prev.skillsIds, id];
            return { ...prev, skillsIds: ids };
        });
    };

    const buildPayload = () => ({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        city: form.city.trim() || undefined,
        hhLink: form.hhLink.trim() || undefined,
        birthDate: form.birthDate,
        bio: form.bio.trim() || undefined,
        busyness: form.busyness,
        phoneNumber: form.phoneNumber.trim() || undefined,
        telegramUsername: form.telegramUsername.trim().replace(/^@/, '') || undefined,
        specialityId: Number(form.specialityId),
        skillsIds: form.skillsIds.length ? form.skillsIds : [],
        experiences: mapExperiencePayload(experienceRows),
        institutions: mapInstitutionPayload(institutionRows),
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setOk('');
        if (!form.specialityId) {
            setError('Выберите специальность');
            return;
        }
        setSaving(true);
        try {
            const payload = buildPayload();
            if (editMode) {
                await updateStudentResume(payload);
                setOk('Резюме обновлено.');
            } else {
                await completeStudentResumeOnboarding(payload);
                setCachedOnboardingStatus('student', true);
                setOk('Резюме сохранено. Профиль появится у рекрутеров после модерации.');
            }
            setTimeout(() => navigate('/settings', { replace: true }), 1200);
        } catch (err) {
            if (err.status === 403 || getAccountStatus() === 'PENDING_APPROVAL') {
                setError(
                    'Сохранение резюме пока недоступно: аккаунт на проверке у администратора. Попробуйте после одобрения.',
                );
            } else {
                setError(err.message || 'Не удалось сохранить резюме');
            }
        } finally {
            setSaving(false);
        }
    };

    const updateExperienceRow = (key, field, value) => {
        setExperienceRows((rows) => rows.map((row) => (row.key === key ? { ...row, [field]: value } : row)));
    };

    const updateInstitutionRow = (key, field, value) => {
        setInstitutionRows((rows) => rows.map((row) => (row.key === key ? { ...row, [field]: value } : row)));
    };

    return (
        <>
            <Header />
            <main className="accountPage">
                <div className="accountPage__inner">
                    <h1 className="accountPage__title">{editMode ? 'Редактирование резюме' : 'Заполнение резюме'}</h1>
                    <p className="accountPage__lead">
                        {editMode
                            ? 'Обновите данные профиля, навыки, опыт и образование. Новые записи добавляются к уже сохранённым.'
                            : 'Обязательные поля отмечены. Курс на сервере будет NEW до модерации администратором.'}
                    </p>
                    {editMode ? (
                        <p className="accountPage__settingsNav">
                            <Link to="/settings" className="accountPage__settingsNavLink">
                                Вернуться в настройки
                            </Link>
                        </p>
                    ) : null}

                    {loading && <p className="accountPage__muted">Загрузка…</p>}

                    {!loading && (accessLimited || getAccountStatus() === 'PENDING_APPROVAL') && (
                        <div className="accountPage__banner" role="status">
                            Аккаунт на проверке: полное редактирование резюме откроется после одобрения администратором.
                            {editMode ? ' Ниже показаны данные из профиля — только для просмотра.' : ''}
                        </div>
                    )}

                    {!loading && (
                        <section className="accountPage__card">
                            <GuidedHints formId="resume" title="Подсказки по резюме" />
                            <form className="accountPage__form" onSubmit={handleSubmit}>
                                <div className="accountPage__grid2">
                                    <label className="accountPage__field">
                                        <span>Имя *</span>
                                        <input
                                            value={form.firstName}
                                            onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                                            required
                                        />
                                    </label>
                                    <label className="accountPage__field">
                                        <span>Фамилия *</span>
                                        <input
                                            value={form.lastName}
                                            onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                                            required
                                        />
                                    </label>
                                </div>
                                <label className="accountPage__field">
                                    <span>Email *</span>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                                        required
                                    />
                                </label>
                                <label className="accountPage__field">
                                    <span>Дата рождения *</span>
                                    <input
                                        type="date"
                                        value={form.birthDate}
                                        onChange={(e) => setForm((p) => ({ ...p, birthDate: e.target.value }))}
                                        required
                                    />
                                </label>
                                <div className="accountPage__grid2">
                                    <label className="accountPage__field">
                                        <span>Город</span>
                                        <input
                                            value={form.city}
                                            onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                                        />
                                    </label>
                                    <label className="accountPage__field">
                                        <span>Занятость *</span>
                                        <select
                                            value={form.busyness}
                                            onChange={(e) => setForm((p) => ({ ...p, busyness: e.target.value }))}
                                        >
                                            {BUSYNESS_OPTIONS.map((o) => (
                                                <option key={o.value} value={o.value}>
                                                    {o.label}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                                <label className="accountPage__field">
                                    <span>Специальность *</span>
                                    <select
                                        value={form.specialityId}
                                        onChange={(e) => setForm((p) => ({ ...p, specialityId: e.target.value }))}
                                        required
                                    >
                                        <option value="">Выберите…</option>
                                        {specialities.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name || s.title}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <fieldset className="accountPage__field">
                                    <span>Навыки</span>
                                    <div className="accountPage__skillsChips">
                                        {skills.map((sk) => (
                                            <label key={sk.id} className="accountPage__skillChip">
                                                <input
                                                    type="checkbox"
                                                    checked={form.skillsIds.includes(sk.id)}
                                                    onChange={() => toggleSkill(sk.id)}
                                                />
                                                {sk.name || sk.title}
                                            </label>
                                        ))}
                                    </div>
                                </fieldset>
                                <label className="accountPage__field">
                                    <span>Ссылка HH</span>
                                    <input
                                        value={form.hhLink}
                                        onChange={(e) => setForm((p) => ({ ...p, hhLink: e.target.value }))}
                                    />
                                </label>
                                <label className="accountPage__field">
                                    <span>О себе</span>
                                    <textarea
                                        rows={4}
                                        value={form.bio}
                                        onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                                    />
                                </label>
                                <div className="accountPage__grid2">
                                    <label className="accountPage__field">
                                        <span>Телефон</span>
                                        <input
                                            value={form.phoneNumber}
                                            onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                                        />
                                    </label>
                                    <label className="accountPage__field">
                                        <span>Telegram</span>
                                        <input
                                            value={form.telegramUsername}
                                            onChange={(e) =>
                                                setForm((p) => ({ ...p, telegramUsername: e.target.value }))
                                            }
                                            placeholder="username"
                                        />
                                    </label>
                                </div>

                                <div className="accountPage__subsection">
                                    <h3 className="accountPage__subsectionTitle">Опыт работы</h3>
                                    {existingExperiences.length > 0 ? (
                                        <ul className="accountPage__savedList">
                                            {existingExperiences.map((item) => (
                                                <li key={item.id} className="accountPage__savedItem">
                                                    <strong>{item.position}</strong>
                                                    {item.companyName ? ` — ${item.companyName}` : ''}
                                                    {item.startDate ? (
                                                        <span className="accountPage__muted">
                                                            {' '}
                                                            ({item.startDate}
                                                            {item.endDate ? ` — ${item.endDate}` : ' — н.в.'})
                                                        </span>
                                                    ) : null}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="accountPage__hint">Пока нет сохранённого опыта.</p>
                                    )}
                                    {experienceRows.map((row, index) => (
                                        <div key={row.key} className="accountPage__repeatBlock">
                                            <p className="accountPage__repeatLabel">Новая запись {index + 1}</p>
                                            <div className="accountPage__grid2">
                                                <label className="accountPage__field">
                                                    <span>Компания</span>
                                                    <input
                                                        value={row.companyName}
                                                        onChange={(e) =>
                                                            updateExperienceRow(row.key, 'companyName', e.target.value)
                                                        }
                                                    />
                                                </label>
                                                <label className="accountPage__field">
                                                    <span>Должность</span>
                                                    <input
                                                        value={row.position}
                                                        onChange={(e) =>
                                                            updateExperienceRow(row.key, 'position', e.target.value)
                                                        }
                                                    />
                                                </label>
                                            </div>
                                            <div className="accountPage__grid2">
                                                <label className="accountPage__field">
                                                    <span>Начало</span>
                                                    <input
                                                        type="date"
                                                        value={row.startDate}
                                                        onChange={(e) =>
                                                            updateExperienceRow(row.key, 'startDate', e.target.value)
                                                        }
                                                    />
                                                </label>
                                                <label className="accountPage__field">
                                                    <span>Окончание</span>
                                                    <input
                                                        type="date"
                                                        value={row.endDate}
                                                        onChange={(e) =>
                                                            updateExperienceRow(row.key, 'endDate', e.target.value)
                                                        }
                                                    />
                                                </label>
                                            </div>
                                            <label className="accountPage__field">
                                                <span>Описание</span>
                                                <textarea
                                                    rows={2}
                                                    value={row.additionalInfo}
                                                    onChange={(e) =>
                                                        updateExperienceRow(row.key, 'additionalInfo', e.target.value)
                                                    }
                                                />
                                            </label>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className="accountPage__submit accountPage__submit--secondary"
                                        onClick={() => setExperienceRows((rows) => [...rows, emptyExperienceRow()])}
                                    >
                                        Добавить опыт
                                    </button>
                                </div>

                                <div className="accountPage__subsection">
                                    <h3 className="accountPage__subsectionTitle">Образование</h3>
                                    {existingInstitutions.length > 0 ? (
                                        <ul className="accountPage__savedList">
                                            {existingInstitutions.map((item) => (
                                                <li key={item.id} className="accountPage__savedItem">
                                                    <strong>{item.institution}</strong>
                                                    <span className="accountPage__muted">
                                                        {' '}
                                                        ({item.startYear} — {item.endYear})
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="accountPage__hint">Пока нет сохранённого образования.</p>
                                    )}
                                    {institutionRows.map((row, index) => (
                                        <div key={row.key} className="accountPage__repeatBlock">
                                            <p className="accountPage__repeatLabel">Новая запись {index + 1}</p>
                                            <label className="accountPage__field">
                                                <span>Учебное заведение</span>
                                                <input
                                                    value={row.institution}
                                                    onChange={(e) =>
                                                        updateInstitutionRow(row.key, 'institution', e.target.value)
                                                    }
                                                />
                                            </label>
                                            <label className="accountPage__field">
                                                <span>Сайт вуза</span>
                                                <input
                                                    value={row.webUrl}
                                                    onChange={(e) =>
                                                        updateInstitutionRow(row.key, 'webUrl', e.target.value)
                                                    }
                                                    placeholder="https://..."
                                                />
                                            </label>
                                            <div className="accountPage__grid2">
                                                <label className="accountPage__field">
                                                    <span>Год начала</span>
                                                    <input
                                                        type="number"
                                                        min="1900"
                                                        max="2100"
                                                        value={row.startYear}
                                                        onChange={(e) =>
                                                            updateInstitutionRow(row.key, 'startYear', e.target.value)
                                                        }
                                                    />
                                                </label>
                                                <label className="accountPage__field">
                                                    <span>Год окончания</span>
                                                    <input
                                                        type="number"
                                                        min="1900"
                                                        max="2100"
                                                        value={row.endYear}
                                                        onChange={(e) =>
                                                            updateInstitutionRow(row.key, 'endYear', e.target.value)
                                                        }
                                                    />
                                                </label>
                                            </div>
                                            <label className="accountPage__field">
                                                <span>Дополнительно</span>
                                                <textarea
                                                    rows={2}
                                                    value={row.additionalInfo}
                                                    onChange={(e) =>
                                                        updateInstitutionRow(row.key, 'additionalInfo', e.target.value)
                                                    }
                                                />
                                            </label>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className="accountPage__submit accountPage__submit--secondary"
                                        onClick={() => setInstitutionRows((rows) => [...rows, emptyInstitutionRow()])}
                                    >
                                        Добавить образование
                                    </button>
                                </div>

                                {error ? (
                                    <div className="accountPage__error" role="alert">
                                        {error}
                                    </div>
                                ) : null}
                                {ok ? <div className="accountPage__ok">{ok}</div> : null}
                                <button type="submit" className="accountPage__submit" disabled={saving}>
                                    {saving ? 'Сохранение…' : editMode ? 'Сохранить изменения' : 'Сохранить резюме'}
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

export default OnboardingResume;
