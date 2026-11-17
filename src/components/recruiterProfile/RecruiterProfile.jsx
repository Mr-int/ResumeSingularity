import { useEffect, useState } from 'react';
import { patchRecruiter } from '../../services/accountApi.js';
import '../studentProfileResume/studentProfileResume.css';
import './recruiterProfile.css';

const COOPERATION_OPTIONS = [
    {
        value: 'SEMESTER_PROJECT',
        label: 'Проектная активность на семестр (может не оплачиваться)',
    },
    {
        value: 'SUMMER_PRACTICE',
        label: 'Летняя профессиональная практика (может не оплачиваться)',
    },
    {
        value: 'INTERNSHIP',
        label: 'Стажировка (оплачивается, оформление по СМЗ/ИП)',
    },
    {
        value: 'VACANCY',
        label: 'Вакансия (оплачивается, оформление по ТК РФ)',
    },
    {
        value: 'OTHER',
        label: 'Другое',
    },
];

const READY_OPTIONS = [
    { value: true, label: 'Да, хочу оставить заявку' },
    { value: false, label: 'Нет, нужна помощь в оформлении' },
];

const textOrEmpty = (value) => {
    const text = String(value ?? '').trim();
    return text || 'Не указано';
};

const initialsOf = (profile) => {
    const letters = [profile?.firstName, profile?.lastName]
        .map((part) => String(part || '').trim().charAt(0))
        .filter(Boolean)
        .join('')
        .toUpperCase();
    return letters || 'Р';
};

const readyFromProfile = (value) => {
    if (value === true || value === false) return value;
    return null;
};

const RecruiterProfile = ({ profile, onSaved }) => {
    const [format, setFormat] = useState(() => profile?.cooperationFormat || '');
    const [ready, setReady] = useState(() => readyFromProfile(profile?.readyToRequestStudents));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setFormat(profile?.cooperationFormat || '');
        setReady(readyFromProfile(profile?.readyToRequestStudents));
    }, [profile]);

    const handleSave = async () => {
        const body = {};
        if (format) body.cooperationFormat = format;
        if (ready === true || ready === false) body.readyToRequestStudents = ready;
        if (Object.keys(body).length === 0) {
            setSaved(false);
            setError('Выберите ответ, который нужно сохранить');
            return;
        }

        setSaving(true);
        setError('');
        setSaved(false);
        try {
            await patchRecruiter(profile.id, body);
            setSaved(true);
            await onSaved?.();
        } catch (err) {
            setError(err?.message || 'Не удалось сохранить');
        } finally {
            setSaving(false);
        }
    };

    const firstName = profile?.firstName || 'Имя';
    const lastName = profile?.lastName || 'Фамилия';
    const company = profile?.companyName || 'Компания';

    return (
        <div className="studentProfileResume recruiterProfile">
            <div className="studentProfileResume__layout">
                <aside className="studentProfileResume__sidebar">
                    <header className="studentProfileResume__profileCard">
                        <div className="studentProfileResume__avatar" aria-hidden="true">
                            <span className="recruiterProfile__initials">{initialsOf(profile)}</span>
                        </div>
                        <div className="studentProfileResume__identity">
                            <h1 className="studentProfileResume__name">
                                <span>{firstName}</span>
                                <span>{lastName}</span>
                            </h1>
                        </div>
                        <div className="studentProfileResume__identity studentProfileResume__identity--specialty">
                            <p className="studentProfileResume__specialty">{company}</p>
                        </div>
                    </header>
                </aside>

                <main className="studentProfileResume__main">
                    <section className="studentProfileResume__about" aria-label="Профиль работодателя">
                        <div className="studentProfileResume__bio">
                            <div className="studentProfileResume__sectionHead">
                                <h2 className="studentProfileResume__sectionTitle">Контакты</h2>
                            </div>
                            <div className="studentProfileResume__infoText">
                                <p>Город: {textOrEmpty(profile?.city)}</p>
                                <p>Отчество: {textOrEmpty(profile?.middleName)}</p>
                                <p>Логин: {textOrEmpty(profile?.username)}</p>
                                <p>Почта: {textOrEmpty(profile?.email)}</p>
                                <p>Телефон: {textOrEmpty(profile?.phoneNumber)}</p>
                                <p>Telegram: {textOrEmpty(profile?.telegramUsername)}</p>
                            </div>
                        </div>

                        <div className="studentProfileResume__infoSkills">
                            <div className="studentProfileResume__infoBlock">
                                <h3 className="studentProfileResume__sectionTitle">Формат сотрудничества</h3>
                                <div className="recruiterProfile__choices" role="radiogroup" aria-label="Формат сотрудничества">
                                    {COOPERATION_OPTIONS.map((option) => (
                                        <label
                                            key={option.value}
                                            className={
                                                'recruiterProfile__choice'
                                                + (format === option.value ? ' is-selected' : '')
                                            }
                                        >
                                            <input
                                                type="radio"
                                                name="cooperationFormat"
                                                value={option.value}
                                                checked={format === option.value}
                                                onChange={() => setFormat(option.value)}
                                            />
                                            <span>{option.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="studentProfileResume__infoBlock">
                                <h3 className="studentProfileResume__sectionTitle">
                                    Готовы подать запрос на подбор студентов?
                                </h3>
                                <p className="recruiterProfile__hint">
                                    Мы свяжемся с Вами для уточнения деталей по заявке или поможем оформить ее
                                </p>
                                <div className="recruiterProfile__choices" role="radiogroup" aria-label="Готовность оставить заявку">
                                    {READY_OPTIONS.map((option) => (
                                        <label
                                            key={String(option.value)}
                                            className={
                                                'recruiterProfile__choice'
                                                + (ready === option.value ? ' is-selected' : '')
                                            }
                                        >
                                            <input
                                                type="radio"
                                                name="readyToRequestStudents"
                                                checked={ready === option.value}
                                                onChange={() => setReady(option.value)}
                                            />
                                            <span>{option.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {error ? (
                                <p className="accountPage__error recruiterProfile__note" role="alert">{error}</p>
                            ) : null}
                            {saved ? (
                                <p className="accountPage__ok recruiterProfile__note" role="status">Сохранено</p>
                            ) : null}
                            <button
                                type="button"
                                className="studentProfileResume__btn studentProfileResume__btn--primary recruiterProfile__save"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? 'Сохраняем…' : 'Сохранить'}
                            </button>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};

export default RecruiterProfile;
