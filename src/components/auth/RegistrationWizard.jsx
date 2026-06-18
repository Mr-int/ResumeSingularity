import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerStudent, registerRecruiter, notifyAuthChanged } from '../../services/authApi.js';
import {
    startPhoneVerification,
    getPhoneVerificationStatus,
    isValidVerificationEmail,
    isVerificationMailDeliveryError,
} from '../../services/verificationApi.js';
import logo from '../../assets/logos/Logo.png';
import PhoneOtpConfirm from './PhoneOtpConfirm.jsx';
import { MIN_REGISTRATION_PASSWORD_LENGTH, validateRegistrationPassword } from '../../utils/passwordPolicy.js';
import { normalizePhone, formatPhoneDisplay } from '../../utils/phoneFormat.js';
import {
    buildRecruiterRegistrationBody,
    validateRegistrationUsername,
} from '../../utils/registrationValidation.js';
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
    const navigate = useNavigate();
    const [view, setView] = useState('choice');
    const [role, setRole] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [verification, setVerification] = useState(null);
    const pollRef = useRef(null);

    const [selectedRole, setSelectedRole] = useState('student');
    const [phoneLocal, setPhoneLocal] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [recruiterCompany, setRecruiterCompany] = useState('');
    const [recruiterFirstName, setRecruiterFirstName] = useState('');
    const [recruiterLastName, setRecruiterLastName] = useState('');
    const [recruiterEmail, setRecruiterEmail] = useState('');
    const [recruiterCity, setRecruiterCity] = useState('');

    const stopPolling = () => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    };

    useEffect(() => () => stopPolling(), []);

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

    const beginVerification = async ({ phoneNumber, email }) => {
        clearError();
        const phone = normalizePhone(phoneNumber);
        if (phone.replace(/\D/g, '').length < 11) {
            showError('Укажите корректный номер телефона');
            return;
        }
        const emailTrim = String(email || '').trim();
        if (!emailTrim) {
            showError('Укажите email');
            return;
        }
        if (!isValidVerificationEmail(emailTrim)) {
            showError('Укажите корректный email');
            return;
        }
        setLoading(true);
        try {
            let res;
            let effectiveChannel = 'email';
            try {
                res = await startPhoneVerification({
                    phoneNumber: phone,
                    email: emailTrim,
                });
            } catch (err) {
                if (isVerificationMailDeliveryError(err)) {
                    res = await startPhoneVerification({ phoneNumber: phone });
                    effectiveChannel = 'phone';
                    showError(
                        'Сейчас не удаётся отправить код на почту. Подтвердите номер в Telegram — регистрацию можно продолжить.',
                    );
                } else {
                    throw err;
                }
            }
            setVerification({
                ...res,
                phoneNumber: phone,
                email: emailTrim,
                channel: effectiveChannel,
                role,
            });
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
        beginVerification({ phoneNumber: phoneLocal, email });
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
        if (requireUsername) {
            const usernameCheck = validateRegistrationUsername(username);
            if (!usernameCheck.ok) {
                showError(usernameCheck.message);
                return false;
            }
        }
        return true;
    };

    const submitRegistration = async () => {
        clearError();
        if (!verification?.verificationId) {
            showError('Подтвердите телефон в Telegram');
            return;
        }
        if (!validatePassword(true)) {
            return;
        }
        const login = username.trim();
        setLoading(true);
        try {
            const statusRes = await getPhoneVerificationStatus(verification.verificationId);
            if (statusRes.status !== 'CONFIRMED') {
                const expired = statusRes.status === 'EXPIRED';
                showError(
                    expired
                        ? 'Время подтверждения телефона истекло. Подтвердите номер заново.'
                        : 'Сначала подтвердите номер в Telegram.',
                );
                if (expired) {
                    setView('contact');
                }
                return;
            }
            if (isStudent) {
                await registerStudent({
                    username: login,
                    password,
                    passwordConfirm,
                    phoneNumber: verification.phoneNumber,
                    phoneVerificationId: verification.verificationId,
                });
                stopPolling();
                setView('done-student');
            } else {
                await registerRecruiter(
                    buildRecruiterRegistrationBody({
                        username: login,
                        password,
                        passwordConfirm,
                        phoneNumber: verification.phoneNumber,
                        phoneVerificationId: verification.verificationId,
                        companyName: recruiterCompany,
                        firstName: recruiterFirstName,
                        lastName: recruiterLastName,
                        email: recruiterEmail,
                        city: recruiterCity,
                    }),
                );
                stopPolling();
                setView('done-recruiter');
            }
        } catch (err) {
            showError(err.message || 'Не удалось зарегистрироваться');
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
            'recruiter-profile': 'password',
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
                        <form onSubmit={handleContactNext} className="loginModal__form">
                            <div className="loginModal__emailRow">
                                <div className="loginModal__emailIcon">✉</div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value.replace(/\s/g, ''))}
                                    placeholder="youremail@example.com"
                                    className="loginModal__phoneInput"
                                    required
                                    autoComplete="email"
                                />
                            </div>
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
                                    aria-label="Номер телефона для аккаунта"
                                />
                            </div>
                            <p className="loginModal__fieldHint">
                                Код придёт на почту. Номер телефона нужен для аккаунта.
                            </p>
                            <button type="submit" className="loginModal__primaryBtn">
                                Дальше
                            </button>
                        </form>
                    </Shell>
                )}

                {view === 'telegram' && verification && (
                    <Shell
                        onBack={handleBack}
                        heading={
                            verification.channel === 'email'
                                ? 'Введите код из письма'
                                : 'Подтвердите номер в Telegram'
                        }
                        subheading={
                            verification.channel === 'email'
                                ? `Мы отправили код на ${verification.email}. Номер аккаунта: ${verification.phoneNumber}`
                                : `Откройте бота @${verification.botUsername} и подтвердите номер ${verification.phoneNumber}. СМС не отправляем.`
                        }
                    >
                        <p className="loginModal__infoText loginModal__infoText--link">
                            {verification.channel === 'email' ? 'Подтверждение по почте' : 'Подтверждение через Telegram'}
                        </p>
                        {verification.channel === 'email' ? (
                            <PhoneOtpConfirm
                                verificationId={verification.verificationId}
                                onConfirmed={() => setView('password')}
                                onError={showError}
                            />
                        ) : null}
                        {verification.channel === 'email' ? (
                            <p className="loginModal__infoText">
                                Не пришло письмо? Проверьте «Спам» или подтвердите номер через Telegram.
                            </p>
                        ) : (
                            <div className="loginModal__telegramWait">
                                <div className="loginModal__spinner loginModal__spinner--inline" aria-hidden="true" />
                                <p className="loginModal__infoText">Ожидаем подтверждение в Telegram…</p>
                            </div>
                        )}
                        <a
                            href={verification.botDeepLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="loginModal__primaryBtn loginModal__linkBtn"
                        >
                            {verification.channel === 'email' ? 'Подтвердить в Telegram' : 'Открыть Telegram'}
                        </a>
                        <button type="button" className="loginModal__ghostBtn" onClick={() => setView('contact')}>
                            {verification.channel === 'email' ? 'Изменить почту' : 'Изменить номер'}
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
                                if (!validatePassword(true)) return;
                                if (isStudent) {
                                    submitRegistration();
                                } else {
                                    if (!recruiterEmail.trim() && verification?.email) {
                                        setRecruiterEmail(verification.email);
                                    }
                                    setView('recruiter-profile');
                                }
                            }}
                            className="loginModal__form"
                        >
                            <div className="loginModal__inputGroup">
                                <label>Логин</label>
                                <input
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                                    required
                                    autoComplete="username"
                                    placeholder="latin_login"
                                />
                                <p className="loginModal__fieldHint">
                                    Латинские буквы и цифры. Этот логин понадобится для входа.
                                </p>
                            </div>
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
                            <button type="submit" className="loginModal__primaryBtn" disabled={loading}>
                                {isStudent ? 'Зарегистрироваться' : 'Дальше'}
                            </button>
                        </form>
                    </Shell>
                )}

                {view === 'recruiter-profile' && (
                    <Shell
                        onBack={handleBack}
                        heading="Данные компании"
                        subheading="Укажите контакты работодателя"
                    >
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (!recruiterCompany.trim()) {
                                    showError('Укажите название компании');
                                    return;
                                }
                                if (!recruiterFirstName.trim() || !recruiterLastName.trim()) {
                                    showError('Укажите имя и фамилию');
                                    return;
                                }
                                if (!recruiterEmail.trim()) {
                                    showError('Укажите email');
                                    return;
                                }
                                if (!recruiterCity.trim()) {
                                    showError('Укажите город');
                                    return;
                                }
                                submitRegistration();
                            }}
                            className="loginModal__form"
                        >
                            <div className="loginModal__inputGroup">
                                <label>Компания</label>
                                <input
                                    value={recruiterCompany}
                                    onChange={(e) => setRecruiterCompany(e.target.value)}
                                    required
                                    placeholder="ООО Пример"
                                />
                            </div>
                            <div className="loginModal__inputGroup">
                                <label>Имя</label>
                                <input
                                    value={recruiterFirstName}
                                    onChange={(e) => setRecruiterFirstName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="loginModal__inputGroup">
                                <label>Фамилия</label>
                                <input
                                    value={recruiterLastName}
                                    onChange={(e) => setRecruiterLastName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="loginModal__inputGroup">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={recruiterEmail}
                                    onChange={(e) => setRecruiterEmail(e.target.value)}
                                    required
                                    placeholder="hr@company.ru"
                                />
                            </div>
                            <div className="loginModal__inputGroup">
                                <label>Город</label>
                                <input
                                    value={recruiterCity}
                                    onChange={(e) => setRecruiterCity(e.target.value)}
                                    required
                                    placeholder="Москва"
                                />
                            </div>
                            <button type="submit" className="loginModal__primaryBtn" disabled={loading}>
                                Зарегистрироваться
                            </button>
                        </form>
                    </Shell>
                )}

                {view === 'done-student' && (
                    <Shell onBack={onClose} heading="Аккаунт создан">
                        <div className="loginModal__infoBlock">
                            <p>
                                Аккаунт создан. Для входа используйте логин <strong>{username.trim()}</strong> и пароль,
                                который вы задали при регистрации.
                            </p>
                            <p>Заполните резюме в профиле — после модерации карточка появится у работодателей.</p>
                            <button
                                type="button"
                                className="loginModal__primaryBtn"
                                onClick={() => {
                                    notifyAuthChanged();
                                    onSuccess?.();
                                    navigate('/settings');
                                }}
                            >
                                Перейти в профиль
                            </button>
                        </div>
                    </Shell>
                )}

                {view === 'done-recruiter' && (
                    <Shell onBack={onClose} heading="Аккаунт создан">
                        <div className="loginModal__infoBlock">
                            <p>
                                Аккаунт создан. Для входа используйте логин <strong>{username.trim()}</strong> и пароль,
                                который вы задали при регистрации.
                            </p>
                            <p>
                                Данные компании сохранены. Полный каталог студентов откроется после одобрения
                                администратором — публичные карточки уже доступны в разделе «Студенты».
                            </p>
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
