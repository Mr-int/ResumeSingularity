import { useEffect, useRef, useState } from 'react';
import { patchRecruiter, uploadRecruiterPhoto } from '../../services/accountApi.js';
import { filterCityNames } from '../../services/getApi.js';
import { getImageUrl } from '../../config/api.js';
import { formatRuPhoneInput, normalizePhoneNumber } from '../../utils/registrationIdentity.js';
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

const NAME_RE = /^[a-zA-Zа-яёА-ЯЁ']+(?:[ -][a-zA-Zа-яёА-ЯЁ']+)*$/;
const TG_RE = /^@?[a-zA-Z0-9_]{5,32}$/;
const TG_NAME_MAX = 32;
const COMPANY_MAX = 100;
const PHOTO_TYPES = ['image/jpeg', 'image/png'];
const PHOTO_MAX_BYTES = 5 * 1024 * 1024;

const sanitizeTelegram = (raw) => {
    const value = String(raw ?? '').replace(/[^a-zA-Z0-9_@]/g, '');
    const name = value.replace(/@/g, '').slice(0, TG_NAME_MAX);
    return value.startsWith('@') || name ? `@${name}` : '';
};

/** Формат проверяем только у изменённого поля: при регистрации ФИО проверялось лишь на пустоту. */
const nameError = (value, saved, label, required) => {
    const text = String(value ?? '').trim();
    if (!text) return required ? `Укажите ${label}` : '';
    if (sameText(value, saved)) return '';
    if (text.length < 2 || text.length > 50) return 'От 2 до 50 символов';
    if (!NAME_RE.test(text)) return 'Только буквы, пробел, дефис и апостроф';
    return '';
};

/** Маска оставляет «+7» и «@» в пустом поле — это не ввод. */
const hasPhoneDigits = (value) => String(value ?? '').replace(/\D/g, '').length > 1;
const hasTelegramName = (value) => String(value ?? '').replace(/@/g, '').trim().length > 0;

const photoError = (file) => {
    if (!file) return '';
    if (!PHOTO_TYPES.includes(file.type)) return 'Только JPG или PNG';
    if (file.size > PHOTO_MAX_BYTES) return 'Файл больше 5 МБ';
    return '';
};

const RecruiterProfile = ({ profile, onSaved }) => {
    const [open, setOpen] = useState(false);
    const [firstName, setFirstName] = useState(profile?.firstName || '');
    const [lastName, setLastName] = useState(profile?.lastName || '');
    const [middleName, setMiddleName] = useState(profile?.middleName || '');
    const [companyName, setCompanyName] = useState(profile?.companyName || '');
    const [city, setCity] = useState(profile?.city || '');
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
    const [fieldErrors, setFieldErrors] = useState({});
    const focusErrorRef = useRef(false);

    useEffect(() => {
        setFirstName(profile?.firstName || '');
        setLastName(profile?.lastName || '');
        setMiddleName(profile?.middleName || '');
        setCompanyName(profile?.companyName || '');
        setCity(profile?.city || '');
        setPhoneNumber(formatRuPhoneInput(profile?.phoneNumber || ''));
        setTelegramUsername(profile?.telegramUsername || '');
        setFormat(profile?.cooperationFormat || '');
        setReady(readyFromProfile(profile?.readyToRequestStudents));
        setPhotoFile(null);
        setFieldErrors({});
    }, [profile]);

    useEffect(() => {
        if (!focusErrorRef.current || !open) return;
        focusErrorRef.current = false;
        const firstKey = Object.keys(fieldErrors)[0];
        if (firstKey) document.getElementById(`recruiter-${firstKey}`)?.focus();
    }, [fieldErrors, open]);

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

    const clearFieldError = (key) => {
        setFieldErrors((prev) => {
            if (!prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const validate = () => {
        const company = companyName.trim();
        const telegram = telegramUsername.trim();
        const errors = {
            photo: photoError(photoFile),
            firstName: nameError(firstName, profile?.firstName, 'имя', true),
            lastName: nameError(lastName, profile?.lastName, 'фамилию', true),
            middleName: nameError(middleName, profile?.middleName, 'отчество', false),
            companyName: !company
                ? 'Укажите компанию'
                : !sameText(companyName, profile?.companyName) && company.length > COMPANY_MAX
                    ? `Не длиннее ${COMPANY_MAX} символов`
                    : '',
            city: city.trim() ? '' : 'Выберите город',
            phoneNumber: hasPhoneDigits(phoneNumber) && !normalizePhoneNumber(phoneNumber)
                ? 'Формат +79991234567'
                : '',
            telegramUsername: hasTelegramName(telegram) && !TG_RE.test(telegram)
                ? 'От 5 до 32 символов: латиница, цифры, _'
                : '',
        };
        return Object.fromEntries(Object.entries(errors).filter(([, message]) => message));
    };

    const handleSave = async () => {
        const errors = validate();
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
            focusErrorRef.current = true;
            setOpen(true);
            setError('');
            setSaved(false);
            return;
        }

        const body = {};
        if (!sameText(firstName, profile?.firstName) && firstName.trim()) body.firstName = firstName.trim();
        if (!sameText(lastName, profile?.lastName) && lastName.trim()) body.lastName = lastName.trim();
        if (!sameText(middleName, profile?.middleName) && middleName.trim()) body.middleName = middleName.trim();
        if (!sameText(companyName, profile?.companyName) && companyName.trim()) body.companyName = companyName.trim();
        if (!sameText(city, profile?.city) && city.trim()) body.city = city.trim();
        const savedPhone = formatRuPhoneInput(profile?.phoneNumber || '');
        if (!sameText(phoneNumber, savedPhone) && hasPhoneDigits(phoneNumber)) {
            body.phoneNumber = normalizePhoneNumber(phoneNumber);
        }
        if (!sameText(telegramUsername, profile?.telegramUsername) && hasTelegramName(telegramUsername)) {
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

    const handlePhotoChange = (event) => {
        const file = event.target.files?.[0] || null;
        setPhotoFile(file);
        const message = photoError(file);
        setFieldErrors((prev) => {
            const next = { ...prev };
            if (message) next.photo = message;
            else delete next.photo;
            return next;
        });
    };

    const fieldClass = (key) =>
        `recruiterProfile__field${fieldErrors[key] ? ' recruiterProfile__field--error' : ''}`;

    const errorProps = (key) => (fieldErrors[key]
        ? { 'aria-invalid': true, 'aria-describedby': `recruiter-${key}-error` }
        : {});

    const renderError = (key) => (fieldErrors[key] ? (
        <span id={`recruiter-${key}-error`} className="recruiterProfile__fieldError">
            {fieldErrors[key]}
        </span>
    ) : null);

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
                                <div className={fieldClass('photo')}>
                                    <span>Фото</span>
                                    <button
                                        id="recruiter-photo"
                                        type="button"
                                        className="recruiterProfile__drop"
                                        onClick={() => photoInputRef.current?.click()}
                                        {...errorProps('photo')}
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
                                        accept="image/jpeg,image/png"
                                        onChange={handlePhotoChange}
                                    />
                                    {renderError('photo')}
                                </div>
                                <div className="recruiterProfile__grid">
                                    <label className={fieldClass('firstName')}>
                                        <span>Имя</span>
                                        <input
                                            id="recruiter-firstName"
                                            value={firstName}
                                            placeholder="Иван"
                                            onChange={(e) => {
                                                setFirstName(e.target.value);
                                                clearFieldError('firstName');
                                            }}
                                            {...errorProps('firstName')}
                                        />
                                        {renderError('firstName')}
                                    </label>
                                    <label className={fieldClass('lastName')}>
                                        <span>Фамилия</span>
                                        <input
                                            id="recruiter-lastName"
                                            value={lastName}
                                            placeholder="Иванов"
                                            onChange={(e) => {
                                                setLastName(e.target.value);
                                                clearFieldError('lastName');
                                            }}
                                            {...errorProps('lastName')}
                                        />
                                        {renderError('lastName')}
                                    </label>
                                </div>
                                <label className={fieldClass('middleName')}>
                                    <span>Отчество</span>
                                    <input
                                        id="recruiter-middleName"
                                        value={middleName}
                                        placeholder="Иванович"
                                        onChange={(e) => {
                                            setMiddleName(e.target.value);
                                            clearFieldError('middleName');
                                        }}
                                        {...errorProps('middleName')}
                                    />
                                    {renderError('middleName')}
                                </label>
                                <label className={fieldClass('companyName')}>
                                    <span>Компания</span>
                                    <input
                                        id="recruiter-companyName"
                                        value={companyName}
                                        placeholder="Название компании"
                                        onChange={(e) => {
                                            setCompanyName(e.target.value);
                                            clearFieldError('companyName');
                                        }}
                                        {...errorProps('companyName')}
                                    />
                                    {renderError('companyName')}
                                </label>
                                <div className={fieldClass('city')}>
                                    <span>Город</span>
                                    <CitySelect
                                        id="recruiter-city"
                                        value={city}
                                        options={cityOptions}
                                        placeholder="Выберите город"
                                        onChange={(value) => {
                                            setCity(value);
                                            clearFieldError('city');
                                        }}
                                    />
                                    {renderError('city')}
                                </div>
                                <label className="recruiterProfile__field">
                                    <span>Логин</span>
                                    <input value={textOrEmpty(profile?.username)} readOnly />
                                </label>
                                <label className="recruiterProfile__field">
                                    <span>Почта</span>
                                    <input type="email" value={textOrEmpty(profile?.email)} readOnly />
                                </label>
                                <div className="recruiterProfile__grid">
                                    <label className={fieldClass('phoneNumber')}>
                                        <span>Телефон</span>
                                        <input
                                            id="recruiter-phoneNumber"
                                            type="tel"
                                            inputMode="tel"
                                            value={phoneNumber}
                                            placeholder="+7"
                                            onChange={(e) => {
                                                setPhoneNumber(formatRuPhoneInput(e.target.value));
                                                clearFieldError('phoneNumber');
                                            }}
                                            {...errorProps('phoneNumber')}
                                        />
                                        {renderError('phoneNumber')}
                                    </label>
                                    <label className={fieldClass('telegramUsername')}>
                                        <span>Telegram</span>
                                        <input
                                            id="recruiter-telegramUsername"
                                            value={telegramUsername}
                                            placeholder="@username"
                                            onChange={(e) => {
                                                setTelegramUsername(sanitizeTelegram(e.target.value));
                                                clearFieldError('telegramUsername');
                                            }}
                                            {...errorProps('telegramUsername')}
                                        />
                                        {renderError('telegramUsername')}
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
