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
    onClose,
    onSaved,
}) => {
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
            id: item.id,
            educationId: item.educationId || item.id,
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
                            <select
                                value={specialityId || ''}
                                onChange={(e) => setSpecialityId(e.target.value)}
                            >
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
                            <textarea
                                rows={8}
                                maxLength={2000}
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                            />
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
                                <input
                                    type="date"
                                    value={birthDate || ''}
                                    onChange={(e) => setBirthDate(e.target.value)}
                                />
                            </label>
                        </>
                    ) : null}

                    {section === 'status' ? (
                        <>
                            <label className="profileSectionEditor__field">
                                <span>Статус поиска</span>
                                <select
                                    value={jobSearchStatus || ''}
                                    onChange={(e) => setJobSearchStatus(e.target.value)}
                                >
                                    <option value="">Не указан</option>
                                    {JOB_SEARCH_OPTIONS.map((item) => (
                                        <option key={item.value} value={item.value}>{item.label}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="profileSectionEditor__field">
                                <span>Желаемый формат</span>
                                <select
                                    value={desiredBusyness || ''}
                                    onChange={(e) => setDesiredBusyness(e.target.value)}
                                >
                                    <option value="">Не указан</option>
                                    {DESIRED_BUSYNESS_OPTIONS.map((item) => (
                                        <option key={item.value} value={item.value}>{item.label}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="profileSectionEditor__field">
                                <span>Имеется занятость</span>
                                <select
                                    value={busyness || ''}
                                    onChange={(e) => setBusyness(e.target.value)}
                                >
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

                    {section === 'portfolio' ? (
                        <div className="profileSectionEditor__list">
                            {portfolioDrafts.map((draft, index) => (
                                <div key={draft.id ?? `new-${index}`} className="profileSectionEditor__card">
                                    <input
                                        placeholder="Название"
                                        value={draft.name}
                                        onChange={(e) => setPortfolioDrafts((prev) => prev.map((item, i) => (
                                            i === index ? { ...item, name: e.target.value } : item
                                        )))}
                                    />
                                    <input
                                        placeholder="Описание"
                                        value={draft.description}
                                        onChange={(e) => setPortfolioDrafts((prev) => prev.map((item, i) => (
                                            i === index ? { ...item, description: e.target.value } : item
                                        )))}
                                    />
                                    <input
                                        placeholder="Ссылка"
                                        value={draft.link}
                                        onChange={(e) => setPortfolioDrafts((prev) => prev.map((item, i) => (
                                            i === index ? { ...item, link: e.target.value } : item
                                        )))}
                                    />
                                    <button
                                        type="button"
                                        className="profileSectionEditor__remove"
                                        onClick={() => setPortfolioDrafts((prev) => prev.filter((_, i) => i !== index))}
                                    >
                                        Удалить
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                className="profileSectionEditor__add"
                                onClick={() => setPortfolioDrafts((prev) => [...prev, { id: null, name: '', description: '', link: '' }])}
                            >
                                Добавить ссылку
                            </button>
                        </div>
                    ) : null}

                    {section === 'experience' ? (
                        <div className="profileSectionEditor__list">
                            {experienceDrafts.map((draft, index) => (
                                <div key={draft.id ?? `new-${index}`} className="profileSectionEditor__card">
                                    <select
                                        value={draft.experienceType}
                                        onChange={(e) => setExperienceDrafts((prev) => prev.map((item, i) => (
                                            i === index ? { ...item, experienceType: e.target.value } : item
                                        )))}
                                    >
                                        <option value="WORK">Опыт работы</option>
                                        <option value="PROJECT">Проект</option>
                                    </select>
                                    <input
                                        placeholder={draft.experienceType === 'PROJECT' ? 'Название проекта' : 'Организация'}
                                        value={draft.companyName}
                                        onChange={(e) => setExperienceDrafts((prev) => prev.map((item, i) => (
                                            i === index ? { ...item, companyName: e.target.value } : item
                                        )))}
                                    />
                                    <input
                                        placeholder="Роль"
                                        value={draft.position}
                                        onChange={(e) => setExperienceDrafts((prev) => prev.map((item, i) => (
                                            i === index ? { ...item, position: e.target.value } : item
                                        )))}
                                    />
                                    <input
                                        placeholder="Ссылка"
                                        value={draft.companyUrl}
                                        onChange={(e) => setExperienceDrafts((prev) => prev.map((item, i) => (
                                            i === index ? { ...item, companyUrl: e.target.value } : item
                                        )))}
                                    />
                                    <div className="profileSectionEditor__row">
                                        <input
                                            type="date"
                                            value={draft.startDate || ''}
                                            onChange={(e) => setExperienceDrafts((prev) => prev.map((item, i) => (
                                                i === index ? { ...item, startDate: e.target.value } : item
                                            )))}
                                        />
                                        <input
                                            type="date"
                                            value={draft.endDate || ''}
                                            onChange={(e) => setExperienceDrafts((prev) => prev.map((item, i) => (
                                                i === index ? { ...item, endDate: e.target.value } : item
                                            )))}
                                        />
                                    </div>
                                    <textarea
                                        rows={3}
                                        placeholder="Описание"
                                        value={draft.additionalInfo}
                                        onChange={(e) => setExperienceDrafts((prev) => prev.map((item, i) => (
                                            i === index ? { ...item, additionalInfo: e.target.value } : item
                                        )))}
                                    />
                                    <button
                                        type="button"
                                        className="profileSectionEditor__remove"
                                        onClick={() => setExperienceDrafts((prev) => prev.filter((_, i) => i !== index))}
                                    >
                                        Удалить
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                className="profileSectionEditor__add"
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
                                Добавить запись
                            </button>
                        </div>
                    ) : null}

                    {section === 'education' ? (
                        <div className="profileSectionEditor__list">
                            {educationDrafts.map((draft, index) => (
                                <div key={draft.id ?? `new-${index}`} className="profileSectionEditor__card">
                                    <select
                                        value={draft.educationType}
                                        onChange={(e) => setEducationDrafts((prev) => prev.map((item, i) => (
                                            i === index ? { ...item, educationType: e.target.value } : item
                                        )))}
                                    >
                                        <option value="STATE">Гос. образование</option>
                                        <option value="COURSE">Курс</option>
                                    </select>
                                    <input
                                        placeholder={draft.educationType === 'COURSE' ? 'Платформа / курс' : 'Учебное заведение'}
                                        value={draft.institutionName}
                                        onChange={(e) => setEducationDrafts((prev) => prev.map((item, i) => (
                                            i === index ? { ...item, institutionName: e.target.value } : item
                                        )))}
                                    />
                                    <input
                                        placeholder="Направление"
                                        value={draft.direction}
                                        onChange={(e) => setEducationDrafts((prev) => prev.map((item, i) => (
                                            i === index ? { ...item, direction: e.target.value } : item
                                        )))}
                                    />
                                    <input
                                        placeholder="Уровень образования"
                                        value={draft.educationLevel}
                                        onChange={(e) => setEducationDrafts((prev) => prev.map((item, i) => (
                                            i === index ? { ...item, educationLevel: e.target.value } : item
                                        )))}
                                    />
                                    <div className="profileSectionEditor__row">
                                        <input
                                            type="number"
                                            placeholder="Начало"
                                            value={draft.startYear}
                                            onChange={(e) => setEducationDrafts((prev) => prev.map((item, i) => (
                                                i === index ? { ...item, startYear: e.target.value } : item
                                            )))}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Окончание"
                                            value={draft.endYear}
                                            onChange={(e) => setEducationDrafts((prev) => prev.map((item, i) => (
                                                i === index ? { ...item, endYear: e.target.value } : item
                                            )))}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className="profileSectionEditor__remove"
                                        onClick={() => setEducationDrafts((prev) => prev.filter((_, i) => i !== index))}
                                    >
                                        Удалить
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                className="profileSectionEditor__add"
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
                                Добавить запись
                            </button>
                        </div>
                    ) : null}

                    {error ? <p className="profileSectionEditor__error">{error}</p> : null}
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
