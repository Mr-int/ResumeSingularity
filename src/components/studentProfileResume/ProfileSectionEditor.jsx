import { useEffect, useMemo, useState } from 'react';
import { patchStudentMe, uploadStudentPhoto } from '../../services/accountApi.js';
import {
    createExperience,
    createInstitution,
    createPortfolio,
    deleteExperience,
    deleteInstitution,
    deletePortfolio,
    filterSkills,
    getAllSpecialities,
    resolveCompanyId,
    resolveEducationId,
    updateExperience,
    updateInstitution,
    updatePortfolio,
} from '../../services/studentApi.js';
import { packExperienceAdditionalInfo } from '../../utils/experienceWebUrl.js';
import { buildPortfolioPayload, normalizePortfolioItem } from '../../utils/portfolio.js';
import './profileSectionEditor.css';

const JOB_SEARCH_OPTIONS = [
    { value: 'LOOKING', label: 'Ищу работу' },
    { value: 'CONSIDERING', label: 'Рассматриваю предложения' },
    { value: 'NOT_LOOKING', label: 'Не ищу работу' },
];

const BUSYNESS_OPTIONS = [
    { value: 'EMPLOYED', label: 'Фулл-тайм' },
    { value: 'FREELANCE', label: 'Парт-тайм' },
    { value: 'FREE', label: 'Нет занятости' },
    { value: 'PROJECT_WORK', label: 'Проектная работа' },
];

const DESIRED_BUSYNESS_OPTIONS = BUSYNESS_OPTIONS.filter((item) => item.value !== 'FREE');

const SECTION_TITLES = {
    avatar: 'Фото',
    name: 'Имя и фамилия',
    specialty: 'Специальность',
    status: 'Статус и занятость',
    bio: 'Обо мне',
    info: 'Инфо',
    skills: 'Навыки',
    portfolio: 'Портфолио',
    experience: 'Опыт работы',
    education: 'Образование',
};

const ProfileSectionEditor = ({
    section,
    student,
    skills = [],
    experiences = [],
    educations = [],
    portfolios = [],
    /** inline — форма прямо в блоке профиля; drawer — боковая панель */
    layout = 'inline',
    onClose,
    onSaved,
}) => {
    const isInline = layout === 'inline';
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [specialities, setSpecialities] = useState([]);
    const [skillsCatalog, setSkillsCatalog] = useState([]);

    const [firstName, setFirstName] = useState(student.firstName || '');
    const [lastName, setLastName] = useState(student.lastName || '');
    const [middleName, setMiddleName] = useState(student.middleName || '');
    const [specialityId, setSpecialityId] = useState(student.specialityId || '');
    const [bio, setBio] = useState(student.bio || '');
    const [city, setCity] = useState(student.city || '');
    const [birthDate, setBirthDate] = useState(student.birthDate || '');
    const [jobSearchStatus, setJobSearchStatus] = useState(student.jobSearchStatus || '');
    const [desiredBusyness, setDesiredBusyness] = useState(student.desiredBusyness || '');
    const [busyness, setBusyness] = useState(student.busyness || 'FREE');
    const [selectedSkillIds, setSelectedSkillIds] = useState(
        () => (Array.isArray(skills) ? skills : []).map((item) => String(item.id)).filter(Boolean),
    );
    const [avatarFile, setAvatarFile] = useState(null);

    const [portfolioDrafts, setPortfolioDrafts] = useState(() => (
        (Array.isArray(portfolios) ? portfolios : []).map((item) => normalizePortfolioItem(item))
    ));
    const [experienceDrafts, setExperienceDrafts] = useState(() => (
        (Array.isArray(experiences) ? experiences : []).map((item) => ({
            id: item.id,
            companyId: item.companyId || '',
            companyName: item.company || item.companyName || '',
            companyUrl: item.webUrl || item.companyUrl || '',
            position: item.position || '',
            startDate: item.startDate || '',
            endDate: item.current || item.endDate === 'по настоящее время' ? '' : (item.endDate || ''),
            additionalInfo: item.description || item.additionalInfo || '',
            experienceType: item.experienceType === 'PROJECT' || item.activityKind === 'project'
                ? 'PROJECT'
                : 'WORK',
        }))
    ));
    const [educationDrafts, setEducationDrafts] = useState(() => (
        (Array.isArray(educations) ? educations : []).map((item) => ({
            // id — запись /institution; educationId — справочник /education (не путать)
            id: item.id != null && Number(item.id) > 0 ? item.id : null,
            educationId: item.educationId != null && Number(item.educationId) > 0
                ? item.educationId
                : '',
            institutionName: item.name || item.institution || item.institutionName || '',
            direction: item.direction || item.speciality || '',
            educationLevel: item.educationLevel || '',
            startYear: item.startYear || item.startDate || '',
            endYear: item.endYear || item.endDate || '',
            educationType: item.educationType === 'COURSE' ? 'COURSE' : 'STATE',
            webUrl: item.webUrl || '',
        }))
    ));

    useEffect(() => {
        let cancelled = false;
        const loadCatalogs = async () => {
            if (section === 'specialty') {
                const list = await getAllSpecialities();
                if (!cancelled) setSpecialities(Array.isArray(list) ? list : []);
            }
            if (section === 'skills') {
                try {
                    const page = await filterSkills({}, { page: 0, size: 300 });
                    if (!cancelled) setSkillsCatalog(Array.isArray(page?.data) ? page.data : []);
                } catch {
                    if (!cancelled) setSkillsCatalog([]);
                }
            }
        };
        loadCatalogs();
        return () => {
            cancelled = true;
        };
    }, [section]);

    const title = SECTION_TITLES[section] || 'Редактирование';

    const skillOptions = useMemo(() => {
        const map = new Map();
        [...skillsCatalog, ...skills].forEach((skill) => {
            if (skill?.id == null) return;
            map.set(String(skill.id), skill);
        });
        return [...map.values()];
    }, [skills, skillsCatalog]);

    const toggleSkill = (id) => {
        const key = String(id);
        setSelectedSkillIds((prev) => (
            prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
        ));
    };

    const save = async () => {
        setSaving(true);
        setError('');
        try {
            const studentId = student.id;
            if (section === 'avatar') {
                if (!avatarFile) throw new Error('Выберите файл');
                await uploadStudentPhoto(studentId, avatarFile);
            }

            if (section === 'name') {
                await patchStudentMe({
                    firstName: firstName.trim() || null,
                    lastName: lastName.trim() || null,
                    middleName: middleName.trim() || null,
                });
            }

            if (section === 'specialty') {
                if (!specialityId) throw new Error('Выберите специальность');
                await patchStudentMe({ specialityId: Number(specialityId) });
            }

            if (section === 'bio') {
                await patchStudentMe({ bio: bio.trim() });
            }

            if (section === 'info') {
                await patchStudentMe({
                    city: city.trim() || null,
                    birthDate: birthDate || null,
                });
            }

            if (section === 'status') {
                await patchStudentMe({
                    jobSearchStatus: jobSearchStatus || null,
                    desiredBusyness: desiredBusyness || null,
                    busyness: busyness || null,
                });
            }

            if (section === 'skills') {
                await patchStudentMe({
                    skillsIds: selectedSkillIds.map((id) => Number(id)).filter((id) => id > 0),
                });
            }

            if (section === 'portfolio') {
                const existingIds = new Set(
                    (Array.isArray(portfolios) ? portfolios : [])
                        .map((item) => item?.id)
                        .filter((id) => id != null)
                        .map(String),
                );
                const keptIds = new Set();

                for (const draft of portfolioDrafts) {
                    const built = buildPortfolioPayload({ ...draft, studentId });
                    if (built.empty) continue;
                    if (built.error) throw new Error(built.error);
                    if (draft.id != null) {
                        await updatePortfolio(draft.id, built.body);
                        keptIds.add(String(draft.id));
                    } else {
                        await createPortfolio(built.body);
                    }
                }

                for (const id of existingIds) {
                    if (!keptIds.has(id)) await deletePortfolio(id);
                }
            }

            if (section === 'experience') {
                const existingIds = new Set(
                    (Array.isArray(experiences) ? experiences : [])
                        .map((item) => item?.id)
                        .filter((id) => id != null)
                        .map(String),
                );
                const keptIds = new Set();

                for (const draft of experienceDrafts) {
                    const companyName = draft.companyName?.trim() || '';
                    const position = draft.position?.trim() || '';
                    if (!companyName || !position || !draft.startDate) {
                        throw new Error('Заполните название, роль и дату начала у каждой записи');
                    }
                    const companyId = await resolveCompanyId(companyName, draft.companyId);
                    const body = {
                        studentId,
                        companyId,
                        position,
                        startDate: draft.startDate,
                        experienceType: draft.experienceType === 'PROJECT' ? 'PROJECT' : 'WORK',
                        additionalInfo: packExperienceAdditionalInfo(
                            draft.additionalInfo || '',
                            draft.companyUrl || '',
                        ),
                    };
                    if (draft.endDate) body.endDate = draft.endDate;

                    if (draft.id != null) {
                        await updateExperience(draft.id, body);
                        keptIds.add(String(draft.id));
                    } else {
                        await createExperience(body);
                    }
                }

                for (const id of existingIds) {
                    if (!keptIds.has(id)) await deleteExperience(id);
                }
            }

            if (section === 'education') {
                const existingIds = new Set(
                    (Array.isArray(educations) ? educations : [])
                        .map((item) => item?.id)
                        .filter((id) => id != null)
                        .map(String),
                );
                const keptIds = new Set();

                for (const draft of educationDrafts) {
                    const institutionName = draft.institutionName?.trim() || '';
                    if (!institutionName || !draft.startYear || !draft.endYear) {
                        throw new Error('Заполните учебное заведение и годы');
                    }
                    const educationId = await resolveEducationId(
                        institutionName,
                        draft.educationId,
                        [],
                        {
                            webUrl: draft.webUrl,
                            additionalInfo: draft.educationLevel || draft.direction || institutionName,
                        },
                    );
                    const body = {
                        studentId,
                        educationId,
                        startYear: Number(draft.startYear),
                        endYear: Number(draft.endYear),
                        educationType: draft.educationType === 'COURSE' ? 'COURSE' : 'STATE',
                        direction: (draft.direction || '').trim() || undefined,
                        educationLevel: (draft.educationLevel || '').trim() || undefined,
                    };

                    if (draft.id != null && Number(draft.id) > 0) {
                        await updateInstitution(draft.id, body);
                        keptIds.add(String(draft.id));
                    } else {
                        await createInstitution(body);
                    }
                }

                for (const id of existingIds) {
                    if (!keptIds.has(id)) await deleteInstitution(id);
                }
            }

            await onSaved?.();
            onClose?.();
        } catch (err) {
            setError(err?.message || 'Не удалось сохранить');
        } finally {
            setSaving(false);
        }
    };

    const patchExperience = (index, patch) => {
        setExperienceDrafts((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    };
    const patchEducation = (index, patch) => {
        setEducationDrafts((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    };
    const patchPortfolio = (index, patch) => {
        setPortfolioDrafts((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    };

    const inlineActions = (
        <div className="sprInlineActions">
            <button type="button" className="sprInlineBtn sprInlineBtn--ghost" onClick={onClose} disabled={saving}>
                Отмена
            </button>
            <button type="button" className="sprInlineBtn sprInlineBtn--save" onClick={save} disabled={saving}>
                {saving ? 'Сохранение…' : 'Сохранить'}
            </button>
        </div>
    );

    const drawerBody = (
        <>
            {section === 'avatar' ? (
                <label className="profileSectionEditor__field">
                    <span>Новое фото</span>
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => setAvatarFile(event.target.files?.[0] || null)}
                    />
                </label>
            ) : null}

            {section === 'name' ? (
                <>
                    <label className="profileSectionEditor__field">
                        <span>Имя</span>
                        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </label>
                    <label className="profileSectionEditor__field">
                        <span>Фамилия</span>
                        <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </label>
                    <label className="profileSectionEditor__field">
                        <span>Отчество</span>
                        <input value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
                    </label>
                </>
            ) : null}

            {section === 'specialty' ? (
                <label className="profileSectionEditor__field">
                    <span>Специальность</span>
                    <select value={specialityId || ''} onChange={(e) => setSpecialityId(e.target.value)}>
                        <option value="">Выберите</option>
                        {specialities.map((item) => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                    </select>
                </label>
            ) : null}

            {section === 'bio' ? (
                <label className="profileSectionEditor__field">
                    <span>Текст</span>
                    <textarea rows={8} maxLength={2000} value={bio} onChange={(e) => setBio(e.target.value)} />
                </label>
            ) : null}

            {section === 'info' ? (
                <>
                    <label className="profileSectionEditor__field">
                        <span>Город</span>
                        <input value={city} onChange={(e) => setCity(e.target.value)} />
                    </label>
                    <label className="profileSectionEditor__field">
                        <span>Дата рождения</span>
                        <input type="date" value={birthDate || ''} onChange={(e) => setBirthDate(e.target.value)} />
                    </label>
                </>
            ) : null}

            {section === 'status' ? (
                <>
                    <label className="profileSectionEditor__field">
                        <span>Статус поиска</span>
                        <select value={jobSearchStatus || ''} onChange={(e) => setJobSearchStatus(e.target.value)}>
                            <option value="">Не указан</option>
                            {JOB_SEARCH_OPTIONS.map((item) => (
                                <option key={item.value} value={item.value}>{item.label}</option>
                            ))}
                        </select>
                    </label>
                    <label className="profileSectionEditor__field">
                        <span>Желаемый формат</span>
                        <select value={desiredBusyness || ''} onChange={(e) => setDesiredBusyness(e.target.value)}>
                            <option value="">Не указан</option>
                            {DESIRED_BUSYNESS_OPTIONS.map((item) => (
                                <option key={item.value} value={item.value}>{item.label}</option>
                            ))}
                        </select>
                    </label>
                    <label className="profileSectionEditor__field">
                        <span>Имеется занятость</span>
                        <select value={busyness || ''} onChange={(e) => setBusyness(e.target.value)}>
                            {BUSYNESS_OPTIONS.map((item) => (
                                <option key={item.value} value={item.value}>{item.label}</option>
                            ))}
                        </select>
                    </label>
                </>
            ) : null}

            {section === 'skills' ? (
                <div className="profileSectionEditor__skills">
                    {skillOptions.map((skill) => {
                        const id = String(skill.id);
                        const active = selectedSkillIds.includes(id);
                        return (
                            <button
                                key={id}
                                type="button"
                                className={`profileSectionEditor__skill${active ? ' is-active' : ''}`}
                                onClick={() => toggleSkill(id)}
                            >
                                {skill.name}
                            </button>
                        );
                    })}
                </div>
            ) : null}

            {section === 'portfolio' || section === 'experience' || section === 'education' ? (
                <p className="profileSectionEditor__error">Используйте inline-редактирование в профиле</p>
            ) : null}

            {error ? <p className="profileSectionEditor__error">{error}</p> : null}
        </>
    );

    const inlineBody = (
        <>
            {section === 'avatar' ? (
                <label className="sprInlineFile">
                    <span>Выбрать новое фото</span>
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => setAvatarFile(event.target.files?.[0] || null)}
                    />
                </label>
            ) : null}

            {section === 'name' ? (
                <h1 className="studentProfileResume__name sprInlineName">
                    <input
                        className="sprInlineField"
                        value={firstName}
                        placeholder="Имя"
                        aria-label="Имя"
                        onChange={(e) => setFirstName(e.target.value)}
                    />
                    <input
                        className="sprInlineField"
                        value={lastName}
                        placeholder="Фамилия"
                        aria-label="Фамилия"
                        onChange={(e) => setLastName(e.target.value)}
                    />
                    <input
                        className="sprInlineField sprInlineField--muted"
                        value={middleName}
                        placeholder="Отчество"
                        aria-label="Отчество"
                        onChange={(e) => setMiddleName(e.target.value)}
                    />
                </h1>
            ) : null}

            {section === 'specialty' ? (
                <select
                    className="sprInlineField studentProfileResume__specialty"
                    value={specialityId || ''}
                    aria-label="Специальность"
                    onChange={(e) => setSpecialityId(e.target.value)}
                >
                    <option value="">Выберите специальность</option>
                    {specialities.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                </select>
            ) : null}

            {section === 'bio' ? (
                <textarea
                    className="sprInlineField studentProfileResume__bioText"
                    rows={6}
                    maxLength={2000}
                    value={bio}
                    aria-label="Обо мне"
                    onChange={(e) => setBio(e.target.value)}
                />
            ) : null}

            {section === 'info' ? (
                <div className="studentProfileResume__infoText">
                    <input
                        className="sprInlineField"
                        type="date"
                        value={birthDate || ''}
                        aria-label="Дата рождения"
                        onChange={(e) => setBirthDate(e.target.value)}
                    />
                    <input
                        className="sprInlineField"
                        value={city}
                        placeholder="Город"
                        aria-label="Город"
                        onChange={(e) => setCity(e.target.value)}
                    />
                </div>
            ) : null}

            {section === 'skills' ? (
                <ul className="studentProfileResume__skills">
                    {skillOptions.map((skill) => {
                        const id = String(skill.id);
                        const active = selectedSkillIds.includes(id);
                        return (
                            <li key={id}>
                                <button
                                    type="button"
                                    className={`studentProfileResume__tag${active ? '' : ' studentProfileResume__tag--more'}`}
                                    onClick={() => toggleSkill(id)}
                                >
                                    {skill.name}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            ) : null}

            {section === 'portfolio' ? (
                <div className="studentProfileResume__portfolioFolders">
                    {portfolioDrafts.map((draft, index) => (
                        <article key={draft.id ?? `new-${index}`} className="studentProfileResume__portfolioFolder sprInlinePortfolioCard">
                            <div className="studentProfileResume__portfolioFolderCopy sprInlinePortfolioCopy">
                                <input
                                    className="sprInlineField studentProfileResume__portfolioFolderName"
                                    placeholder="Название"
                                    value={draft.name}
                                    onChange={(e) => patchPortfolio(index, { name: e.target.value })}
                                />
                                <input
                                    className="sprInlineField studentProfileResume__portfolioFolderDesc"
                                    placeholder="Описание"
                                    value={draft.description}
                                    onChange={(e) => patchPortfolio(index, { description: e.target.value })}
                                />
                                <input
                                    className="sprInlineField sprInlineField--link"
                                    placeholder="Ссылка"
                                    value={draft.link}
                                    onChange={(e) => patchPortfolio(index, { link: e.target.value })}
                                />
                                <button
                                    type="button"
                                    className="sprInlineRemove"
                                    onClick={() => setPortfolioDrafts((prev) => prev.filter((_, i) => i !== index))}
                                >
                                    Удалить
                                </button>
                            </div>
                        </article>
                    ))}
                    <button
                        type="button"
                        className="sprInlineAdd"
                        onClick={() => setPortfolioDrafts((prev) => [...prev, { id: null, name: '', description: '', link: '' }])}
                    >
                        + Добавить
                    </button>
                </div>
            ) : null}

            {section === 'experience' ? (
                <div className="studentProfileResume__experienceGrid">
                    {experienceDrafts.map((draft, index) => {
                        const isProject = draft.experienceType === 'PROJECT';
                        return (
                            <article
                                key={draft.id ?? `new-${index}`}
                                className={
                                    'studentProfileResume__experienceCard'
                                    + (isProject
                                        ? ' studentProfileResume__experienceCard--project'
                                        : ' studentProfileResume__experienceCard--work')
                                }
                            >
                                <div className="studentProfileResume__experienceMeta">
                                    <input
                                        className="sprInlineField studentProfileResume__experienceCompany"
                                        placeholder={isProject ? 'Название проекта' : 'Организация'}
                                        value={draft.companyName}
                                        onChange={(e) => patchExperience(index, { companyName: e.target.value })}
                                    />
                                    <div className="sprInlineDates">
                                        <input
                                            className="sprInlineField studentProfileResume__experiencePeriod"
                                            type="date"
                                            value={draft.startDate || ''}
                                            aria-label="Начало"
                                            onChange={(e) => patchExperience(index, { startDate: e.target.value })}
                                        />
                                        <input
                                            className="sprInlineField studentProfileResume__experiencePeriod"
                                            type="date"
                                            value={draft.endDate || ''}
                                            aria-label="Окончание"
                                            onChange={(e) => patchExperience(index, { endDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <input
                                    className="sprInlineField studentProfileResume__experiencePosition"
                                    placeholder="Роль / должность"
                                    value={draft.position}
                                    onChange={(e) => patchExperience(index, { position: e.target.value })}
                                />
                                <textarea
                                    className="sprInlineField studentProfileResume__experienceDescription"
                                    rows={3}
                                    placeholder="Описание"
                                    value={draft.additionalInfo}
                                    onChange={(e) => patchExperience(index, { additionalInfo: e.target.value })}
                                />
                                <input
                                    className="sprInlineField studentProfileResume__experienceLink"
                                    placeholder="Ссылка"
                                    value={draft.companyUrl}
                                    onChange={(e) => patchExperience(index, { companyUrl: e.target.value })}
                                />
                                <div className="sprInlineCardFoot">
                                    <select
                                        className="studentProfileResume__experienceTag sprInlineTagSelect"
                                        value={draft.experienceType}
                                        onChange={(e) => patchExperience(index, { experienceType: e.target.value })}
                                    >
                                        <option value="WORK">Опыт работы</option>
                                        <option value="PROJECT">Проект</option>
                                    </select>
                                    <button
                                        type="button"
                                        className="sprInlineRemove"
                                        onClick={() => setExperienceDrafts((prev) => prev.filter((_, i) => i !== index))}
                                    >
                                        Удалить
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                    <button
                        type="button"
                        className="sprInlineAdd"
                        onClick={() => setExperienceDrafts((prev) => [...prev, {
                            id: null,
                            companyId: '',
                            companyName: '',
                            companyUrl: '',
                            position: '',
                            startDate: '',
                            endDate: '',
                            additionalInfo: '',
                            experienceType: 'WORK',
                        }])}
                    >
                        + Добавить
                    </button>
                </div>
            ) : null}

            {section === 'education' ? (
                <div className="studentProfileResume__educationGrid">
                    {educationDrafts.map((draft, index) => {
                        const isCourse = draft.educationType === 'COURSE';
                        const tone = isCourse ? 'green' : 'blue';
                        return (
                            <article
                                key={draft.id ?? `new-${index}`}
                                className={`studentProfileResume__educationCard studentProfileResume__educationCard--${tone}`}
                            >
                                <input
                                    className="sprInlineField sprInlineField--title"
                                    placeholder={isCourse ? 'Платформа / курс' : 'Учебное заведение'}
                                    value={draft.institutionName}
                                    onChange={(e) => patchEducation(index, { institutionName: e.target.value })}
                                />
                                <div className="sprInlineDates">
                                    <input
                                        className="sprInlineField studentProfileResume__educationDate"
                                        type="number"
                                        placeholder="Начало"
                                        value={draft.startYear}
                                        onChange={(e) => patchEducation(index, { startYear: e.target.value })}
                                    />
                                    <span className="studentProfileResume__educationDate">–</span>
                                    <input
                                        className="sprInlineField studentProfileResume__educationDate"
                                        type="number"
                                        placeholder="Окончание"
                                        value={draft.endYear}
                                        onChange={(e) => patchEducation(index, { endYear: e.target.value })}
                                    />
                                </div>
                                <input
                                    className="sprInlineField studentProfileResume__educationRole"
                                    placeholder="Направление"
                                    value={draft.direction}
                                    onChange={(e) => patchEducation(index, { direction: e.target.value })}
                                />
                                <input
                                    className="sprInlineField sprInlineField--link"
                                    placeholder="Уровень образования"
                                    value={draft.educationLevel}
                                    onChange={(e) => patchEducation(index, { educationLevel: e.target.value })}
                                />
                                <div className="sprInlineCardFoot">
                                    <select
                                        className="studentProfileResume__educationTag sprInlineTagSelect"
                                        value={draft.educationType}
                                        onChange={(e) => patchEducation(index, { educationType: e.target.value })}
                                    >
                                        <option value="STATE">Гос. образование</option>
                                        <option value="COURSE">Онлайн-курс</option>
                                    </select>
                                    <button
                                        type="button"
                                        className="sprInlineRemove"
                                        onClick={() => setEducationDrafts((prev) => prev.filter((_, i) => i !== index))}
                                    >
                                        Удалить
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                    <button
                        type="button"
                        className="sprInlineAdd"
                        onClick={() => setEducationDrafts((prev) => [...prev, {
                            id: null,
                            educationId: '',
                            institutionName: '',
                            direction: '',
                            educationLevel: '',
                            startYear: '',
                            endYear: '',
                            educationType: 'STATE',
                            webUrl: '',
                        }])}
                    >
                        + Добавить
                    </button>
                </div>
            ) : null}

            {error ? <p className="profileSectionEditor__error">{error}</p> : null}
        </>
    );

    if (isInline) {
        const isLongSection = section === 'experience'
            || section === 'education'
            || section === 'portfolio'
            || section === 'skills';
        return (
            <div
                className={`profileSectionEditor profileSectionEditor--inline profileSectionEditor--${section}`}
                role="group"
                aria-label={title}
            >
                {inlineActions}
                {inlineBody}
                {isLongSection ? inlineActions : null}
            </div>
        );
    }

    return (
        <div className="profileSectionEditor" role="dialog" aria-modal="true" aria-label={title}>
            <div className="profileSectionEditor__backdrop" onClick={onClose} />
            <div className="profileSectionEditor__panel">
                <header className="profileSectionEditor__head">
                    <h3>{title}</h3>
                    <button type="button" className="profileSectionEditor__close" onClick={onClose}>
                        Закрыть
                    </button>
                </header>
                <div className="profileSectionEditor__body">
                    {drawerBody}
                </div>
                <footer className="profileSectionEditor__foot">
                    <button type="button" className="profileSectionEditor__cancel" onClick={onClose} disabled={saving}>
                        Отмена
                    </button>
                    <button type="button" className="profileSectionEditor__save" onClick={save} disabled={saving}>
                        {saving ? 'Сохранение…' : 'Сохранить'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ProfileSectionEditor;
