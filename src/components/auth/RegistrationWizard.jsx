import React, { useEffect, useRef, useState } from 'react';
import { registerStudent, registerRecruiter } from '../../services/authApi.js';
import { completeStudentResumeOnboarding } from '../../services/onboardingApi.js';
import { getRegistrationSpecialities, catalogRows } from '../../services/registrationCatalogApi.js';
import { startPhoneVerification, getPhoneVerificationStatus } from '../../services/verificationApi.js';
import logo from '../../assets/logos/Logo.png';
import PhoneOtpConfirm from './PhoneOtpConfirm.jsx';
import { MIN_REGISTRATION_PASSWORD_LENGTH, validateRegistrationPassword } from '../../utils/passwordPolicy.js';
import './loginModal.css';

const ChevronLeftIcon = () => (
    <svg className="loginModal__backIcon" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
    </svg>
);

const TelegramPlaneIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
    </svg>
);

const COURSE_OPTIONS = [
    { value: 'FIRST', label: '1 курс' },
    { value: 'SECOND', label: '2 курс' },
    { value: 'THIRD', label: '3 курс' },
    { value: 'FOURTH', label: '4 курс' },
    { value: 'NEW', label: 'Выпускник / другое' },
];

const normalizePhone = (raw) => {
    const digits = String(raw || '').replace(/\D/g, '');
    if (!digits) return '';
    const normalized = digits.startsWith('8') && digits.length === 11 ? `7${digits.slice(1)}` : digits;
    return normalized.startsWith('7') || normalized.length > 10 ? `+${normalized}` : `+7${normalized}`;
};

const formatPhoneDisplay = (raw) => {
    const digits = String(raw || '').replace(/\D/g, '').replace(/^7|^8/, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    if (digits.length <= 8) return `${digits.slice(0, 3)} ${digits.slice(3, 6)}-${digits.slice(6)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
};

const buildDisplayName = (lastName, firstName, middleName, noMiddle) => {
    const parts = [lastName, firstName, noMiddle ? null : middleName].filter(Boolean).map((s) => s.trim()).filter(Boolean);
    return parts.join(' ') || undefined;
};

const usernameFromEmail = (email) => {
    const local = String(email || '').split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_');
    if (local.length >= 3) return local.slice(0, 64);
    return `user_${Date.now().toString(36).slice(-8)}`;
};

const Shell = ({ onBack, heading, subheading, step, children, footer }) => (
    <>
        <button type="button" className="loginModal__backBtn" onClick={onBack} aria-label="Назад">
            <ChevronLeftIcon />
        </button>
        <div className="loginModal__logoWrap">
            <img src={logo} alt="Резюме" className="loginModal__logo" />
        </div>
        <h2 className="loginModal__heading">{heading}</h2>
        {subheading ? <p className="loginModal__subheading">{subheading}</p> : null}
        {step ? <p className="loginModal__step">{step}</p> : null}
        {children}
        {footer}
    </>
);

const LegalFooter = () => (
    <p className="loginModal__legal">
        Нажимая «Дальше», вы принимаете <a href="/">политику конфиденциальности</a> и{' '}
        <a href="/">правила сервиса</a>
    </p>
);

const RegistrationWizard = ({ onClose, onSuccess, onLogin }) => {
    const [view, setView] = useState('choice');
    const [role, setRole] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [verification, setVerification] = useState(null);
    const pollRef = useRef(null);

    const [selectedRole, setSelectedRole] = useState('student');
    const [contactTab, setContactTab] = useState('phone');
    const [phoneLocal, setPhoneLocal] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [usernameManuallyEdited, setUsernameManuallyEdited] = useState(false);
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [noMiddleName, setNoMiddleName] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [city, setCity] = useState('');
    const [marketingConsent, setMarketingConsent] = useState(true);
    const [course, setCourse] = useState('');
    const [specialityId, setSpecialityId] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [specialities, setSpecialities] = useState([]);

    const stopPolling = () => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    };

    useEffect(() => () => stopPolling(), []);

    useEffect(() => {
        if (view !== 'student-education') return;
        (async () => {
            try {
                const res = await getRegistrationSpecialities(0, 100);
                setSpecialities(catalogRows(res));
            } catch (err) {
                setError(err.message || 'Не удалось загрузить направления');
            }
        })();
    }, [view]);

    const showError = (msg) => setError(msg);
    const clearError = () => setError('');

    const startPolling = (verificationId, onConfirmed, onExpired) => {
        stopPolling();
        pollRef.current = setInterval(async () => {
            try {
                const statusRes = await getPhoneVerificationStatus(verificationId);
                if (statusRes.status === 'CONFIRMED') {
                    stopPolling();
                    onConfirmed();
                } else if (statusRes.status === 'EXPIRED') {
                    stopPolling();
                    onExpired();
                }
            } catch (pollErr) {
                console.warn('poll verification', pollErr);
            }
        }, 2500);
    };

    const beginTelegramVerification = async () => {
        clearError();
        const phone = normalizePhone(phoneLocal);
        if (phone.replace(/\D/g, '').length < 11) {
            showError('Укажите корректный номер телефона');
            return;
        }
        setLoading(true);
        try {
            const res = await startPhoneVerification({ phoneNumber: phone });
            setVerification({ ...res, phoneNumber: phone, role });
            setView('telegram');
            startPolling(
                res.verificationId,
                () => setView('password'),
                () => {
                    showError('Время подтверждения истекло');
                    setView('contact');
                },
            );
        } catch (err) {
            showError(err.message || 'Не удалось начать подтверждение');
        } finally {
            setLoading(false);
        }
    };

    const handleContactNext = (e) => {
        e.preventDefault();
        if (contactTab === 'email') {
            showError('Подтверждение по почте появится позже — используйте телефон и Telegram');
            return;
        }
        beginTelegramVerification();
    };

    const openTelegramDirect = () => {
        clearError();
        if (contactTab === 'email') {
            showError('Вход через Telegram доступен после указания телефона');
            return;
        }
        beginTelegramVerification();
    };

    const validatePassword = (requireUsername) => {
        const passwordCheck = validateRegistrationPassword(password);
        if (!passwordCheck.ok) {
            showError(passwordCheck.message);
            return false;
        }
        if (password !== passwordConfirm) {
            showError('Пароли не совпадают');
            return false;
        }
        if (requireUsername && (!username.trim() || username.trim().length < 3)) {
            showError('Укажите логин (минимум 3 символа)');
            return false;
        }
        return true;
    };

    const validateUsername = () => {
        if (!username.trim() || username.trim().length < 3) {
            showError('Укажите логин (минимум 3 символа)');
            return false;
        }
        return true;
    };

    const syncUsernameFromEmail = (nextEmail, manuallyEdited = usernameManuallyEdited) => {
        if (!manuallyEdited) {
            setUsername(usernameFromEmail(nextEmail));
        }
    };

    const submitStudent = async () => {
        clearError();
        if (!verification?.verificationId) {
            showError('Подтвердите телефон в Telegram');
            return;
        }
        if (!email.trim()) {
            showError('Укажите email');
            return;
        }
        if (!specialityId) {
            showError('Выберите направление');
            return;
        }
        if (!birthDate) {
            showError('Укажите дату рождения');
            return;
        }
        if (!validateUsername()) {
            return;
        }
        const login = username.trim();
        setLoading(true);
        try {
            await registerStudent({
                username: login,
                password,
                passwordConfirm,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                middleName: noMiddleName ? undefined : middleName.trim() || undefined,
                phoneNumber: verification.phoneNumber,
                phoneVerificationId: verification.verificationId,
            });
            await completeStudentResumeOnboarding({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim(),
                birthDate,
                busyness: 'FREE',
                phoneNumber: verification.phoneNumber,
                specialityId: Number(specialityId),
                skillsIds: [],
            });
            stopPolling();
            setView('done-student');
        } catch (err) {
            showError(err.message || 'Не удалось зарегистрироваться');
        } finally {
            setLoading(false);
        }
    };

    const submitRecruiter = async () => {
        clearError();
        if (!verification?.verificationId) {
            showError('Подтвердите телефон в Telegram');
            return;
        }
        if (!companyName.trim()) {
            showError('Укажите название компании или ФИО');
            return;
        }
        if (!email.trim()) {
            showError('Укажите email');
            return;
        }
        setLoading(true);
        try {
            await registerRecruiter({
                username: username.trim(),
                password,
                passwordConfirm,
                name: buildDisplayName(lastName, firstName, middleName, noMiddleName),
                companyName: companyName.trim(),
                city: city.trim() || undefined,
                firstName: firstName.trim() || undefined,
                lastName: lastName.trim() || undefined,
                middleName: noMiddleName ? undefined : middleName.trim() || undefined,
                email: email.trim(),
                phoneNumber: verification.phoneNumber,
                phoneVerificationId: verification.verificationId,
                marketingConsent,
            });
            stopPolling();
            setView('done-recruiter');
        } catch (err) {
            showError(err.message || 'Не удалось отправить заявку');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        clearError();
        const map = {
            choice: onClose,
            contact: 'choice',
            telegram: 'contact',
            password: 'telegram',
            name: 'password',
            'student-email': 'name',
            'student-education': 'student-email',
            email: 'name',
            company: 'email',
            'done-student': onClose,
            'done-recruiter': onClose,
        };
        const next = map[view];
        if (typeof next === 'function') next();
        else setView(next);
    };

    const pickRole = (r) => setSelectedRole(r);

    const confirmRole = () => {
        clearError();
        setRole(selectedRole);
        setContactTab('phone');
        setView('contact');
    };

    const roleSubtitle = role === 'recruiter' ? 'Для поиска сотрудников' : 'Для поиска работы';
    const isStudent = role === 'student';

    if (loading && view !== 'telegram') {
        return (
            <div className="loginModal__card loginModal__card--loading" role="status">
                <div className="loginModal__logoWrap">
                    <img src={logo} alt="Резюме" className="loginModal__logo" />
                </div>
                <h2 className="loginModal__loadingTitle">Одну секунду…</h2>
                <p className="loginModal__loadingText">
                    Знаете ли вы, что все резюме наших студентов проходят проверку контроля качества? Мы тоже не знаем
                </p>
                <div className="loginModal__spinner" aria-hidden="true" />
            </div>
        );
    }

    return (
        <>
            <div className="loginModal__card">
                {view === 'choice' && (
                    <Shell onBack={onClose} heading="Регистрация" subheading="Кем вы являетесь?">
                        <div className="loginModal__roleList">
                            <button
                                type="button"
                                className={`loginModal__roleCard ${selectedRole === 'recruiter' ? 'loginModal__roleCard--active' : ''}`}
                                onClick={() => pickRole('recruiter')}
                            >
                                <span className="loginModal__roleCardIcon loginModal__roleCardIcon--employer" aria-hidden="true" />
                                <span className="loginModal__roleCardText">
                                    <strong>Работодатель</strong>
                                    <span>Я ищу сотрудников</span>
                                </span>
                            </button>
                            <button
                                type="button"
                                className={`loginModal__roleCard ${selectedRole === 'student' ? 'loginModal__roleCard--active' : ''}`}
                                onClick={() => pickRole('student')}
                            >
                                <span className="loginModal__roleCardIcon loginModal__roleCardIcon--student" aria-hidden="true" />
                                <span className="loginModal__roleCardText">
                                    <strong>Студент</strong>
                                    <span>Я хочу найти работу</span>
                                </span>
                            </button>
                        </div>
                        <button type="button" className="loginModal__primaryBtn" onClick={confirmRole}>
                            Зарегистрироваться
                        </button>
                        <button type="button" className="loginModal__textLink" onClick={onLogin}>
                            У меня уже есть аккаунт
                        </button>
                    </Shell>
                )}

                {view === 'contact' && (
                    <Shell onBack={handleBack} heading="Регистрация" subheading={roleSubtitle} footer={<LegalFooter />}>
                        <div className="loginModal__tabs" role="tablist">
                            <button
                                type="button"
                                role="tab"
                                aria-selected={contactTab === 'phone'}
                                className={`loginModal__tab ${contactTab === 'phone' ? 'loginModal__tab--active' : ''}`}
                                onClick={() => setContactTab('phone')}
                            >
                                Телефон
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={contactTab === 'email'}
                                className={`loginModal__tab ${contactTab === 'email' ? 'loginModal__tab--active' : ''}`}
                                onClick={() => setContactTab('email')}
                            >
                                Почта
                                <span className="loginModal__tabBadge">скоро</span>
                            </button>
                        </div>
                        <form onSubmit={handleContactNext} className="loginModal__form">
                            {contactTab === 'phone' ? (
                                <div className="loginModal__phoneRow">
                                    <div className="loginModal__phonePrefix">
                                        <span className="loginModal__phonePrefixFlag" aria-hidden="true">🇷🇺</span>
                                        +7
                                    </div>
                                    <input
                                        className="loginModal__phoneInput"
                                        type="tel"
                                        inputMode="tel"
                                        value={formatPhoneDisplay(phoneLocal)}
                                        onChange={(e) => setPhoneLocal(e.target.value.replace(/\D/g, ''))}
                                        required
                                        placeholder="952 312-94-90"
                                    />
                                </div>
                            ) : (
                                <div className="loginModal__emailRow">
                                    <div className="loginModal__emailIcon">✉</div>
                                    <input type="email" disabled placeholder="youremail@example.com" className="loginModal__phoneInput" />
                                </div>
                            )}
                            <button type="submit" className="loginModal__primaryBtn">
                                Дальше
                            </button>
                        </form>
                        <button type="button" className="loginModal__telegramBtn" onClick={openTelegramDirect}>
                            <span>Войти через Telegram</span>
                            <TelegramPlaneIcon />
                        </button>
                    </Shell>
                )}

                {view === 'telegram' && verification && (
                    <Shell
                        onBack={handleBack}
                        heading="Введите код из СМС"
                        subheading={`Для тестов введите код 7890 или подтвердите в Telegram @${verification.botUsername}, номер ${verification.phoneNumber}`}
                    >
                        <p className="loginModal__infoText loginModal__infoText--link">Подтверждение номера</p>
                        <PhoneOtpConfirm
                            verificationId={verification.verificationId}
                            onConfirmed={() => setView('password')}
                            onError={showError}
                        />
                        <div className="loginModal__telegramWait">
                            <div className="loginModal__spinner loginModal__spinner--inline" aria-hidden="true" />
                            <p className="loginModal__infoText">Или откройте Telegram-бота…</p>
                        </div>
                        <a
                            href={verification.botDeepLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="loginModal__primaryBtn loginModal__linkBtn"
                        >
                            Открыть Telegram
                        </a>
                        <button type="button" className="loginModal__ghostBtn" onClick={() => setView('contact')}>
                            Изменить номер
                        </button>
                    </Shell>
                )}

                {view === 'password' && (
                    <Shell
                        onBack={handleBack}
                        heading="Придумайте пароль"
                        subheading={`Пароль должен содержать минимум ${MIN_REGISTRATION_PASSWORD_LENGTH} символов, а также буквы и цифры`}
                    >
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                clearError();
                                if (!validatePassword(!isStudent)) return;
                                setView('name');
                            }}
                            className="loginModal__form"
                        >
                            {!isStudent && (
                                <div className="loginModal__inputGroup">
                                    <label>Логин</label>
                                    <input
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                                        required
                                        autoComplete="username"
                                        placeholder="latin_login"
                                    />
                                </div>
                            )}
                            <div className="loginModal__inputGroup">
                                <label>Пароль</label>
                                <div className="loginModal__inputWrap">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="new-password"
                                        className="loginModal__inputPassword"
                                    />
                                    <button
                                        type="button"
                                        className="loginModal__passwordToggle"
                                        onClick={() => setShowPassword((v) => !v)}
                                        aria-label="Показать пароль"
                                    >
                                        {showPassword ? '🙈' : '👁'}
                                    </button>
                                </div>
                            </div>
                            <div className="loginModal__inputGroup">
                                <label>Повторите пароль</label>
                                <div className="loginModal__inputWrap">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={passwordConfirm}
                                        onChange={(e) => setPasswordConfirm(e.target.value)}
                                        required
                                        autoComplete="new-password"
                                        className="loginModal__inputPassword"
                                    />
                                </div>
                            </div>
                            <button type="submit" className="loginModal__primaryBtn">
                                Дальше
                            </button>
                        </form>
                    </Shell>
                )}

                {view === 'name' && (
                    <Shell
                        onBack={handleBack}
                        heading="Как вас зовут"
                        subheading="Или того, кто будет пользоваться сервисом"
                        step="Шаг 1 из 3"
                    >
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                clearError();
                                if (!firstName.trim() || !lastName.trim()) {
                                    showError('Укажите имя и фамилию');
                                    return;
                                }
                                setView(isStudent ? 'student-email' : 'email');
                            }}
                            className="loginModal__form"
                        >
                            <div className="loginModal__inputGroup">
                                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="Имя" />
                            </div>
                            <div className="loginModal__inputGroup">
                                <input value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder="Фамилия" />
                            </div>
                            <div className="loginModal__inputGroup">
                                <input
                                    value={middleName}
                                    onChange={(e) => setMiddleName(e.target.value)}
                                    disabled={noMiddleName}
                                    placeholder="Отчество"
                                />
                            </div>
                            <label className="loginModal__checkbox">
                                <input
                                    type="checkbox"
                                    checked={noMiddleName}
                                    onChange={(e) => setNoMiddleName(e.target.checked)}
                                />
                                <span>У меня нет отчества</span>
                            </label>
                            <button type="submit" className="loginModal__primaryBtn">
                                Дальше
                            </button>
                        </form>
                    </Shell>
                )}

                {view === 'student-email' && isStudent && (
                    <Shell
                        onBack={handleBack}
                        heading="Ваш почтовый ящик"
                        subheading="Будут приходить отклики и другая полезная информация"
                        step="Шаг 2 из 3"
                    >
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                clearError();
                                if (!email.trim()) {
                                    showError('Укажите email');
                                    return;
                                }
                                if (!validateUsername()) {
                                    return;
                                }
                                setView('student-education');
                            }}
                            className="loginModal__form"
                        >
                            <div className="loginModal__emailRow">
                                <div className="loginModal__emailIcon">✉</div>
                                <input
                                    className="loginModal__phoneInput"
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        const nextEmail = e.target.value;
                                        setEmail(nextEmail);
                                        syncUsernameFromEmail(nextEmail);
                                    }}
                                    required
                                    placeholder="youremail@example.com"
                                />
                            </div>
                            <div className="loginModal__inputGroup">
                                <label>Логин для входа</label>
                                <input
                                    value={username}
                                    onChange={(e) => {
                                        setUsernameManuallyEdited(true);
                                        setUsername(e.target.value.replace(/\s/g, ''));
                                    }}
                                    required
                                    autoComplete="username"
                                    placeholder="latin_login"
                                />
                                <p className="loginModal__fieldHint">
                                    Заполняется автоматически из email — можно изменить. Этот логин понадобится для входа.
                                </p>
                            </div>
                            <button type="submit" className="loginModal__primaryBtn">
                                Дальше
                            </button>
                        </form>
                    </Shell>
                )}

                {view === 'student-education' && isStudent && (
                    <Shell
                        onBack={handleBack}
                        heading="На каком вы курсе"
                        subheading="Если вы студент колледжа"
                        step="Шаг 3 из 3"
                    >
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                submitStudent();
                            }}
                            className="loginModal__form"
                        >
                            <div className="loginModal__inputGroup">
                                <select
                                    className="loginModal__select"
                                    value={course}
                                    onChange={(e) => setCourse(e.target.value)}
                                    required
                                >
                                    <option value="">Выберите свой курс</option>
                                    {COURSE_OPTIONS.map((c) => (
                                        <option key={c.value} value={c.value}>
                                            {c.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="loginModal__inputGroup">
                                <select
                                    className="loginModal__select"
                                    value={specialityId}
                                    onChange={(e) => setSpecialityId(e.target.value)}
                                    required
                                >
                                    <option value="">Текущее направление</option>
                                    {specialities.map((s) => (
                                        <option key={s.id} value={String(s.id)}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="loginModal__inputGroup">
                                <input
                                    type="date"
                                    className="loginModal__inputDate"
                                    value={birthDate}
                                    onChange={(e) => setBirthDate(e.target.value)}
                                    required
                                    placeholder="Дата рождения"
                                />
                            </div>
                            <button type="submit" className="loginModal__primaryBtn">
                                Зарегистрироваться
                            </button>
                        </form>
                    </Shell>
                )}

                {view === 'email' && !isStudent && (
                    <Shell
                        onBack={handleBack}
                        heading="Ваш почтовый ящик"
                        subheading="Будут приходить отклики и другая полезная информация"
                        step="Шаг 2 из 3"
                    >
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                clearError();
                                if (!email.trim()) {
                                    showError('Укажите email');
                                    return;
                                }
                                setView('company');
                            }}
                            className="loginModal__form"
                        >
                            <div className="loginModal__emailRow">
                                <div className="loginModal__emailIcon">✉</div>
                                <input
                                    className="loginModal__phoneInput"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="youremail@example.com"
                                />
                            </div>
                            <button type="submit" className="loginModal__primaryBtn">
                                Дальше
                            </button>
                        </form>
                    </Shell>
                )}

                {view === 'company' && !isStudent && (
                    <Shell
                        onBack={handleBack}
                        heading="Ваша компания"
                        subheading="Если нет компании или вы ИП, можете указать ФИО"
                        step="Шаг 3 из 3"
                    >
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                submitRecruiter();
                            }}
                            className="loginModal__form"
                        >
                            <div className="loginModal__inputGroup">
                                <input
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    required
                                    placeholder="Официальное название"
                                />
                            </div>
                            <div className="loginModal__inputGroup">
                                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Город" />
                            </div>
                            <label className="loginModal__checkbox">
                                <input
                                    type="checkbox"
                                    checked={marketingConsent}
                                    onChange={(e) => setMarketingConsent(e.target.checked)}
                                />
                                <span>Пишите, когда появится специальное предложение или совет</span>
                            </label>
                            <button type="submit" className="loginModal__primaryBtn">
                                Зарегистрироваться
                            </button>
                        </form>
                    </Shell>
                )}

                {view === 'done-student' && (
                    <Shell onBack={onClose} heading="Аккаунт создан">
                        <div className="loginModal__infoBlock">
                            <p>
                                Профиль создан. Для входа используйте логин <strong>{username.trim()}</strong> и пароль,
                                который вы задали при регистрации.
                            </p>
                            <p>После модерации карточка появится у работодателей.</p>
                            <button type="button" className="loginModal__primaryBtn" onClick={onSuccess}>
                                Продолжить
                            </button>
                        </div>
                    </Shell>
                )}

                {view === 'done-recruiter' && (
                    <Shell onBack={onClose} heading="Заявка отправлена">
                        <div className="loginModal__infoBlock">
                            <p>Вход будет доступен после одобрения администратором.</p>
                            <button type="button" className="loginModal__primaryBtn" onClick={onLogin}>
                                Понятно
                            </button>
                        </div>
                    </Shell>
                )}
            </div>

            {error ? (
                <div className="loginModal__toast" role="alert">
                    {error}
                    <button type="button" className="loginModal__toastClose" onClick={clearError} aria-label="Закрыть">
                        ×
                    </button>
                </div>
            ) : null}
        </>
    );
};

export default RegistrationWizard;
