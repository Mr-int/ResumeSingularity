import { useEffect, useState } from 'react';
import './studentProfileResume.css';
import editIcon from '../../assets/icons/edit.svg';
import folderIcon from '../../assets/icons/folder.svg';
import expIcon from '../../assets/icons/exp.svg';
import educationIcon from '../../assets/icons/education.svg';
import shareIcon from '../../assets/icons/share-filled.svg';
import statusLookingIcon from '../../assets/icons/status-looking.svg';
import busynessFulltimeIcon from '../../assets/icons/busyness-fulltime.svg';
import busynessProjectIcon from '../../assets/icons/busyness-project.svg';
import infoHintIcon from '../../assets/icons/info-hint.svg';
import whiteFolder from '../../assets/folders/white_folder.png';
import yellowFolder from '../../assets/folders/yellow_folder.png';
import greenFolder from '../../assets/folders/green_folder.png';
import pinkFolder from '../../assets/folders/pink_folder.png';
import {
    formatExperienceDurationShort,
    formatExperiencePeriodText,
} from '../../utils/formatExperiencePeriod.js';
import { normalizePortfolioItem } from '../../utils/portfolio.js';
import { getSpecialtyIcon } from '../../utils/specialtyIcon.js';
import {
    formatBusynessLabel,
    formatJobSearchStatusLabel,
    isLookingForJob,
    isProjectBusyness,
} from '../../utils/studentStatus.js';
import { courseUiLabel } from '../resumeCreator/StepForm/StepForm.jsx';
import { appPath } from '../../utils/appBase.js';
import ProfileSectionEditor from './ProfileSectionEditor.jsx';

const PORTFOLIO_FOLDER_IMAGES = [whiteFolder, yellowFolder, greenFolder, pinkFolder];
const SKILLS_VISIBLE = 8;
const PLACEHOLDER_EDU_INFO = /^добавлено студентом$/i;

const normalizePortfolioHref = (raw) => {
    const href = String(raw || '').trim();
    if (!href) return '';
    if (/^https?:\/\//i.test(href) || href.startsWith('mailto:') || href.startsWith('//')) {
        return href;
    }
    return `https://${href}`;
};

const courseTone = (course) => {
    switch (course) {
        case 'FIRST':
            return 1;
        case 'SECOND':
            return 2;
        case 'THIRD':
            return 3;
        case 'FOURTH':
            return 4;
        case 'NEW':
        case 'FIFTH':
            return 'star';
        default:
            return '';
    }
};

const IconEdit = ({ className = 'studentProfileResume__btnIcon' }) => (
    <img
        src={editIcon}
        alt=""
        className={className}
        width={14}
        height={14}
        aria-hidden="true"
    />
);

const MiniEdit = ({ visible, onClick, label }) => {
    if (!visible || !onClick) return null;
    return (
        <button
            type="button"
            className="studentProfileResume__miniEdit"
            aria-label={label}
            onClick={onClick}
        >
            <IconEdit className="studentProfileResume__miniEditIcon" />
        </button>
    );
};

const calcAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    if (Number.isNaN(birth.getTime())) return null;
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
    return age > 0 ? age : null;
};

const ageLabel = (age) => {
    if (age == null) return '';
    const mod10 = age % 10;
    const mod100 = age % 100;
    if (mod100 >= 11 && mod100 <= 14) return `${age} лет`;
    if (mod10 === 1) return `${age} год`;
    if (mod10 >= 2 && mod10 <= 4) return `${age} года`;
    return `${age} лет`;
};

const formatEduPeriod = (start, end) => {
    const a = start ? String(start) : '';
    const b = end ? String(end) : '';
    if (a && b) return `${a} – ${b}`;
    return a || b || '';
};

const cleanEducationText = (value, institutionName = '') => {
    const text = String(value || '').trim();
    if (!text) return '';
    if (PLACEHOLDER_EDU_INFO.test(text)) return '';
    if (institutionName && text === String(institutionName).trim()) return '';
    return text;
};

/**
 * Профиль студента.
 * @param {'owner'|'public'} variant — owner: кнопки редактирования; public: вид для каталога/работодателя
 */
const StudentProfileResume = ({
    student = {},
    skills = [],
    experiences = [],
    educations = [],
    portfolios = [],
    avatarSrc,
    verified = true,
    variant = 'owner',
    onEdit,
    onEditAvatar,
    onEmployerView,
    onRefresh,
}) => {
    const isOwner = variant === 'owner';
    const [linkCopied, setLinkCopied] = useState(false);
    const [skillsExpanded, setSkillsExpanded] = useState(false);
    const [expandedExperienceIds, setExpandedExperienceIds] = useState(() => new Set());
    const [editMode, setEditMode] = useState(false);
    const [activeSection, setActiveSection] = useState(null);

    const openSection = (section) => {
        if (!editMode) return;
        setActiveSection(section);
    };

    const handleToggleEditMode = () => {
        if (editMode) {
            setEditMode(false);
            setActiveSection(null);
            return;
        }
        setEditMode(true);
    };

    const firstName = student.firstName || '';
    const lastName = student.lastName || '';
    const studentId = student.id || '';
    const resumePath = studentId ? appPath(`profile/${studentId}`) : '';
    const resumeUrl = resumePath
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}${resumePath}`
        : '';
    const specialty = typeof student.speciality === 'string'
        ? student.speciality
        : (student.speciality?.name || student.profession || student.specialityName || 'Специальность не указана');
    const specialtyIcon = getSpecialtyIcon(specialty);
    const hasSpecialty = Boolean(specialty && specialty !== 'Специальность не указана');
    const specialtyBadgeContent = specialtyIcon ? (
        <img
            src={specialtyIcon}
            alt={hasSpecialty ? specialty : ''}
            className="studentProfileResume__badgeIcon"
        />
    ) : (
        <span className="studentProfileResume__badgePlaceholder" aria-hidden="true">—</span>
    );
    const course = student.course || '';
    const courseLabel = courseUiLabel(course);
    const tone = courseTone(course);
    const courseBadgeClass = tone
        ? `studentProfileResume__badge studentProfileResume__badge--course studentProfileResume__badge--course-${tone}`
        : 'studentProfileResume__badge studentProfileResume__badge--course';
    const bio = student.bio || student.description || student.about || '';
    const age = calcAge(student.birthDate);
    const city = student.city ? (String(student.city).startsWith('г.') ? student.city : `г. ${student.city}`) : '';

    const jobSearchLabel = formatJobSearchStatusLabel(student.jobSearchStatus);
    const desiredBusynessLabel = formatBusynessLabel(student.desiredBusyness);
    const busynessLabel = formatBusynessLabel(student.busyness);
    const looking = isLookingForJob(student.jobSearchStatus);
    const projectBusy = isProjectBusyness(student.busyness);
    const desiredProjectBusy = isProjectBusyness(student.desiredBusyness);

    const skillList = Array.isArray(skills) && skills.length
        ? skills
        : (Array.isArray(student.skills) ? student.skills : []);
    const visibleSkills = skillsExpanded ? skillList : skillList.slice(0, SKILLS_VISIBLE);
    const hiddenSkills = Math.max(0, skillList.length - SKILLS_VISIBLE);

    const experienceItems = (Array.isArray(experiences) ? experiences : []).map((item) => {
        const href = (item.webUrl || item.link || item.companyUrl || '').toString().trim();
        const isProject = String(item.experienceType || '').toUpperCase() === 'PROJECT'
            || item.activityKind === 'project';
        const period = isProject
            ? formatExperienceDurationShort(item.startDate, item.endDate, item.current)
            : formatExperiencePeriodText(item.startDate, item.endDate, item.current);
        return {
            id: item.id,
            company: (item.company || item.companyName || '').toString().trim(),
            period,
            position: (item.position || item.role || '').toString().trim(),
            description: (item.description || item.additionalInfo || '').toString().trim(),
            href,
            hrefLabel: isProject ? 'Ссылка на материалы' : 'Ссылка на организацию',
            kind: isProject ? 'project' : 'work',
            tag: isProject ? 'Проект' : 'Опыт работы',
        };
    });

    const educationItems = (Array.isArray(educations) ? educations : []).map((item, index) => {
        const educationType = String(item.educationType || '').toUpperCase();
        const isCourse = educationType === 'COURSE'
            || item.educationKind === 'course'
            || item.tag === 'Онлайн-курс';
        const title = item.name || item.institution || item.institutionName || 'Учебное заведение';
        const direction = cleanEducationText(item.direction || item.speciality || item.role, title);
        const level = cleanEducationText(item.educationLevel, title);
        const fallbackInfo = cleanEducationText(item.additionalInfo, title);
        return {
            id: item.id || `edu-${index}`,
            title,
            period: formatEduPeriod(item.startDate || item.startYear, item.endDate || item.endYear),
            role: direction || (!isCourse ? level : '') || fallbackInfo,
            href: (item.webUrl || item.link || '').toString().trim(),
            hrefLabel: item.webUrl || item.link
                ? (isCourse ? 'Ссылка на курс' : 'Ссылка на уч. заведение')
                : '',
            tag: isCourse ? 'Онлайн-курс' : (level || 'Гос. образование'),
            tone: isCourse ? 'green' : 'blue',
        };
    });

    const portfolioItems = (Array.isArray(portfolios) ? portfolios : [])
        .map((item, index) => {
            const normalized = normalizePortfolioItem(item);
            const href = normalizePortfolioHref(normalized.link);
            if (!normalized.name && !normalized.description && !href) return null;
            return {
                id: normalized.id ?? `portfolio-${index}`,
                name: normalized.name || 'Ссылка',
                description: normalized.description,
                href,
                src: PORTFOLIO_FOLDER_IMAGES[index % PORTFOLIO_FOLDER_IMAGES.length],
            };
        })
        .filter(Boolean);

    useEffect(() => {
        if (!linkCopied) return undefined;
        const timer = window.setTimeout(() => setLinkCopied(false), 2000);
        return () => window.clearTimeout(timer);
    }, [linkCopied]);

    const handleCopyResumeLink = async () => {
        if (!resumeUrl) return;
        try {
            await navigator.clipboard.writeText(resumeUrl);
            setLinkCopied(true);
        } catch {
            window.prompt('Скопируйте ссылку на резюме:', resumeUrl);
        }
    };

    const toggleExperience = (id) => {
        setExpandedExperienceIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    return (
        <div className={`studentProfileResume${editMode ? ' is-editing' : ''}`}>
            <div className="studentProfileResume__layout">
                <aside className="studentProfileResume__sidebar">
                    <header className="studentProfileResume__profileCard">
                        <div className="studentProfileResume__avatar">
                            {avatarSrc ? (
                                <img
                                    src={avatarSrc}
                                    alt=""
                                    className="studentProfileResume__avatarImg"
                                />
                            ) : null}
                            {verified ? (
                                <span
                                    className="studentProfileResume__badge studentProfileResume__badge--verified"
                                    aria-label="Подтверждённый аккаунт"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </span>
                            ) : null}
                            <div className="studentProfileResume__badges">
                                <span
                                    className="studentProfileResume__badge studentProfileResume__badge--edit"
                                    title={hasSpecialty ? specialty : 'Специальность'}
                                >
                                    {specialtyBadgeContent}
                                </span>
                                {courseLabel ? (
                                    <span
                                        className={courseBadgeClass}
                                        aria-label={`Курс: ${courseLabel}`}
                                    >
                                        {courseLabel}
                                    </span>
                                ) : null}
                            </div>
                            <MiniEdit
                                visible={isOwner && editMode}
                                onClick={() => openSection('avatar')}
                                label="Редактировать фото"
                            />
                        </div>
                        <div className="studentProfileResume__identity">
                            <h1 className="studentProfileResume__name">
                                <span>{firstName || 'Имя'}</span>
                                <span>{lastName || 'Фамилия'}</span>
                            </h1>
                            <MiniEdit
                                visible={isOwner && editMode}
                                onClick={() => openSection('name')}
                                label="Редактировать имя"
                            />
                        </div>
                        <div className="studentProfileResume__identity studentProfileResume__identity--specialty">
                            <p className="studentProfileResume__specialty">{specialty}</p>
                            <MiniEdit
                                visible={isOwner && editMode}
                                onClick={() => openSection('specialty')}
                                label="Редактировать специальность"
                            />
                        </div>
                    </header>

                    {false && (editMode || jobSearchLabel || desiredBusynessLabel || busynessLabel) ? (
                        <div className="studentProfileResume__statusBlock">
                            <div className="studentProfileResume__statusRow">
                                <div className="studentProfileResume__statusHead">
                                    <p className="studentProfileResume__statusLabel">Статус поиска</p>
                                    <MiniEdit
                                        visible={isOwner && editMode}
                                        onClick={() => openSection('status')}
                                        label="Редактировать статус поиска"
                                    />
                                </div>
                                <div className={`studentProfileResume__statusValue${looking ? ' is-looking' : ''}`}>
                                    <span>{jobSearchLabel || 'Не указан'}</span>
                                    {looking ? <img src={statusLookingIcon} alt="" width={16} height={16} /> : null}
                                    <img src={infoHintIcon} alt="" width={14} height={14} />
                                </div>
                            </div>

                            <div className="studentProfileResume__statusRow">
                                <div className="studentProfileResume__statusHead">
                                    <p className="studentProfileResume__statusLabel">Желаемый формат</p>
                                    <MiniEdit
                                        visible={isOwner && editMode}
                                        onClick={() => openSection('status')}
                                        label="Редактировать желаемый формат"
                                    />
                                </div>
                                <div className="studentProfileResume__statusValue">
                                    <span>{desiredBusynessLabel || 'Не указан'}</span>
                                    {desiredBusynessLabel ? (
                                        <img
                                            src={desiredProjectBusy ? busynessProjectIcon : busynessFulltimeIcon}
                                            alt=""
                                            width={30}
                                            height={24}
                                        />
                                    ) : null}
                                    <img src={infoHintIcon} alt="" width={14} height={14} />
                                </div>
                            </div>

                            <div className="studentProfileResume__statusRow">
                                <div className="studentProfileResume__statusHead">
                                    <p className="studentProfileResume__statusLabel">Имеется занятость</p>
                                    <MiniEdit
                                        visible={isOwner && editMode}
                                        onClick={() => openSection('status')}
                                        label="Редактировать занятость"
                                    />
                                </div>
                                <div className="studentProfileResume__statusValue">
                                    <span>{busynessLabel || 'Не указана'}</span>
                                    {busynessLabel ? (
                                        <img
                                            src={projectBusy ? busynessProjectIcon : busynessFulltimeIcon}
                                            alt=""
                                            width={30}
                                            height={24}
                                        />
                                    ) : null}
                                    <img src={infoHintIcon} alt="" width={14} height={14} />
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {isOwner ? (
                        <nav className="studentProfileResume__nav" aria-label="Навигация по профилю">
                            <button
                                type="button"
                                className={`studentProfileResume__btn${editMode ? ' studentProfileResume__btn--primary' : ' studentProfileResume__btn--edit'}`}
                                onClick={handleToggleEditMode}
                            >
                                {editMode ? 'Готово' : 'Редактировать'}
                                {!editMode ? <IconEdit /> : null}
                            </button>
                            {resumeUrl ? (
                                <button
                                    type="button"
                                    className="studentProfileResume__btn studentProfileResume__btn--share"
                                    onClick={handleCopyResumeLink}
                                    title={resumeUrl}
                                >
                                    {linkCopied ? 'Скопировано' : 'Поделиться'}
                                    <img src={shareIcon} alt="" width={24} height={24} />
                                </button>
                            ) : null}
                            <button type="button" className="studentProfileResume__btn studentProfileResume__btn--outline" onClick={onEmployerView}>
                                Вид от работодателя
                            </button>
                        </nav>
                    ) : null}
                </aside>

                <main className="studentProfileResume__main">
                    <section className="studentProfileResume__about" aria-labelledby="spr-about-title">
                        <div className="studentProfileResume__bio">
                            <div className="studentProfileResume__sectionHead">
                                <h2 id="spr-about-title" className="studentProfileResume__sectionTitle">Обо мне</h2>
                                <MiniEdit
                                    visible={isOwner && editMode}
                                    onClick={() => openSection('bio')}
                                    label="Редактировать описание"
                                />
                            </div>
                            <p className="studentProfileResume__bioText">
                                {bio || 'Информация о себе пока не заполнена'}
                            </p>
                        </div>

                        <div className="studentProfileResume__infoSkills">
                            <div className="studentProfileResume__infoBlock">
                                <div className="studentProfileResume__sectionHead">
                                    <h3 className="studentProfileResume__sectionTitle">
                                        <svg className="studentProfileResume__iconBlue" width="16" height="16" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                            <polygon
                                                points="60,25 100,95 20,95"
                                                fill="#3E8EFF"
                                                stroke="#3E8EFF"
                                                strokeWidth="12"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                        Инфо
                                    </h3>
                                    <MiniEdit
                                        visible={isOwner && editMode}
                                        onClick={() => openSection('info')}
                                        label="Редактировать инфо"
                                    />
                                </div>
                                <div className="studentProfileResume__infoText">
                                    {age != null ? <p>{ageLabel(age)}</p> : null}
                                    {city ? <p>{city}</p> : null}
                                    {age == null && !city ? (
                                        <p className="studentProfileResume__empty">Данные не указаны</p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="studentProfileResume__skillsBlock">
                                <div className="studentProfileResume__sectionHead">
                                    <h3 className="studentProfileResume__sectionTitle">
                                        <svg className="studentProfileResume__iconPink" width="18" height="18" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                            <polygon
                                                points="60,20 100,50 85,95 35,95 20,50"
                                                fill="#e02bf2"
                                                stroke="#e02bf2"
                                                strokeWidth="6"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                        Навыки
                                    </h3>
                                    <MiniEdit
                                        visible={isOwner && editMode}
                                        onClick={() => openSection('skills')}
                                        label="Редактировать навыки"
                                    />
                                </div>
                                {skillList.length > 0 ? (
                                    <ul className="studentProfileResume__skills">
                                        {visibleSkills.map((skill, index) => (
                                            <li key={skill.id || index} className="studentProfileResume__tag">
                                                {skill.name || skill.title || 'Навык'}
                                            </li>
                                        ))}
                                        {hiddenSkills > 0 && !skillsExpanded ? (
                                            <li>
                                                <button
                                                    type="button"
                                                    className="studentProfileResume__tag studentProfileResume__tag--more"
                                                    onClick={() => setSkillsExpanded(true)}
                                                >
                                                    Показать ещё {hiddenSkills}+
                                                </button>
                                            </li>
                                        ) : null}
                                        {skillsExpanded && hiddenSkills > 0 ? (
                                            <li>
                                                <button
                                                    type="button"
                                                    className="studentProfileResume__tag studentProfileResume__tag--more"
                                                    onClick={() => setSkillsExpanded(false)}
                                                >
                                                    Свернуть
                                                </button>
                                            </li>
                                        ) : null}
                                    </ul>
                                ) : (
                                    <p className="studentProfileResume__empty">Навыки не указаны</p>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="studentProfileResume__section" aria-labelledby="spr-portfolio-title">
                        <div className="studentProfileResume__sectionHead">
                            <h2 id="spr-portfolio-title" className="studentProfileResume__sectionTitle">
                                <img className="studentProfileResume__iconGreen" src={folderIcon} alt="" width={16} height={16} aria-hidden="true" />
                                Портфолио
                            </h2>
                            <MiniEdit
                                visible={isOwner && editMode}
                                onClick={() => openSection('portfolio')}
                                label="Редактировать портфолио"
                            />
                        </div>
                        {portfolioItems.length > 0 ? (
                            <div className="studentProfileResume__portfolioFolders">
                                {portfolioItems.map((item) => {
                                    const content = (
                                        <>
                                            <img
                                                className="studentProfileResume__portfolioFolderImg"
                                                src={item.src}
                                                alt=""
                                                width={210}
                                                height={135}
                                            />
                                            <div className="studentProfileResume__portfolioFolderCopy">
                                                <p className="studentProfileResume__portfolioFolderName">
                                                    {item.name}
                                                </p>
                                                {item.description ? (
                                                    <p className="studentProfileResume__portfolioFolderDesc">
                                                        {item.description}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </>
                                    );

                                    if (item.href) {
                                        return (
                                            <a
                                                key={item.id}
                                                className="studentProfileResume__portfolioFolder"
                                                href={item.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title={item.name}
                                            >
                                                {content}
                                            </a>
                                        );
                                    }

                                    return (
                                        <article
                                            key={item.id}
                                            className="studentProfileResume__portfolioFolder"
                                        >
                                            {content}
                                        </article>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="studentProfileResume__empty">Работы в портфолио не добавлены</p>
                        )}
                    </section>

                    <section className="studentProfileResume__section" aria-labelledby="spr-experience-title">
                        <div className="studentProfileResume__sectionHead">
                            <h2 id="spr-experience-title" className="studentProfileResume__sectionTitle">
                                <img className="studentProfileResume__iconOrange" src={expIcon} alt="" width={16} height={16} aria-hidden="true" />
                                Опыт работы
                            </h2>
                            <MiniEdit
                                visible={isOwner && editMode}
                                onClick={() => openSection('experience')}
                                label="Редактировать опыт"
                            />
                        </div>
                        {experienceItems.length > 0 ? (
                            <div className="studentProfileResume__experienceGrid">
                                {experienceItems.map((item, index) => {
                                    const key = item.id || index;
                                    const expanded = expandedExperienceIds.has(key);
                                    const longText = item.description.length > 90;
                                    const shownDescription = !item.description
                                        ? ''
                                        : (expanded || !longText
                                            ? item.description
                                            : `${item.description.slice(0, 90).trimEnd()}...`);

                                    return (
                                        <article
                                            key={key}
                                            className={
                                                'studentProfileResume__experienceCard'
                                                + (item.kind === 'project'
                                                    ? ' studentProfileResume__experienceCard--project'
                                                    : ' studentProfileResume__experienceCard--work')
                                            }
                                        >
                                            <div className="studentProfileResume__experienceMeta">
                                                <h3 className="studentProfileResume__experienceCompany">
                                                    {item.company || (item.kind === 'project' ? 'Проект' : 'Компания не указана')}
                                                </h3>
                                                {item.period ? (
                                                    <p className="studentProfileResume__experiencePeriod">{item.period}</p>
                                                ) : null}
                                            </div>
                                            {item.position ? (
                                                <p className="studentProfileResume__experiencePosition">{item.position}</p>
                                            ) : null}
                                            {shownDescription ? (
                                                <button
                                                    type="button"
                                                    className="studentProfileResume__experienceDescriptionBtn"
                                                    onClick={() => longText && toggleExperience(key)}
                                                    aria-expanded={expanded}
                                                >
                                                    <span className="studentProfileResume__experienceDescription">
                                                        {shownDescription}
                                                    </span>
                                                    {longText ? (
                                                        <span className={`studentProfileResume__chevron${expanded ? ' is-open' : ''}`} aria-hidden="true" />
                                                    ) : null}
                                                </button>
                                            ) : null}
                                            {item.href ? (
                                                <a
                                                    className="studentProfileResume__experienceLink"
                                                    href={item.href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    {item.hrefLabel}
                                                </a>
                                            ) : null}
                                            {item.tag ? (
                                                <span className="studentProfileResume__experienceTag">{item.tag}</span>
                                            ) : null}
                                        </article>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="studentProfileResume__empty">Опыт пока не добавлен</p>
                        )}
                    </section>

                    <section className="studentProfileResume__section" aria-labelledby="spr-education-title">
                        <div className="studentProfileResume__sectionHead">
                            <h2 id="spr-education-title" className="studentProfileResume__sectionTitle">
                                <img className="studentProfileResume__iconPurple" src={educationIcon} alt="" width={16} height={16} aria-hidden="true" />
                                Образование
                            </h2>
                            <MiniEdit
                                visible={isOwner && editMode}
                                onClick={() => openSection('education')}
                                label="Редактировать образование"
                            />
                        </div>
                        {educationItems.length > 0 ? (
                            <div className="studentProfileResume__educationGrid">
                                {educationItems.map((item) => (
                                    <article
                                        key={item.id}
                                        className={`studentProfileResume__educationCard studentProfileResume__educationCard--${item.tone}`}
                                    >
                                        <h3>{item.title}</h3>
                                        {item.period ? (
                                            <time className="studentProfileResume__educationDate">{item.period}</time>
                                        ) : null}
                                        {item.role ? (
                                            <div className="studentProfileResume__educationRole">{item.role}</div>
                                        ) : null}
                                        {item.href ? (
                                            <a href={item.href} target="_blank" rel="noopener noreferrer">
                                                {item.hrefLabel || 'Ссылка'}
                                            </a>
                                        ) : null}
                                        {item.tag ? (
                                            <span className="studentProfileResume__educationTag">{item.tag}</span>
                                        ) : null}
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <p className="studentProfileResume__empty">Образование пока не добавлено</p>
                        )}
                    </section>

                    {isOwner ? (
                        <footer className="studentProfileResume__banner">
                            <p>
                                Вы можете отредактировать ваше резюме, изменив его, вы снова отправляете ваше резюме на проверку.
                            </p>
                            <button
                                type="button"
                                className="studentProfileResume__btn studentProfileResume__btn--primary"
                                onClick={handleToggleEditMode}
                            >
                                {editMode ? 'Готово' : 'Редактировать'}
                                {!editMode ? <IconEdit /> : null}
                            </button>
                        </footer>
                    ) : null}
                </main>
            </div>

            {isOwner && activeSection ? (
                <ProfileSectionEditor
                    section={activeSection}
                    student={student}
                    skills={skillList}
                    experiences={experiences}
                    educations={educations}
                    portfolios={portfolios}
                    onClose={() => setActiveSection(null)}
                    onSaved={async () => {
                        await onRefresh?.();
                    }}
                />
            ) : null}
        </div>
    );
};

export default StudentProfileResume;
