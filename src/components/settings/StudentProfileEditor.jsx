import React, { useEffect, useRef, useState } from 'react';
import { uploadStudentPhoto } from '../../services/accountApi.js';
import {
    addStudentPortfolio,
    completeStudentResumeOnboarding,
    deleteStudentPortfolio,
    getStudentPortfolio,
    getStudentResumeEdit,
    updateStudentResume,
    setCachedOnboardingStatus,
} from '../../services/onboardingApi.js';
import numbersImg from '../../assets/other/numbers.png';
import BehindOrange from '../../assets/other/BehindOrange.png';
import BehindPink from '../../assets/other/BehindPink.png';
import BehindBlue from '../../assets/other/BehindBlue.png';
import '../../components/studentResume/studentResume.css';
import './studentOwnProfile.css';
import {
    loadAllRegistrationSkills,
    loadAllRegistrationSpecialities,
} from '../../services/registrationCatalogApi.js';
import { getStudentMe } from '../../services/getApi.js';
import { getImageUrl } from '../../config/api.js';
import { getAccountStatus } from '../../services/authApi.js';
import GuidedHints from '../common/GuidedHints.jsx';
import StudentProfileMetaFooter from './StudentProfileMetaFooter.jsx';
import PhoneNumberField from '../common/PhoneNumberField.jsx';
import {
    BUSYNESS_OPTIONS,
    COURSE_OPTIONS,
    buildStudentResumePayload,
    emptyExperienceRow,
    emptyInstitutionRow,
    emptyStudentResumeForm,
    mapProfileToEditForm,
} from '../../utils/studentResumeForm.js';

const PORTFOLIO_BACKGROUNDS = [BehindOrange, BehindPink, BehindBlue];
const PLACEHOLDER_AVATAR =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Ccircle fill='%23444' cx='100' cy='100' r='100'/%3E%3Ccircle fill='%23666' cx='100' cy='82' r='28'/%3E%3Cellipse fill='%23666' cx='100' cy='165' rx='45' ry='38'/%3E%3C/svg%3E";

const StudentProfileEditor = ({
    onSaved,
    onCancel,
    onPortfolioChange,
    showGuidedHints = false,
    showProfileMeta = false,
    profileMeta = null,
    resumeLayout = false,
    submitLabel = 'Сохранить профиль',
}) => {
    const [form, setForm] = useState(emptyStudentResumeForm);
    const [editMode, setEditMode] = useState(false);
    const [hasExistingResume, setHasExistingResume] = useState(false);
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
    const [portfolios, setPortfolios] = useState([]);
    const [portfolioForm, setPortfolioForm] = useState({ name: '', link: '', additionalInfo: '' });
    const [portfolioBusy, setPortfolioBusy] = useState(false);
    const [portfolioError, setPortfolioError] = useState('');
    const [pendingPortfolios, setPendingPortfolios] = useState([]);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [pendingPhotoFile, setPendingPhotoFile] = useState(null);
    const [currentImagePath, setCurrentImagePath] = useState(null);
    const photoInputRef = useRef(null);

    const mergeEditData = (editRes, meProfile) => {
        const fromMe = meProfile ? mapProfileToEditForm(meProfile) : null;
        const base = editRes || fromMe;
        if (!base) return null;
        return {
            ...base,
            firstName: base.firstName || fromMe?.firstName || '',
            lastName: base.lastName || fromMe?.lastName || '',
            email: base.email || fromMe?.email || meProfile?.email || '',
            city: base.city || fromMe?.city || meProfile?.city || '',
            hhLink: base.hhLink || fromMe?.hhLink || meProfile?.hhLink || '',
            birthDate: base.birthDate || fromMe?.birthDate || meProfile?.birthDate || '',
            bio: base.bio || fromMe?.bio || meProfile?.bio || '',
            busyness: base.busyness || fromMe?.busyness || meProfile?.busyness || 'FREE',
            course:
                base.course && base.course !== 'NEW'
                    ? base.course
                    : fromMe?.course || (meProfile?.course && meProfile.course !== 'NEW' ? meProfile.course : ''),
            phoneNumber: base.phoneNumber || fromMe?.phoneNumber || meProfile?.phoneNumber || '',
            telegramUsername:
                base.telegramUsername || fromMe?.telegramUsername || meProfile?.telegramUsername || '',
            specialityId:
                base.specialityId != null && base.specialityId !== ''
                    ? base.specialityId
                    : fromMe?.specialityId || (meProfile?.specialityId != null ? String(meProfile.specialityId) : ''),
            skillsIds:
                Array.isArray(base.skillsIds) && base.skillsIds.length
                    ? base.skillsIds
                    : fromMe?.skillsIds || [],
            experiences: base.experiences || fromMe?.experiences || [],
            institutions: base.institutions || fromMe?.institutions || [],
        };
    };

    const loadResumeEditData = async (meProfile) => {
        try {
            return mergeEditData(await getStudentResumeEdit(), meProfile);
        } catch (e) {
            if (e.status === 403) {
                setAccessLimited(true);
            } else if (e.status !== 400 && e.status !== 404 && e.status !== 500) {
                throw e;
            }
            return mergeEditData(null, meProfile);
        }
    };

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const meProfile = await getStudentMe().catch(() => null);
                const [specialitiesList, skillsList, editRes] = await Promise.all([
                    loadAllRegistrationSpecialities(),
                    loadAllRegistrationSkills(),
                    loadResumeEditData(meProfile),
                ]);
                if (cancelled) return;
                setSpecialities(specialitiesList);
                setSkills(skillsList);

                const resumeExists = Boolean(meProfile?.id);
                setHasExistingResume(resumeExists);
                if (resumeExists) {
                    setEditMode(true);
                    setCachedOnboardingStatus('student', true);
                }
                if (editRes) {
                    const specialityFromEdit =
                        editRes.specialityId != null && Number(editRes.specialityId) > 0
                            ? String(editRes.specialityId)
                            : meProfile?.specialityId != null
                              ? String(meProfile.specialityId)
                              : '';
                    setForm({
                        firstName: editRes.firstName || meProfile?.firstName || '',
                        lastName: editRes.lastName || meProfile?.lastName || '',
                        email: editRes.email || meProfile?.email || '',
                        city: editRes.city || meProfile?.city || '',
                        hhLink: editRes.hhLink || meProfile?.hhLink || '',
                        birthDate: editRes.birthDate || meProfile?.birthDate || '',
                        bio: editRes.bio || meProfile?.bio || '',
                        busyness: editRes.busyness || meProfile?.busyness || 'FREE',
                        course:
                            editRes.course && editRes.course !== 'NEW'
                                ? editRes.course
                                : meProfile?.course && meProfile.course !== 'NEW'
                                  ? meProfile.course
                                  : '',
                        phoneNumber: editRes.phoneNumber || meProfile?.phoneNumber || '',
                        telegramUsername: editRes.telegramUsername || meProfile?.telegramUsername || '',
                        specialityId: specialityFromEdit,
                        skillsIds: Array.isArray(editRes.skillsIds) && editRes.skillsIds.length
                            ? editRes.skillsIds
                            : Array.isArray(meProfile?.skills)
                              ? meProfile.skills.map((s) => s.id).filter((id) => id != null)
                              : [],
                    });
                    setExistingExperiences(editRes.experiences || []);
                    setExistingInstitutions(editRes.institutions || []);
                    if (meProfile?.imagePath) {
                        setCurrentImagePath(meProfile.imagePath);
                    }
                }
            } catch (e) {
                if (!cancelled) {
                    setError(e.message || 'Не удалось загрузить данные профиля');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!resumeLayout) return;
        let cancelled = false;
        (async () => {
            try {
                const items = await getStudentPortfolio();
                if (!cancelled) {
                    setPortfolios(Array.isArray(items) ? items : []);
                }
            } catch {
                if (!cancelled) setPortfolios([]);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [resumeLayout, editMode]);

    useEffect(() => {
        if (!resumeLayout) return;
        let cancelled = false;
        (async () => {
            try {
                const me = await getStudentMe();
                if (!cancelled && me?.imagePath) {
                    setCurrentImagePath(me.imagePath);
                }
            } catch {
                /* первичное заполнение — фото появится после сохранения */
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [resumeLayout]);

    const flushPendingPortfolios = async () => {
        if (!pendingPortfolios.length) return;
        for (const item of pendingPortfolios) {
            await addStudentPortfolio({
                name: item.name,
                link: item.link,
                additionalInfo: item.additionalInfo || undefined,
            });
        }
        setPendingPortfolios([]);
        onPortfolioChange?.();
    };

    const handlePhotoPick = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setPendingPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
        if (photoInputRef.current) {
            photoInputRef.current.value = '';
        }
    };

    const handleAddPortfolio = async () => {
        const name = portfolioForm.name.trim();
        const link = portfolioForm.link.trim();
        if (!name || !link) {
            setPortfolioError('Укажите название и ссылку');
            return;
        }
        const additionalInfo = portfolioForm.additionalInfo.trim() || undefined;
        setPortfolioError('');

        if (!editMode) {
            setPendingPortfolios((prev) => [
                ...prev,
                { tempId: `pending-${Date.now()}`, name, link, additionalInfo },
            ]);
            setPortfolioForm({ name: '', link: '', additionalInfo: '' });
            return;
        }

        setPortfolioBusy(true);
        try {
            const created = await addStudentPortfolio({ name, link, additionalInfo });
            setPortfolios((prev) => [...prev, created]);
            setPortfolioForm({ name: '', link: '', additionalInfo: '' });
            onPortfolioChange?.();
        } catch (err) {
            setPortfolioError(err.message || 'Не удалось добавить запись');
        } finally {
            setPortfolioBusy(false);
        }
    };

    const handleDeletePortfolio = async (portfolioId) => {
        if (String(portfolioId).startsWith('pending-')) {
            setPendingPortfolios((prev) => prev.filter((item) => item.tempId !== portfolioId));
            return;
        }

        setPortfolioBusy(true);
        setPortfolioError('');
        try {
            await deleteStudentPortfolio(portfolioId);
            setPortfolios((prev) => prev.filter((item) => item.id !== portfolioId));
            onPortfolioChange?.();
        } catch (err) {
            setPortfolioError(err.message || 'Не удалось удалить запись');
        } finally {
            setPortfolioBusy(false);
        }
    };

    const toggleSkill = (id) => {
        setForm((prev) => {
            const ids = prev.skillsIds.includes(id)
                ? prev.skillsIds.filter((x) => x !== id)
                : [...prev.skillsIds, id];
            return { ...prev, skillsIds: ids };
        });
    };

    const updateExperienceRow = (key, field, value) => {
        setExperienceRows((rows) => rows.map((row) => (row.key === key ? { ...row, [field]: value } : row)));
    };

    const updateInstitutionRow = (key, field, value) => {
        setInstitutionRows((rows) => rows.map((row) => (row.key === key ? { ...row, [field]: value } : row)));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setOk('');
        if (!form.specialityId) {
            setError('Выберите специальность');
            return;
        }
        if (!form.email.trim()) {
            setError('Укажите email');
            return;
        }
        if (!form.birthDate) {
            setError('Укажите дату рождения');
            return;
        }
        if (!form.course) {
            setError('Выберите курс');
            return;
        }
        setSaving(true);
        try {
            const payload = buildStudentResumePayload(form, experienceRows, institutionRows);
            if (editMode || hasExistingResume) {
                await updateStudentResume(payload);
                setOk('Профиль сохранён');
            } else {
                await completeStudentResumeOnboarding(payload);
                setCachedOnboardingStatus('student', true);
                setEditMode(true);
                setOk('Резюме сохранено. Профиль появится у рекрутеров после модерации.');
            }
            let refreshed = await getStudentMe().catch(() => null);
            if (refreshed) {
                try {
                    await flushPendingPortfolios();
                } catch (portfolioErr) {
                    setError(
                        portfolioErr.message || 'Профиль сохранён, но не удалось сохранить портфолио.',
                    );
                }
                if (pendingPhotoFile && refreshed.id) {
                    try {
                        await uploadStudentPhoto(refreshed.id, pendingPhotoFile);
                        refreshed = (await getStudentMe().catch(() => refreshed)) || refreshed;
                        setPendingPhotoFile(null);
                    } catch (photoErr) {
                        setError(
                            photoErr.message || 'Профиль сохранён, но не удалось загрузить фото.',
                        );
                    }
                }
                onSaved?.(refreshed);
            }
        } catch (err) {
            setError(err.message || 'Не удалось сохранить профиль');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <p className="accountPage__muted">Загрузка формы…</p>;
    }

    const isPending = accessLimited || getAccountStatus() === 'PENDING_APPROVAL';

    const displayedPortfolios = [
        ...portfolios,
        ...pendingPortfolios.map((item) => ({
            id: item.tempId,
            name: item.name,
            link: item.link,
            additionalInfo: item.additionalInfo,
            pending: true,
        })),
    ];

    const portfolioSection = resumeLayout ? (
        <div className="StudentResume__section">
            <h3 className="StudentResume__sectionTitle">Портфолио</h3>
            {displayedPortfolios.length > 0 ? (
                <div className="StudentResume__portfolio StudentOwnProfile__portfolioEdit">
                    {displayedPortfolios.map((project, index) => (
                        <div
                            key={project.id}
                            className="StudentResume__portfolioItem StudentOwnProfile__portfolioItem"
                            style={{
                                backgroundImage: `url(${PORTFOLIO_BACKGROUNDS[index % PORTFOLIO_BACKGROUNDS.length]})`,
                            }}
                        >
                            <div className="StudentResume__portfolioContent">
                                <p className="StudentResume__portfolioTitle">{project.name}</p>
                                {project.additionalInfo ? (
                                    <p className="StudentResume__portfolioDescription">{project.additionalInfo}</p>
                                ) : null}
                                <a
                                    href={project.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="StudentOwnProfile__portfolioLink"
                                >
                                    {project.link}
                                </a>
                            </div>
                            <button
                                type="button"
                                className="StudentOwnProfile__portfolioRemove"
                                disabled={portfolioBusy}
                                onClick={() => handleDeletePortfolio(project.id)}
                            >
                                Удалить
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="StudentResume__sectionText StudentOwnProfile__emptyHint">
                    Добавьте ссылки на GitHub, Behance или другие проекты
                </p>
            )}
            <div className="StudentOwnProfile__portfolioAdd">
                <input
                    className="StudentOwnProfile__input"
                    placeholder="Название (например, Github)"
                    value={portfolioForm.name}
                    onChange={(e) => setPortfolioForm((p) => ({ ...p, name: e.target.value }))}
                />
                <input
                    className="StudentOwnProfile__input"
                    placeholder="Ссылка https://..."
                    value={portfolioForm.link}
                    onChange={(e) => setPortfolioForm((p) => ({ ...p, link: e.target.value }))}
                />
                <input
                    className="StudentOwnProfile__input"
                    placeholder="Краткое описание (необязательно)"
                    value={portfolioForm.additionalInfo}
                    onChange={(e) => setPortfolioForm((p) => ({ ...p, additionalInfo: e.target.value }))}
                />
                <button
                    type="button"
                    className="accountPage__submit accountPage__submit--secondary"
                    disabled={portfolioBusy}
                    onClick={handleAddPortfolio}
                >
                    {portfolioBusy ? 'Сохранение…' : 'Добавить в портфолио'}
                </button>
            </div>
            {portfolioError ? (
                <div className="accountPage__error" role="alert">
                    {portfolioError}
                </div>
            ) : null}
        </div>
    ) : null;

    const skillsField = resumeLayout ? (
        <div className="StudentResume__section">
            <h3 className="StudentResume__sectionTitle">Hard-скиллы (навыки)</h3>
            <p className="StudentOwnProfile__skillsHint">Нажмите на навык, чтобы добавить или убрать</p>
            <div className="StudentResume__skills">
                {skills.length === 0 ? (
                    <span className="StudentResume__skillCapsule StudentOwnProfile__skillsEmpty">
                        Навыки не загрузились — обновите страницу
                    </span>
                ) : null}
                {skills.map((sk) => {
                    const selected = form.skillsIds.includes(sk.id);
                    return (
                        <button
                            type="button"
                            key={sk.id}
                            className={`StudentResume__skillCapsule StudentResume__skillCapsule--toggle${selected ? ' is-selected' : ''}`}
                            onClick={() => toggleSkill(sk.id)}
                        >
                            {sk.name || sk.title}
                        </button>
                    );
                })}
            </div>
        </div>
    ) : (
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
    );

    if (resumeLayout) {
        return (
            <>
                {isPending ? (
                    <div className="accountPage__banner" role="status">
                        Аккаунт на проверке: полное редактирование откроется после одобрения администратором.
                    </div>
                ) : null}

                <form className="StudentResume StudentResume--editing" onSubmit={handleSubmit}>
                    <div className="StudentResume__mainContent">
                        <div className="StudentResume__wrapper">
                            <img src={numbersImg} alt="" className="StudentResume__numbersImg" />
                            <div className="StudentResume__profile">
                                <div className="StudentResume__header StudentOwnProfile__headerEdit">
                                    <div className="StudentResume__person">
                                        <div className="StudentResume__personFace">
                                            <img
                                                src={
                                                    photoPreview ||
                                                    getImageUrl(currentImagePath) ||
                                                    PLACEHOLDER_AVATAR
                                                }
                                                alt="Фото профиля"
                                                width="236"
                                                height="236"
                                            />
                                            <input
                                                ref={photoInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="accountPage__fileInput"
                                                onChange={handlePhotoPick}
                                            />
                                            <button
                                                type="button"
                                                className="StudentOwnProfile__photoBtn"
                                                onClick={() => photoInputRef.current?.click()}
                                            >
                                                {photoPreview || currentImagePath
                                                    ? 'Сменить фото'
                                                    : 'Загрузить фото'}
                                            </button>
                                        </div>
                                        <div className="StudentResume__personName StudentOwnProfile__nameFields">
                                            <input
                                                className="StudentOwnProfile__input StudentOwnProfile__input--title"
                                                placeholder="Имя"
                                                value={form.firstName}
                                                onChange={(e) =>
                                                    setForm((p) => ({ ...p, firstName: e.target.value }))
                                                }
                                                required
                                            />
                                            <input
                                                className="StudentOwnProfile__input StudentOwnProfile__input--title"
                                                placeholder="Фамилия"
                                                value={form.lastName}
                                                onChange={(e) =>
                                                    setForm((p) => ({ ...p, lastName: e.target.value }))
                                                }
                                                required
                                            />
                                            <select
                                                className="StudentOwnProfile__input StudentOwnProfile__input--subtitle"
                                                value={form.specialityId}
                                                onChange={(e) =>
                                                    setForm((p) => ({ ...p, specialityId: e.target.value }))
                                                }
                                                required
                                            >
                                                <option value="">Специальность…</option>
                                                {specialities.map((s) => (
                                                    <option key={s.id} value={s.id}>
                                                        {s.name || s.title}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="StudentResume__flexInfo StudentOwnProfile__metaFields">
                                    <label className="StudentOwnProfile__metaLabel">
                                        <span>Дата рождения</span>
                                        <input
                                            type="date"
                                            className="StudentOwnProfile__input StudentOwnProfile__input--meta"
                                            value={form.birthDate}
                                            onChange={(e) =>
                                                setForm((p) => ({ ...p, birthDate: e.target.value }))
                                            }
                                            required
                                        />
                                    </label>
                                    <label className="StudentOwnProfile__metaLabel">
                                        <span>Город</span>
                                        <input
                                            className="StudentOwnProfile__input StudentOwnProfile__input--meta"
                                            placeholder="г. Чебоксары"
                                            value={form.city}
                                            onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                                        />
                                    </label>
                                    <label className="StudentOwnProfile__metaLabel">
                                        <span>Анкета hh.ru</span>
                                        <input
                                            className="StudentOwnProfile__input StudentOwnProfile__input--meta"
                                            placeholder="https://hh.ru/..."
                                            value={form.hhLink}
                                            onChange={(e) => setForm((p) => ({ ...p, hhLink: e.target.value }))}
                                        />
                                    </label>
                                </div>

                                <div className="StudentResume__about">
                                    <div className="StudentResume__section">
                                        <h3 className="StudentResume__sectionTitle">Обо мне</h3>
                                        <textarea
                                            className="StudentOwnProfile__textarea"
                                            rows={5}
                                            placeholder="Расскажите о себе, опыте и достижениях"
                                            value={form.bio}
                                            onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                                        />
                                    </div>

                                    {skillsField}
                                    {portfolioSection}

                                    <div className="StudentOwnProfile__contactsGrid">
                                        <input
                                            type="email"
                                            className="StudentOwnProfile__input"
                                            placeholder="Email *"
                                            value={form.email}
                                            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                                            required
                                        />
                                        <PhoneNumberField
                                            className="StudentOwnProfile__phoneField"
                                            inputClassName="StudentOwnProfile__input StudentOwnProfile__input--phone"
                                            value={form.phoneNumber}
                                            onChange={(phone) =>
                                                setForm((p) => ({ ...p, phoneNumber: phone }))
                                            }
                                        />
                                        <input
                                            className="StudentOwnProfile__input"
                                            placeholder="Telegram"
                                            value={form.telegramUsername}
                                            onChange={(e) =>
                                                setForm((p) => ({
                                                    ...p,
                                                    telegramUsername: e.target.value,
                                                }))
                                            }
                                        />
                                        <select
                                            className="StudentOwnProfile__input"
                                            value={form.busyness}
                                            onChange={(e) =>
                                                setForm((p) => ({ ...p, busyness: e.target.value }))
                                            }
                                        >
                                            {BUSYNESS_OPTIONS.map((o) => (
                                                <option key={o.value} value={o.value}>
                                                    {o.label}
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            className="StudentOwnProfile__input"
                                            value={form.course}
                                            onChange={(e) =>
                                                setForm((p) => ({ ...p, course: e.target.value }))
                                            }
                                            required
                                        >
                                            <option value="">Курс *</option>
                                            {COURSE_OPTIONS.map((o) => (
                                                <option key={o.value} value={o.value}>
                                                    {o.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="StudentResume__additionalSections StudentOwnProfile__extraSections">
                            <div className="accountPage__subsection">
                                <h3 className="accountPage__subsectionTitle">Опыт работы</h3>
                                {existingExperiences.length > 0 ? (
                                    <ul className="accountPage__savedList">
                                        {existingExperiences.map((item) => (
                                            <li key={item.id} className="accountPage__savedItem">
                                                <strong>{item.position}</strong>
                                                {item.companyName ? ` — ${item.companyName}` : ''}
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
                                            <input
                                                className="StudentOwnProfile__input"
                                                placeholder="Компания"
                                                value={row.companyName}
                                                onChange={(e) =>
                                                    updateExperienceRow(row.key, 'companyName', e.target.value)
                                                }
                                            />
                                            <input
                                                className="StudentOwnProfile__input"
                                                placeholder="Должность"
                                                value={row.position}
                                                onChange={(e) =>
                                                    updateExperienceRow(row.key, 'position', e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="accountPage__grid2">
                                            <input
                                                type="date"
                                                className="StudentOwnProfile__input"
                                                value={row.startDate}
                                                onChange={(e) =>
                                                    updateExperienceRow(row.key, 'startDate', e.target.value)
                                                }
                                            />
                                            <input
                                                type="date"
                                                className="StudentOwnProfile__input"
                                                value={row.endDate}
                                                onChange={(e) =>
                                                    updateExperienceRow(row.key, 'endDate', e.target.value)
                                                }
                                            />
                                        </div>
                                        <textarea
                                            className="StudentOwnProfile__textarea"
                                            rows={2}
                                            placeholder="Описание"
                                            value={row.additionalInfo}
                                            onChange={(e) =>
                                                updateExperienceRow(row.key, 'additionalInfo', e.target.value)
                                            }
                                        />
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    className="accountPage__submit accountPage__submit--secondary"
                                    onClick={() =>
                                        setExperienceRows((rows) => [...rows, emptyExperienceRow()])
                                    }
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
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="accountPage__hint">Пока нет сохранённого образования.</p>
                                )}
                                {institutionRows.map((row, index) => (
                                    <div key={row.key} className="accountPage__repeatBlock">
                                        <p className="accountPage__repeatLabel">Новая запись {index + 1}</p>
                                        <input
                                            className="StudentOwnProfile__input"
                                            placeholder="Учебное заведение"
                                            value={row.institution}
                                            onChange={(e) =>
                                                updateInstitutionRow(row.key, 'institution', e.target.value)
                                            }
                                        />
                                        <div className="accountPage__grid2">
                                            <input
                                                type="number"
                                                className="StudentOwnProfile__input"
                                                placeholder="Год начала"
                                                value={row.startYear}
                                                onChange={(e) =>
                                                    updateInstitutionRow(row.key, 'startYear', e.target.value)
                                                }
                                            />
                                            <input
                                                type="number"
                                                className="StudentOwnProfile__input"
                                                placeholder="Год окончания"
                                                value={row.endYear}
                                                onChange={(e) =>
                                                    updateInstitutionRow(row.key, 'endYear', e.target.value)
                                                }
                                            />
                                        </div>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    className="accountPage__submit accountPage__submit--secondary"
                                    onClick={() =>
                                        setInstitutionRows((rows) => [...rows, emptyInstitutionRow()])
                                    }
                                >
                                    Добавить образование
                                </button>
                            </div>
                        </div>

                        {error ? (
                            <div className="accountPage__error" role="alert">
                                {error}
                            </div>
                        ) : null}
                        {ok ? <div className="accountPage__ok">{ok}</div> : null}

                        <div className="accountPage__formActions StudentOwnProfile__formActions">
                            {onCancel ? (
                                <button
                                    type="button"
                                    className="accountPage__submit accountPage__submit--secondary"
                                    onClick={onCancel}
                                    disabled={saving}
                                >
                                    Отмена
                                </button>
                            ) : null}
                            <button type="submit" className="accountPage__submit" disabled={saving}>
                                {saving ? 'Сохранение…' : submitLabel}
                            </button>
                        </div>

                        {showProfileMeta && profileMeta ? (
                            <StudentProfileMetaFooter
                                profile={profileMeta.profile}
                                portfolioCount={displayedPortfolios.length}
                                publicProfileConsent={profileMeta.publicProfileConsent}
                                onConsentChange={profileMeta.onConsentChange}
                                consentSaving={profileMeta.consentSaving}
                                consentError={profileMeta.consentError}
                            />
                        ) : null}
                    </div>
                </form>
            </>
        );
    }

    return (
        <>
            {isPending ? (
                <div className="accountPage__banner" role="status">
                    Аккаунт на проверке: полное редактирование откроется после одобрения администратором.
                </div>
            ) : null}

            {showGuidedHints ? <GuidedHints formId="resume" title="Подсказки по резюме" /> : null}

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
                        <span>Курс *</span>
                        <select
                            value={form.course}
                            onChange={(e) => setForm((p) => ({ ...p, course: e.target.value }))}
                            required
                        >
                            <option value="">Выберите…</option>
                            {COURSE_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
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
                {skillsField}
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
                        <PhoneNumberField
                            value={form.phoneNumber}
                            onChange={(phone) => setForm((p) => ({ ...p, phoneNumber: phone }))}
                        />
                    </label>
                    <label className="accountPage__field">
                        <span>Telegram</span>
                        <input
                            value={form.telegramUsername}
                            onChange={(e) => setForm((p) => ({ ...p, telegramUsername: e.target.value }))}
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

                <div className="accountPage__formActions">
                    {onCancel ? (
                        <button
                            type="button"
                            className="accountPage__submit accountPage__submit--secondary"
                            onClick={onCancel}
                            disabled={saving}
                        >
                            К просмотру
                        </button>
                    ) : null}
                    <button type="submit" className="accountPage__submit" disabled={saving}>
                        {saving ? 'Сохранение…' : submitLabel}
                    </button>
                </div>

                {showProfileMeta && profileMeta ? (
                    <StudentProfileMetaFooter
                        profile={profileMeta.profile}
                        portfolioCount={profileMeta.portfolioCount ?? 0}
                        publicProfileConsent={profileMeta.publicProfileConsent}
                        onConsentChange={profileMeta.onConsentChange}
                        consentSaving={profileMeta.consentSaving}
                        consentError={profileMeta.consentError}
                    />
                ) : null}
            </form>
        </>
    );
};

export default StudentProfileEditor;
