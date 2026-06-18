import React, { useEffect, useRef, useState } from 'react';
import { login } from '../../services/authApi.js';
import {
    startPhoneVerification,
    getPhoneVerificationStatus,
    isValidVerificationEmail,
    isVerificationMailDeliveryError,
} from '../../services/verificationApi.js';
import RegistrationWizard from './RegistrationWizard.jsx';
import PhoneOtpConfirm from './PhoneOtpConfirm.jsx';
import { validateRegistrationPassword } from '../../utils/passwordPolicy.js';
import logo from '../../assets/logos/icoRes.png';
import './loginModal.css';

const ChevronLeftIcon = () => (
    <svg className="loginModal__backIcon" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
    </svg>
);

const EyeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeOffIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M1 1l22 22" strokeLinecap="round" />
    </svg>
);

const MailIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M4 8l8 5 8-5M4 8v10h16V8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

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

const PasswordField = ({
    id,
    label,
    value,
    onChange,
    autoComplete,
    showPassword,
    onToggle,
    groupClass = '',
    onFocus,
    onBlur,
}) => (
    <div className={`loginModal__inputGroup ${groupClass}`.trim()}>
        <label htmlFor={id}>{label}</label>
        <div className="loginModal__inputWrap">
            <input
                id={id}
                type={showPassword ? 'text' : 'password'}
                autoComplete={autoComplete}
                value={value}
                onChange={onChange}
                onFocus={onFocus}
                onBlur={onBlur}
                required
                className="loginModal__inputPassword"
            />
            <button
                type="button"
                className="loginModal__passwordToggle"
                onClick={onToggle}
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
            >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
        </div>
    </div>
);

const AuthShell = ({ onBack, heading, subheading, children, footer }) => (
    <>
        <button type="button" className="loginModal__backBtn" onClick={onBack} aria-label="Назад">
            <ChevronLeftIcon />
        </button>
        <div className="loginModal__logoWrap">
            <img src={logo} alt="Резюме" className="loginModal__logo" />
        </div>
        <h2 className="loginModal__heading">{heading}</h2>
        {subheading ? <p className="loginModal__subheading">{subheading}</p> : null}
        {children}
        {footer}
    </>
);

const LoadingScreen = () => (
    <div className="loginModal__card loginModal__card--loading" role="status" aria-live="polite">
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

const ErrorToast = ({ message, onClose }) =>
    message ? (
        <div className="loginModal__toast" role="alert">
            {message}
            <button type="button" className="loginModal__toastClose" onClick={onClose} aria-label="Закрыть">
                ×
            </button>
        </div>
    ) : null;

const LoginModal = ({ onClose, onSuccess }) => {
    const [view, setView] = useState('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showNewPasswordConfirm, setShowNewPasswordConfirm] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

    const [verification, setVerification] = useState(null);
    const pollRef = useRef(null);

    const [forgotTab, setForgotTab] = useState('phone');
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotPhoneLocal, setForgotPhoneLocal] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirm, setNewPasswordConfirm] = useState('');

    const stopPolling = () => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    };

    const switchView = (next) => {
        setError('');
        if (next !== 'forgot-telegram') stopPolling();
        setView(next);
    };

    useEffect(() => () => stopPolling(), []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(username, password);
            onSuccess();
        } catch (err) {
            setError(err.message || 'Не удалось войти. Проверьте логин и пароль.');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    const startVerificationPolling = (verificationId, onConfirmed, onExpired) => {
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

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const phone = normalizePhone(forgotPhoneLocal);
        if (phone.replace(/\D/g, '').length < 11) {
            setError('Укажите корректный номер телефона');
            return;
        }
        const emailTrim = forgotEmail.trim();
        if (forgotTab === 'email') {
            if (!emailTrim) {
                setError('Укажите email');
                return;
            }
            if (!isValidVerificationEmail(emailTrim)) {
                setError('Укажите корректный email');
                return;
            }
        }
        setLoading(true);
        try {
            let res;
            let effectiveChannel = forgotTab;
            try {
                res = await startPhoneVerification({
                    phoneNumber: phone,
                    ...(forgotTab === 'email' ? { email: emailTrim } : {}),
                });
            } catch (err) {
                if (forgotTab === 'email' && isVerificationMailDeliveryError(err)) {
                    res = await startPhoneVerification({ phoneNumber: phone });
                    effectiveChannel = 'phone';
                    setError(
                        'Сейчас не удаётся отправить код на почту. Подтвердите номер в Telegram.',
                    );
                } else {
                    throw err;
                }
            }
            setVerification({
                ...res,
                phoneNumber: phone,
                email: emailTrim || null,
                channel: effectiveChannel,
                mode: 'forgot',
            });
            switchView('forgot-telegram');
            startVerificationPolling(
                res.verificationId,
                () => switchView('forgot-new-password'),
                () => {
                    setError('Время подтверждения истекло');
                    switchView('forgot-password');
                },
            );
        } catch (err) {
            setError(err.message || 'Не удалось отправить запрос');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotNewPassword = (e) => {
        e.preventDefault();
        setError('');
        const passwordCheck = validateRegistrationPassword(newPassword);
        if (!passwordCheck.ok) {
            setError(passwordCheck.message);
            return;
        }
        if (newPassword !== newPasswordConfirm) {
            setError('Пароли не совпадают');
            return;
        }
        setError('Смена пароля на сайте пока недоступна — обратитесь к администратору');
    };

    const restartTelegramVerification = async () => {
        setError('');
        const phone = verification?.phoneNumber;
        if (!phone) return;
        setLoading(true);
        try {
            const res = await startPhoneVerification({
                phoneNumber: phone,
                ...(verification?.channel === 'email' && verification?.email
                    ? { email: verification.email }
                    : {}),
            });
            setVerification((prev) => ({
                ...prev,
                ...res,
                phoneNumber: phone,
                mode: 'forgot',
            }));
            startVerificationPolling(
                res.verificationId,
                () => switchView('forgot-new-password'),
                () => setError('Время подтверждения истекло'),
            );
        } catch (err) {
            setError(err.message || 'Не удалось обновить сессию');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (view === 'login') {
            onClose();
            return;
        }
        const backMap = {
            'forgot-password': 'login',
            'forgot-telegram': 'forgot-password',
            'forgot-new-password': 'forgot-telegram',
        };
        switchView(backMap[view] || 'login');
    };

    const usernameGroupClass = [
        focusedField === 'username' ? 'loginModal__inputGroup--focusedUsername' : '',
        error && view === 'login' ? 'loginModal__inputGroup--error' : '',
    ]
        .filter(Boolean)
        .join(' ');

    const passwordGroupClass = [
        focusedField === 'password' ? 'loginModal__inputGroup--focusedPassword' : '',
        error && view === 'login' ? 'loginModal__inputGroup--error' : '',
    ]
        .filter(Boolean)
        .join(' ');

    if (view === 'register') {
        return (
            <div className="loginModal__overlay">
                <RegistrationWizard
                    onClose={onClose}
                    onSuccess={onSuccess}
                    onLogin={() => switchView('login')}
                />
            </div>
        );
    }

    if (loading && view !== 'forgot-telegram') {
        return (
            <div className="loginModal__overlay">
                <LoadingScreen />
            </div>
        );
    }

    return (
        <div className="loginModal__overlay">
            <div className="loginModal__card">
                {view === 'login' && (
                    <AuthShell onBack={onClose} heading="Вход">
                        <form onSubmit={handleLogin} className="loginModal__form">
                            <div className={`loginModal__inputGroup ${usernameGroupClass}`.trim()}>
                                <label htmlFor="loginModal-login">Логин</label>
                                <input
                                    id="loginModal-login"
                                    type="text"
                                    autoComplete="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    onFocus={() => setFocusedField('username')}
                                    onBlur={() => setFocusedField(null)}
                                    required
                                />
                            </div>
                            <PasswordField
                                id="loginModal-password"
                                label="Пароль"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                                autoComplete="current-password"
                                showPassword={showPassword}
                                onToggle={() => setShowPassword((v) => !v)}
                                groupClass={passwordGroupClass}
                            />
                            <button type="submit" className="loginModal__primaryBtn">
                                Войти
                            </button>
                            <button
                                type="button"
                                className="loginModal__secondaryBtn"
                                onClick={() => switchView('register')}
                            >
                                <span>Зарегистрироваться</span>
                            </button>
                        </form>
                        <a
                            href="#"
                            className="loginModal__forgotLink"
                            onClick={(e) => {
                                e.preventDefault();
                                switchView('forgot-password');
                            }}
                        >
                            Забыли пароль?
                        </a>
                    </AuthShell>
                )}

                {view === 'forgot-password' && (
                    <AuthShell
                        onBack={handleBack}
                        heading="Восстановление пароля"
                        subheading="Подтверждение через Telegram-бота (не SMS)"
                        footer={
                            <p className="loginModal__legal">
                                Нажимая «Отправить код», вы принимаете{' '}
                                <a href="/">политику конфиденциальности</a> и <a href="/">правила сервиса</a>
                            </p>
                        }
                    >
                        <div className="loginModal__tabs" role="tablist">
                            <button
                                type="button"
                                className={`loginModal__tab ${forgotTab === 'phone' ? 'loginModal__tab--active' : ''}`}
                                onClick={() => setForgotTab('phone')}
                            >
                                Телефон
                            </button>
                            <button
                                type="button"
                                className={`loginModal__tab ${forgotTab === 'email' ? 'loginModal__tab--active' : ''}`}
                                onClick={() => setForgotTab('email')}
                            >
                                Почта
                            </button>
                        </div>
                        <form onSubmit={handleForgotSubmit} className="loginModal__form">
                            {forgotTab === 'phone' ? (
                                <div className="loginModal__phoneRow">
                                    <div className="loginModal__phonePrefix">
                                        <span className="loginModal__phonePrefixFlag" aria-hidden="true">🇷🇺</span>
                                        +7
                                    </div>
                                    <input
                                        className="loginModal__phoneInput"
                                        type="tel"
                                        value={formatPhoneDisplay(forgotPhoneLocal)}
                                        onChange={(e) => setForgotPhoneLocal(e.target.value.replace(/\D/g, ''))}
                                        required
                                        placeholder="952 312-94-90"
                                    />
                                </div>
                            ) : (
                                <>
                                    <div className="loginModal__emailRow">
                                        <div className="loginModal__emailIcon">
                                            <MailIcon />
                                        </div>
                                        <input
                                            type="email"
                                            className="loginModal__phoneInput"
                                            value={forgotEmail}
                                            onChange={(e) => setForgotEmail(e.target.value.replace(/\s/g, ''))}
                                            placeholder="youremail@example.com"
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
                                            value={formatPhoneDisplay(forgotPhoneLocal)}
                                            onChange={(e) => setForgotPhoneLocal(e.target.value.replace(/\D/g, ''))}
                                            required
                                            placeholder="952 312-94-90"
                                            aria-label="Номер телефона аккаунта"
                                        />
                                    </div>
                                    <p className="loginModal__fieldHint">
                                        Код придёт на почту. Номер должен совпадать с аккаунтом.
                                    </p>
                                </>
                            )}
                            <button type="submit" className="loginModal__primaryBtn">
                                Отправить код
                            </button>
                        </form>
                    </AuthShell>
                )}

                {view === 'forgot-telegram' && verification && (
                    <AuthShell
                        onBack={handleBack}
                        heading={
                            verification.channel === 'email'
                                ? 'Введите код из письма'
                                : 'Введите код из СМС'
                        }
                        subheading={
                            verification.channel === 'email'
                                ? `Код отправлен на ${verification.email}. Для тестов: 7890. Телефон: ${verification.phoneNumber}`
                                : `Для тестов: 7890. Или Telegram @${verification.botUsername}, ${verification.phoneNumber}`
                        }
                    >
                        <PhoneOtpConfirm
                            verificationId={verification.verificationId}
                            onConfirmed={() => switchView('forgot-new-password')}
                            onError={setError}
                        />
                        {verification.channel === 'email' ? (
                            <p className="loginModal__infoText">
                                Не пришло письмо? Проверьте «Спам» или подтвердите через Telegram.
                            </p>
                        ) : (
                            <div className="loginModal__telegramWait">
                                <div className="loginModal__spinner loginModal__spinner--inline" aria-hidden="true" />
                                <p className="loginModal__infoText">Или подтвердите в Telegram…</p>
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
                        <button type="button" className="loginModal__ghostBtn" onClick={restartTelegramVerification}>
                            Отправить код снова
                        </button>
                    </AuthShell>
                )}

                {view === 'forgot-new-password' && (
                    <AuthShell
                        onBack={handleBack}
                        heading="Новый пароль"
                        subheading="Придумайте надёжный пароль и запишите на листочек, чтобы не забыть"
                    >
                        <form onSubmit={handleForgotNewPassword} className="loginModal__form">
                            <PasswordField
                                id="forgot-new-password"
                                label="Новый пароль"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                autoComplete="new-password"
                                showPassword={showNewPassword}
                                onToggle={() => setShowNewPassword((v) => !v)}
                            />
                            <PasswordField
                                id="forgot-new-password-confirm"
                                label="Повторите новый пароль"
                                value={newPasswordConfirm}
                                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                                autoComplete="new-password"
                                showPassword={showNewPasswordConfirm}
                                onToggle={() => setShowNewPasswordConfirm((v) => !v)}
                            />
                            <button type="submit" className="loginModal__primaryBtn">
                                Войти с новым паролем
                            </button>
                        </form>
                    </AuthShell>
                )}
            </div>
            <ErrorToast message={error} onClose={() => setError('')} />
        </div>
    );
};

export default LoginModal;
