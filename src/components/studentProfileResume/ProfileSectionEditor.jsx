import { useEffect, useMemo, useRef, useState } from 'react';
import { patchStudentMe, uploadStudentPhoto } from '../../services/accountApi.js';
import {
    createExperience,
    createInstitution,
    createPortfolio,
    deleteExperience,
    deleteInstitution,
    deletePortfolio,
    getAllSkills,
    getAllSpecialities,
    resolveCompanyId,
    resolveEducationId,
    updateExperience,
    updateInstitution,
    updatePortfolio,
} from '../../services/studentApi.js';
import { packExperienceAdditionalInfo } from '../../utils/experienceWebUrl.js';
import { buildPortfolioPayload, normalizePortfolioItem } from '../../utils/portfolio.js';
import {
    BUSYNESS_OPTIONS,
    DESIRED_BUSYNESS_OPTIONS,
    JOB_SEARCH_OPTIONS,
    toBusynessApiValue,
    toBusynessFormValue,
} from '../../utils/studentStatus.js';
import calendarIcon from '../../assets/icons/calendar.svg';
import arrowIcon from '../../assets/icons/arrow_small.svg';
import statusLookingIcon from '../../assets/icons/status-looking.svg';
import statusConsideringIcon from '../../assets/icons/status-considering.svg';
import statusNotLookingIcon from '../../assets/icons/status-not-looking.svg';
import busynessFulltimeIcon from '../../assets/icons/busyness-fulltime.svg';
import busynessParttimeIcon from '../../assets/icons/busyness-parttime.svg';
import busynessProjectIcon from '../../assets/icons/busyness-project.svg';
import './profileSectionEditor.css';

const BUSYNESS_ICONS = {
    fulltime: busynessFulltimeIcon,
    parttime: busynessParttimeIcon,
    project: busynessProjectIcon,
};

const JOB_SEARCH_ICONS = {
    looking: statusLookingIcon,
    considering: statusConsideringIcon,
    notLooking: statusNotLookingIcon,
};

const InlineField = ({ label, children, className = '' }) => (
    <label className={`sprField${className ? ` ${className}` : ''}`}>
        {label ? <span className="sprField__label">{label}</span> : null}
        {children}
    </label>
);

const InlineSelect = ({ label, value, onChange, children, className = '' }) => (
    <label className={`sprField sprField--select${className ? ` ${className}` : ''}`}>
        {label ? <span className="sprField__label">{label}</span> : null}
        <span className="sprField__control">
            <select value={value} onChange={onChange}>
                {children}
            </select>
            <img src={arrowIcon} alt="" className="sprField__chevron" aria-hidden="true" />
        </span>
    </label>
);

const InlineDate = ({ label, value, onChange, ariaLabel }) => (
    <label className="sprField sprField--date">
        {label ? <span className="sprField__label">{label}</span> : null}
        <span className="sprField__control">
            <input
                type="date"
                value={value || ''}
                aria-label={ariaLabel || label}
                onChange={onChange}
            />
            <img src={calendarIcon} alt="" className="sprField__calendar" aria-hidden="true" />
        </span>
    </label>
);

const InlineFilePicker = ({ label = 'Выбрать файл', accept, fileName, onChange }) => {
    const inputRef = useRef(null);
    return (
        <div className="sprFilePicker">
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="sprFilePicker__input"
                onChange={onChange}
            />
            <button
                type="button"
                className="sprFilePicker__btn"
                onClick={() => inputRef.current?.click()}
            >
                <span className="sprFilePicker__icon" aria-hidden="true">＋</span>
                <span className="sprFilePicker__text">{label}</span>
            </button>
            {fileName ? <p className="sprFilePicker__name">{fileName}</p> : null}
        </div>
    );
};

const StatusChoiceGroup = ({ label, options, value, onChange, allowEmpty = false, emptyLabel = 'Не указан' }) => (
    <div className="sprStatusChoices">
        <span className="sprStatusChoices__label">{label}</span>
        <div className="sprStatusChoices__list" role="radiogroup" aria-label={label}>
            {allowEmpty ? (
                <button
                    type="button"
                    role="radio"
                    aria-checked={!value}
                    className={`sprStatusChoice${!value ? ' is-active' : ''}`}
                    onClick={() => onChange('')}
                >
                    <span>{emptyLabel}</span>
                </button>
            ) : null}
            {options.map((item) => {
                const active = String(value) === String(item.value);
                const busynessIcon = item.icon ? BUSYNESS_ICONS[item.icon] : null;
                const searchIcon = item.icon ? JOB_SEARCH_ICONS[item.icon] : null;
                return (
                    <button
                        key={item.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        title={item.hint || item.label}
                        className={
                            'sprStatusChoice'
                            + (active ? ' is-active' : '')
                            + (item.tone ? ` sprStatusChoice--${item.tone}` : '')
                        }
                        onClick={() => onChange(item.value)}
                    >
                        <span>{item.label}</span>
                        {searchIcon ? (
                            <img src={searchIcon} alt="" width={16} height={16} />
                        ) : null}
                        {busynessIcon ? (
                            <img src={busynessIcon} alt="" width={30} height={24} />
                        ) : null}
                    </button>
                );
            })}
        </div>
    </div>
);

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
    const [skillsLoading, setSkillsLoading] = useState(false);
    const [skillsQuery, setSkillsQuery] = useState('');

    const [firstName, setFirstName] = useState(student.firstName || '');
    const [lastName, setLastName] = useState(student.lastName || '');
    const [middleName, setMiddleName] = useState(student.middleName || '');
    const [specialityId, setSpecialityId] = useState(student.specialityId || '');
    const [bio, setBio] = useState(student.bio || '');
    const [city, setCity] = useState(student.city || '');
    const [birthDate, setBirthDate] = useState(student.birthDate || '');
    const [jobSearchStatus, setJobSearchStatus] = useState(student.jobSearchStatus || '');
    const [desiredBusyness, setDesiredBusyness] = useState(
        () => toBusynessFormValue(student.desiredBusyness),
    );
    const [busyness, setBusyness] = useState(
        () => toBusynessFormValue(student.busyness),
    );
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
                if (!cancelled) setSkillsLoading(true);
                try {
                    const list = await getAllSkills();
                    if (!cancelled) setSkillsCatalog(Array.isArray(list) ? list : []);
                } catch {
                    if (!cancelled) setSkillsCatalog([]);
                } finally {
                    if (!cancelled) setSkillsLoading(false);
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
        return [...map.values()].sort((a, b) =>
            String(a.name || '').localeCompare(String(b.name || ''), 'ru'),
        );
    }, [skills, skillsCatalog]);

    const filteredSkillOptions = useMemo(() => {
        const q = skillsQuery.trim().toLowerCase();
        if (!q) return skillOptions;
        return skillOptions.filter((skill) =>
            String(skill.name || '').toLowerCase().includes(q),
        );
    }, [skillOptions, skillsQuery]);

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
                    desiredBusyness: toBusynessApiValue(desiredBusyness),
                    busyness: toBusynessApiValue(busyness),
                });
            }

            if (section === 'skills') {
                const ids = selectedSkillIds
                    .map((id) => Number(id))
                    .filter((id) => Number.isFinite(id) && id > 0);
                await patchStudentMe({
                    skillsIds: ids,
                    skillIds: ids,
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
                <div className="sprEditSheet__stack">
                    <StatusChoiceGroup
                        label="Статус поиска"
                        options={JOB_SEARCH_OPTIONS}
                        value={jobSearchStatus || ''}
                        onChange={setJobSearchStatus}
                        allowEmpty
                    />
                    <StatusChoiceGroup
                        label="Желаемый формат"
                        options={DESIRED_BUSYNESS_OPTIONS}
                        value={desiredBusyness || ''}
                        onChange={setDesiredBusyness}
                        allowEmpty
                        emptyLabel="Не указан"
                    />
                    <StatusChoiceGroup
                        label="Имеется занятость"
                        options={BUSYNESS_OPTIONS}
                        value={busyness || ''}
                        onChange={setBusyness}
                        allowEmpty
                        emptyLabel="Не указана"
                    />
                </div>
            ) : null}

            {section === 'skills' ? (
                <div className="profileSectionEditor__skills">
                    {(filteredSkillOptions.length ? filteredSkillOptions : skillOptions).map((skill) => {
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
        <div className="sprEditSheet">
            {section === 'avatar' ? (
                <InlineFilePicker
                    label="Добавить фото"
                    accept="image/jpeg,image/png,image/webp"
                    fileName={avatarFile?.name || ''}
                    onChange={(event) => setAvatarFile(event.target.files?.[0] || null)}
                />
            ) : null}

            {section === 'name' ? (
                <div className="sprEditSheet__stack">
                    <InlineField label="Имя">
                        <input value={firstName} placeholder="Имя" onChange={(e) => setFirstName(e.target.value)} />
                    </InlineField>
                    <InlineField label="Фамилия">
                        <input value={lastName} placeholder="Фамилия" onChange={(e) => setLastName(e.target.value)} />
                    </InlineField>
                    <InlineField label="Отчество">
                        <input value={middleName} placeholder="Необязательно" onChange={(e) => setMiddleName(e.target.value)} />
                    </InlineField>
                </div>
            ) : null}

            {section === 'specialty' ? (
                <InlineSelect
                    label="Специальность"
                    value={specialityId || ''}
                    onChange={(e) => setSpecialityId(e.target.value)}
                >
                    <option value="">Выберите специальность</option>
                    {specialities.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                </InlineSelect>
            ) : null}

            {section === 'bio' ? (
                <InlineField label="О себе" className="sprField--area">
                    <textarea
                        rows={6}
                        maxLength={2000}
                        value={bio}
                        placeholder="Расскажите о себе"
                        onChange={(e) => setBio(e.target.value)}
                    />
                    <span className="sprField__hint">{bio.length}/2000</span>
                </InlineField>
            ) : null}

            {section === 'info' ? (
                <div className="sprEditSheet__stack">
                    <InlineDate
                        label="Дата рождения"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                    />
                    <InlineField label="Город">
                        <input value={city} placeholder="Город" onChange={(e) => setCity(e.target.value)} />
                    </InlineField>
                </div>
            ) : null}

            {section === 'status' ? (
                <div className="sprEditSheet__stack">
                    <StatusChoiceGroup
                        label="Статус поиска"
                        options={JOB_SEARCH_OPTIONS}
                        value={jobSearchStatus || ''}
                        onChange={setJobSearchStatus}
                        allowEmpty
                    />
                    <StatusChoiceGroup
                        label="Желаемый формат"
                        options={DESIRED_BUSYNESS_OPTIONS}
                        value={desiredBusyness || ''}
                        onChange={setDesiredBusyness}
                        allowEmpty
                        emptyLabel="Не указан"
                    />
                    <StatusChoiceGroup
                        label="Имеется занятость"
                        options={BUSYNESS_OPTIONS}
                        value={busyness || ''}
                        onChange={setBusyness}
                        allowEmpty
                        emptyLabel="Не указана"
                    />
                </div>
            ) : null}

            {section === 'skills' ? (
                <div className="sprEditSheet__stack">
                    <InlineField label="Поиск">
                        <input
                            type="search"
                            value={skillsQuery}
                            placeholder="Найти навык"
                            autoComplete="off"
                            onChange={(e) => setSkillsQuery(e.target.value)}
                        />
                    </InlineField>
                    {skillsLoading ? (
                        <p className="sprEditSheet__hint">Загрузка каталога навыков…</p>
                    ) : null}
                    {!skillsLoading && skillOptions.length <= (Array.isArray(skills) ? skills.length : 0) ? (
                        <p className="sprEditSheet__hint">
                            Каталог навыков пуст или не загрузился — доступны только уже выбранные.
                        </p>
                    ) : null}
                    <div className="sprEditSheet__skills">
                        {filteredSkillOptions.map((skill) => {
                            const id = String(skill.id);
                            const active = selectedSkillIds.includes(id);
                            return (
                                <button
                                    key={id}
                                    type="button"
                                    className={`sprSkillChip${active ? ' is-active' : ''}`}
                                    onClick={() => toggleSkill(id)}
                                >
                                    {skill.name}
                                </button>
                            );
                        })}
                    </div>
                    {!skillsLoading && filteredSkillOptions.length === 0 ? (
                        <p className="sprEditSheet__hint">Ничего не найдено</p>
                    ) : null}
                </div>
            ) : null}

            {section === 'portfolio' ? (
                <div className="sprEditSheet__list">
                    {portfolioDrafts.map((draft, index) => (
                        <article key={draft.id ?? `new-${index}`} className="sprEditCard">
                            <InlineField label="Название">
                                <input
                                    value={draft.name}
                                    placeholder="Название проекта"
                                    onChange={(e) => patchPortfolio(index, { name: e.target.value })}
                                />
                            </InlineField>
                            <InlineField label="Описание">
                                <input
                                    value={draft.description}
                                    placeholder="Краткое описание"
                                    onChange={(e) => patchPortfolio(index, { description: e.target.value })}
                                />
                            </InlineField>
                            <InlineField label="Ссылка">
                                <input
                                    value={draft.link}
                                    placeholder="https://"
                                    onChange={(e) => patchPortfolio(index, { link: e.target.value })}
                                />
                            </InlineField>
                            <button
                                type="button"
                                className="sprInlineRemove"
                                onClick={() => setPortfolioDrafts((prev) => prev.filter((_, i) => i !== index))}
                            >
                                Удалить
                            </button>
                        </article>
                    ))}
                    <button
                        type="button"
                        className="sprInlineAdd"
                        onClick={() => setPortfolioDrafts((prev) => [...prev, { id: null, name: '', description: '', link: '' }])}
                    >
                        <span aria-hidden="true">＋</span>
                        Добавить ссылку
                    </button>
                </div>
            ) : null}

            {section === 'experience' ? (
                <div className="sprEditSheet__list sprEditSheet__list--grid">
                    {experienceDrafts.map((draft, index) => {
                        const isProject = draft.experienceType === 'PROJECT';
                        return (
                            <article
                                key={draft.id ?? `new-${index}`}
                                className={
                                    'sprEditCard sprEditCard--experience'
                                    + (isProject ? ' sprEditCard--project' : ' sprEditCard--work')
                                }
                            >
                                <InlineSelect
                                    label="Тип"
                                    value={draft.experienceType}
                                    onChange={(e) => patchExperience(index, { experienceType: e.target.value })}
                                >
                                    <option value="WORK">Опыт работы</option>
                                    <option value="PROJECT">Проект</option>
                                </InlineSelect>
                                <InlineField label={isProject ? 'Проект' : 'Организация'}>
                                    <input
                                        value={draft.companyName}
                                        placeholder={isProject ? 'Название проекта' : 'Компания'}
                                        onChange={(e) => patchExperience(index, { companyName: e.target.value })}
                                    />
                                </InlineField>
                                <InlineField label="Роль">
                                    <input
                                        value={draft.position}
                                        placeholder="Должность / роль"
                                        onChange={(e) => patchExperience(index, { position: e.target.value })}
                                    />
                                </InlineField>
                                <div className="sprEditSheet__row">
                                    <InlineDate
                                        label="Начало"
                                        value={draft.startDate}
                                        onChange={(e) => patchExperience(index, { startDate: e.target.value })}
                                    />
                                    <InlineDate
                                        label="Окончание"
                                        value={draft.endDate}
                                        onChange={(e) => patchExperience(index, { endDate: e.target.value })}
                                    />
                                </div>
                                <InlineField label="Описание" className="sprField--area">
                                    <textarea
                                        rows={3}
                                        value={draft.additionalInfo}
                                        placeholder="Что делали"
                                        onChange={(e) => patchExperience(index, { additionalInfo: e.target.value })}
                                    />
                                </InlineField>
                                <InlineField label="Ссылка">
                                    <input
                                        value={draft.companyUrl}
                                        placeholder="https://"
                                        onChange={(e) => patchExperience(index, { companyUrl: e.target.value })}
                                    />
                                </InlineField>
                                <button
                                    type="button"
                                    className="sprInlineRemove"
                                    onClick={() => setExperienceDrafts((prev) => prev.filter((_, i) => i !== index))}
                                >
                                    Удалить
                                </button>
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
                        <span aria-hidden="true">＋</span>
                        Добавить запись
                    </button>
                </div>
            ) : null}

            {section === 'education' ? (
                <div className="sprEditSheet__list sprEditSheet__list--grid">
                    {educationDrafts.map((draft, index) => {
                        const isCourse = draft.educationType === 'COURSE';
                        return (
                            <article
                                key={draft.id ?? `new-${index}`}
                                className={
                                    'sprEditCard sprEditCard--education'
                                    + (isCourse ? ' sprEditCard--course' : ' sprEditCard--state')
                                }
                            >
                                <InlineSelect
                                    label="Тип"
                                    value={draft.educationType}
                                    onChange={(e) => patchEducation(index, { educationType: e.target.value })}
                                >
                                    <option value="STATE">Гос. образование</option>
                                    <option value="COURSE">Онлайн-курс</option>
                                </InlineSelect>
                                <InlineField label={isCourse ? 'Платформа / курс' : 'Учебное заведение'}>
                                    <input
                                        value={draft.institutionName}
                                        placeholder={isCourse ? 'Coursera / Skillbox' : 'Университет'}
                                        onChange={(e) => patchEducation(index, { institutionName: e.target.value })}
                                    />
                                </InlineField>
                                <InlineField label="Направление">
                                    <input
                                        value={draft.direction}
                                        placeholder="Направление"
                                        onChange={(e) => patchEducation(index, { direction: e.target.value })}
                                    />
                                </InlineField>
                                <InlineField label="Уровень">
                                    <input
                                        value={draft.educationLevel}
                                        placeholder="Бакалавриат / курс"
                                        onChange={(e) => patchEducation(index, { educationLevel: e.target.value })}
                                    />
                                </InlineField>
                                <div className="sprEditSheet__row">
                                    <InlineField label="Начало">
                                        <input
                                            type="number"
                                            value={draft.startYear}
                                            placeholder="2020"
                                            onChange={(e) => patchEducation(index, { startYear: e.target.value })}
                                        />
                                    </InlineField>
                                    <InlineField label="Окончание">
                                        <input
                                            type="number"
                                            value={draft.endYear}
                                            placeholder="2024"
                                            onChange={(e) => patchEducation(index, { endYear: e.target.value })}
                                        />
                                    </InlineField>
                                </div>
                                <button
                                    type="button"
                                    className="sprInlineRemove"
                                    onClick={() => setEducationDrafts((prev) => prev.filter((_, i) => i !== index))}
                                >
                                    Удалить
                                </button>
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
                        <span aria-hidden="true">＋</span>
                        Добавить запись
                    </button>
                </div>
            ) : null}

            {error ? <p className="profileSectionEditor__error">{error}</p> : null}
        </div>
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
