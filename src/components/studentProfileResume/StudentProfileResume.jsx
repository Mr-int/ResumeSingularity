import './studentProfileResume.css';

const PORTFOLIO_TONES = ['blue', 'yellow', 'green', 'pink'];
const SKILLS_VISIBLE = 8;

const IconEdit = () => (
    <svg className="studentProfileResume__btnIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
);

const IconEye = () => (
    <svg className="studentProfileResume__btnIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const IconSettings = () => (
    <svg className="studentProfileResume__btnIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
);

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

/**
 * Профиль студента с готовым резюме (владелец).
 */
const StudentProfileResume = ({
    student = {},
    skills = [],
    portfolio = [],
    experiences = [],
    educations = [],
    avatarSrc,
    verified = true,
    onEdit,
    onEditAvatar,
    onEmployerView,
    onSettings,
}) => {
    const fullName = [student.firstName, student.lastName].filter(Boolean).join(' ').trim() || 'Без имени';
    const specialty = student.speciality || student.profession || student.specialityName || 'Специальность не указана';
    const bio = student.bio || student.description || student.about || '';
    const age = calcAge(student.birthDate);
    const city = student.city ? (String(student.city).startsWith('г.') ? student.city : `г. ${student.city}`) : '';

    const skillList = Array.isArray(skills) && skills.length
        ? skills
        : (Array.isArray(student.skills) ? student.skills : []);
    const visibleSkills = skillList.slice(0, SKILLS_VISIBLE);
    const hiddenSkills = Math.max(0, skillList.length - SKILLS_VISIBLE);

    const portfolioItems = (Array.isArray(portfolio) ? portfolio : [])
        .map((item) => ({
            id: item.id,
            title: item.name || item.title || 'Проект',
            subtitle: item.description || item.additionalInfo || item.link || item.url || '',
            href: (item.link || item.url || item.website || '').toString().trim(),
        }))
        .filter((item) => item.href);

    const experienceItems = (Array.isArray(experiences) ? experiences : []).map((item) => ({
        id: item.id,
        title: item.position || item.role || item.company || 'Опыт',
        text: item.description || item.additionalInfo || '',
        href: (item.webUrl || item.link || item.companyUrl || '').toString().trim(),
        hrefLabel: item.webUrl || item.link || item.companyUrl || '',
    }));

    const educationItems = (Array.isArray(educations) ? educations : []).map((item, index) => ({
        id: item.id || `edu-${index}`,
        title: item.name || item.institution || 'Учебное заведение',
        period: formatEduPeriod(item.startDate || item.startYear, item.endDate || item.endYear),
        role: item.speciality || item.additionalInfo || item.role || '',
        href: (item.webUrl || item.link || '').toString().trim(),
        hrefLabel: item.webUrl || item.link ? 'Ссылка на уч. заведение' : '',
        tag: item.tag || item.educationType || (index === 0 ? 'Среднее профессиональное' : 'Онлайн-курс'),
        tone: index % 2 === 0 ? 'blue' : 'green',
    }));

    return (
        <div className="studentProfileResume">
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
                            {onEditAvatar ? (
                                <button
                                    type="button"
                                    className="studentProfileResume__badge studentProfileResume__badge--edit"
                                    aria-label="Редактировать аватар"
                                    onClick={onEditAvatar}
                                >
                                    <IconEdit />
                                </button>
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
                        </div>
                        <h1 className="studentProfileResume__name">{fullName}</h1>
                        <p className="studentProfileResume__specialty">{specialty}</p>
                    </header>

                    <nav className="studentProfileResume__nav" aria-label="Навигация по профилю">
                        <button type="button" className="studentProfileResume__btn studentProfileResume__btn--primary" onClick={onEdit}>
                            <IconEdit />
                            Редактировать
                        </button>
                        <button type="button" className="studentProfileResume__btn studentProfileResume__btn--secondary" onClick={onEmployerView}>
                            <IconEye />
                            Вид от работодателя
                        </button>
                        <button type="button" className="studentProfileResume__btn studentProfileResume__btn--secondary" onClick={onSettings}>
                            <IconSettings />
                            Настройки аккаунта
                        </button>
                    </nav>

                    <footer className="studentProfileResume__sidebarFooter">
                        Достижения аккаунта
                    </footer>
                </aside>

                <main className="studentProfileResume__main">
                    <section className="studentProfileResume__about" aria-labelledby="spr-about-title">
                        <div className="studentProfileResume__bio">
                            <h2 id="spr-about-title" className="studentProfileResume__sectionTitle">Обо мне</h2>
                            <p className="studentProfileResume__bioText">
                                {bio || 'Информация о себе пока не заполнена'}
                            </p>
                        </div>

                        <div className="studentProfileResume__infoSkills">
                            <div>
                                <h3 className="studentProfileResume__sectionTitle">
                                    <svg className="studentProfileResume__iconBlue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="16" x2="12" y2="12" />
                                        <line x1="12" y1="8" x2="12.01" y2="8" />
                                    </svg>
                                    Инфо
                                </h3>
                                <div className="studentProfileResume__infoText">
                                    {age != null ? <p>{ageLabel(age)}</p> : null}
                                    {city ? <p>{city}</p> : null}
                                    {age == null && !city ? (
                                        <p className="studentProfileResume__empty">Данные не указаны</p>
                                    ) : null}
                                </div>
                            </div>

                            <div>
                                <h3 className="studentProfileResume__sectionTitle">
                                    <svg className="studentProfileResume__iconPink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                    Навыки
                                </h3>
                                {visibleSkills.length > 0 ? (
                                    <ul className="studentProfileResume__skills">
                                        {visibleSkills.map((skill, index) => (
                                            <li key={skill.id || index} className="studentProfileResume__tag">
                                                {skill.name || skill.title || 'Навык'}
                                            </li>
                                        ))}
                                        {hiddenSkills > 0 ? (
                                            <li className="studentProfileResume__tag studentProfileResume__tag--more">
                                                и ещё {hiddenSkills}+
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
                        <h2 id="spr-portfolio-title" className="studentProfileResume__sectionTitle">
                            <svg className="studentProfileResume__iconGreen" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                            </svg>
                            Портфолио
                        </h2>
                        {portfolioItems.length > 0 ? (
                            <div className="studentProfileResume__portfolioGrid">
                                {portfolioItems.map((item, index) => (
                                    <a
                                        key={item.id || index}
                                        href={item.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`studentProfileResume__portfolioCard studentProfileResume__portfolioCard--${PORTFOLIO_TONES[index % PORTFOLIO_TONES.length]}`}
                                    >
                                        <h3>{item.title}</h3>
                                        {item.subtitle ? <p>{item.subtitle}</p> : null}
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <p className="studentProfileResume__empty">Портфолио пока пусто</p>
                        )}
                    </section>

                    <section className="studentProfileResume__section" aria-labelledby="spr-experience-title">
                        <h2 id="spr-experience-title" className="studentProfileResume__sectionTitle">
                            <svg className="studentProfileResume__iconOrange" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                            </svg>
                            Опыт работы
                        </h2>
                        {experienceItems.length > 0 ? (
                            <div className="studentProfileResume__experienceGrid">
                                {experienceItems.map((item, index) => (
                                    <article key={item.id || index} className="studentProfileResume__experienceCard">
                                        <h3>{item.title}</h3>
                                        {item.text ? <p>{item.text}</p> : null}
                                        {item.href ? (
                                            <a href={item.href} target="_blank" rel="noopener noreferrer">
                                                {item.hrefLabel}
                                            </a>
                                        ) : null}
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <p className="studentProfileResume__empty">Опыт пока не добавлен</p>
                        )}
                    </section>

                    <section className="studentProfileResume__section" aria-labelledby="spr-education-title">
                        <h2 id="spr-education-title" className="studentProfileResume__sectionTitle">
                            <svg className="studentProfileResume__iconPurple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                <path d="M6 12v5c3 3 9 3 12 0v-5" />
                            </svg>
                            Образование
                        </h2>
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

                    <footer className="studentProfileResume__banner">
                        <p>
                            Вы можете отредактировать ваше резюме, изменив его, вы снова отправляете ваше резюме на ревью.
                        </p>
                        <button
                            type="button"
                            className="studentProfileResume__btn studentProfileResume__btn--primary"
                            onClick={onEdit}
                        >
                            Редактировать
                            <IconEdit />
                        </button>
                    </footer>
                </main>
            </div>
        </div>
    );
};

export default StudentProfileResume;
