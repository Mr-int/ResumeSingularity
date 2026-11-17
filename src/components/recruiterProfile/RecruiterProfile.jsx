import { useEffect, useRef, useState } from 'react';
import { patchRecruiter, uploadRecruiterPhoto } from '../../services/accountApi.js';
import { filterCityNames } from '../../services/getApi.js';
import { getImageUrl } from '../../config/api.js';
import { formatRuPhoneInput } from '../../utils/registrationIdentity.js';
import CitySelect from '../resumeCreator/StepForm/CitySelect/CitySelect.jsx';
import '../studentProfileResume/studentProfileResume.css';
import './recruiterProfile.css';

const COOPERATION_OPTIONS = [
    { value: 'SEMESTER_PROJECT', label: 'Проектная активность на семестр (может не оплачиваться)' },
    { value: 'SUMMER_PRACTICE', label: 'Летняя профессиональная практика (может не оплачиваться)' },
    { value: 'INTERNSHIP', label: 'Стажировка (оплачивается, оформление по СМЗ/ИП)' },
    { value: 'VACANCY', label: 'Вакансия (оплачивается, оформление по ТК РФ)' },
    { value: 'OTHER', label: 'Другое' },
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

const readyFromProfile = (value) => (value === true || value === false ? value : null);

const sameText = (left, right) => String(left ?? '').trim() === String(right ?? '').trim();

const RecruiterProfile = ({ profile, onSaved }) => {
    const [open, setOpen] = useState(false);
    const [firstName, setFirstName] = useState(profile?.firstName || '');
    const [lastName, setLastName] = useState(profile?.lastName || '');
    const [middleName, setMiddleName] = useState(profile?.middleName || '');
    const [companyName, setCompanyName] = useState(profile?.companyName || '');
    const [city, setCity] = useState(profile?.city || '');
    const [email, setEmail] = useState(profile?.email || '');
    const [phoneNumber, setPhoneNumber] = useState(() => formatRuPhoneInput(profile?.phoneNumber || ''));
    const [cityOptions, setCityOptions] = useState([]);
    const photoInputRef = useRef(null);
    const [telegramUsername, setTelegramUsername] = useState(profile?.telegramUsername || '');
    const [format, setFormat] = useState(profile?.cooperationFormat || '');
    const [ready, setReady] = useState(() => readyFromProfile(profile?.readyToRequestStudents));
    const [photoFile, setPhotoFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setFirstName(profile?.firstName || '');
        setLastName(profile?.lastName || '');
        setMiddleName(profile?.middleName || '');
        setCompanyName(profile?.companyName || '');
        setCity(profile?.city || '');
        setEmail(profile?.email || '');
        setPhoneNumber(formatRuPhoneInput(profile?.phoneNumber || ''));
        setTelegramUsername(profile?.telegramUsername || '');
        setFormat(profile?.cooperationFormat || '');
        setReady(readyFromProfile(profile?.readyToRequestStudents));
        setPhotoFile(null);
    }, [profile]);

    useEffect(() => {
        let cancelled = false;
        filterCityNames()
            .then((names) => {
                if (!cancelled) setCityOptions(names);
            })
            .catch(() => {
                if (!cancelled) setCityOptions([]);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const handleSave = async () => {
        const body = {};
        if (!sameText(firstName, profile?.firstName) && firstName.trim()) body.firstName = firstName.trim();
        if (!sameText(lastName, profile?.lastName) && lastName.trim()) body.lastName = lastName.trim();
        if (!sameText(middleName, profile?.middleName) && middleName.trim()) body.middleName = middleName.trim();
        if (!sameText(companyName, profile?.companyName) && companyName.trim()) body.companyName = companyName.trim();
        if (!sameText(city, profile?.city) && city.trim()) body.city = city.trim();
        if (!sameText(email, profile?.email) && email.trim()) body.email = email.trim();
        const savedPhone = formatRuPhoneInput(profile?.phoneNumber || '');
        if (!sameText(phoneNumber, savedPhone) && phoneNumber.trim()) body.phoneNumber = phoneNumber.trim();
        if (!sameText(telegramUsername, profile?.telegramUsername) && telegramUsername.trim()) {
            body.telegramUsername = telegramUsername.trim();
        }
        if (format && format !== profile?.cooperationFormat) body.cooperationFormat = format;
        const savedReady = readyFromProfile(profile?.readyToRequestStudents);
        if ((ready === true || ready === false) && ready !== savedReady) body.readyToRequestStudents = ready;

        if (Object.keys(body).length === 0 && !photoFile) {
            setSaved(false);
            setError('Нет изменений для сохранения');
            return;
        }

        setSaving(true);
        setError('');
        setSaved(false);
        try {
            if (Object.keys(body).length > 0) {
                await patchRecruiter(profile.id, body);
            }
            if (photoFile) {
                await uploadRecruiterPhoto(profile.id, photoFile);
            }
            setSaved(true);
            await onSaved?.();
        } catch (err) {
            setError(err?.message || 'Не удалось сохранить');
        } finally {
            setSaving(false);
        }
    };

    const photoUrl = profile?.imagePath ? getImageUrl(profile.imagePath) : '';
    const shownFirst = profile?.firstName || 'Имя';
    const shownLast = profile?.lastName || 'Фамилия';
    const company = profile?.companyName || 'Компания';

    return (
        <div className="studentProfileResume recruiterProfile">
            <div className="studentProfileResume__layout">
                <aside className="studentProfileResume__sidebar">
                    <header className="studentProfileResume__profileCard">
                        <div className="studentProfileResume__avatar">
                            {photoUrl ? (
                                <img src={photoUrl} alt="" className="studentProfileResume__avatarImg" />
                            ) : (
                                <span className="recruiterProfile__initials">{initialsOf(profile)}</span>
                            )}
                        </div>
                        <div className="studentProfileResume__identity">
                            <h1 className="studentProfileResume__name">
                                <span>{shownFirst}</span>
                                <span>{shownLast}</span>
                            </h1>
                        </div>
                        <div className="studentProfileResume__identity studentProfileResume__identity--specialty">
                            <p className="studentProfileResume__specialty">{company}</p>
                        </div>
                    </header>
                </aside>

                <main className="studentProfileResume__main">
                    <section className="recruiterProfile__panel" aria-label="Профиль работодателя">
                        <button
                            type="button"
                            className="recruiterProfile__toggle"
                            aria-expanded={open}
                            onClick={() => setOpen((prev) => !prev)}
                        >
                            <span>Анкета работодателя</span>
                            <span className={`recruiterProfile__chevron${open ? ' is-open' : ''}`} aria-hidden="true" />
                        </button>

                        {open ? (
                            <div className="recruiterProfile__body">
                                <div className="recruiterProfile__field">
                                    <span>Фото</span>
                                    <button
                                        type="button"
                                        className="recruiterProfile__drop"
                                        onClick={() => photoInputRef.current?.click()}
                                    >
                                        <span className="recruiterProfile__dropTitle">
                                            {photoFile ? photoFile.name : 'Нажмите, чтобы выбрать фото'}
                                        </span>
                                        <span className="recruiterProfile__dropHint">JPG или PNG</span>
                                    </button>
                                    <input
                                        ref={photoInputRef}
                                        className="recruiterProfile__file"
                                        type="file"
                                        accept="image/*"
                                        onChange={(event) => setPhotoFile(event.target.files?.[0] || null)}
                                    />
                                </div>
                                <div className="recruiterProfile__grid">
                                    <label className="recruiterProfile__field">
                                        <span>Имя</span>
                                        <input
                                            value={firstName}
                                            placeholder="Иван"
                                            onChange={(e) => setFirstName(e.target.value)}
                                        />
                                    </label>
                                    <label className="recruiterProfile__field">
                                        <span>Фамилия</span>
                                        <input
                                            value={lastName}
                                            placeholder="Иванов"
                                            onChange={(e) => setLastName(e.target.value)}
                                        />
                                    </label>
                                </div>
                                <label className="recruiterProfile__field">
                                    <span>Отчество</span>
                                    <input
                                        value={middleName}
                                        placeholder="Иванович"
                                        onChange={(e) => setMiddleName(e.target.value)}
                                    />
                                </label>
                                <label className="recruiterProfile__field">
                                    <span>Компания</span>
                                    <input
                                        value={companyName}
                                        placeholder="Название компании"
                                        onChange={(e) => setCompanyName(e.target.value)}
                                    />
                                </label>
                                <div className="recruiterProfile__field">
                                    <span>Город</span>
                                    <CitySelect
                                        id="recruiter-city"
                                        value={city}
                                        options={cityOptions}
                                        placeholder="Выберите город"
                                        onChange={setCity}
                                    />
                                </div>
                                <label className="recruiterProfile__field">
                                    <span>Логин</span>
                                    <input value={textOrEmpty(profile?.username)} readOnly />
                                </label>
                                <label className="recruiterProfile__field">
                                    <span>Почта</span>
                                    <input
                                        type="email"
                                        value={email}
                                        placeholder="name@company.ru"
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </label>
                                <div className="recruiterProfile__grid">
                                    <label className="recruiterProfile__field">
                                        <span>Телефон</span>
                                        <input
                                            type="tel"
                                            inputMode="tel"
                                            value={phoneNumber}
                                            placeholder="+7"
                                            onChange={(e) => setPhoneNumber(formatRuPhoneInput(e.target.value))}
                                        />
                                    </label>
                                    <label className="recruiterProfile__field">
                                        <span>Telegram</span>
                                        <input
                                            value={telegramUsername}
                                            placeholder="@username"
                                            onChange={(e) => setTelegramUsername(e.target.value)}
                                        />
                                    </label>
                                </div>

                                <h3 className="recruiterProfile__subtitle">Формат сотрудничества</h3>
                                <div className="recruiterProfile__choices" role="radiogroup" aria-label="Формат сотрудничества">
                                    {COOPERATION_OPTIONS.map((option) => (
                                        <label
                                            key={option.value}
                                            className={`recruiterProfile__choice${format === option.value ? ' is-selected' : ''}`}
                                        >
                                            <input
                                                className="recruiterProfile__radio"
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

                                <h3 className="recruiterProfile__subtitle">Готовы подать запрос на подбор студентов?</h3>
                                <p className="recruiterProfile__hint">
                                    Мы свяжемся с Вами для уточнения деталей по заявке или поможем оформить ее
                                </p>
                                <div className="recruiterProfile__choices" role="radiogroup" aria-label="Готовность оставить заявку">
                                    {READY_OPTIONS.map((option) => (
                                        <label
                                            key={String(option.value)}
                                            className={`recruiterProfile__choice${ready === option.value ? ' is-selected' : ''}`}
                                        >
                                            <input
                                                className="recruiterProfile__radio"
                                                type="radio"
                                                name="readyToRequestStudents"
                                                checked={ready === option.value}
                                                onChange={() => setReady(option.value)}
                                            />
                                            <span>{option.label}</span>
                                        </label>
                                    ))}
                                </div>

                                {error ? <p className="accountPage__error recruiterProfile__note" role="alert">{error}</p> : null}
                                {saved ? <p className="accountPage__ok recruiterProfile__note" role="status">Сохранено</p> : null}
                                <button
                                    type="button"
                                    className="recruiterProfile__save"
                                    onClick={handleSave}
                                    disabled={saving}
                                >
                                    {saving ? 'Сохраняем…' : 'Сохранить'}
                                </button>
                            </div>
                        ) : null}
                    </section>
                </main>
            </div>
        </div>
    );
};

export default RecruiterProfile;
