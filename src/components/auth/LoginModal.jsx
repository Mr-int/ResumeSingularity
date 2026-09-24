import React, { useState } from 'react';
import { login } from '../../services/authApi.js';
import './loginModal.css';
import BackIcon from '../../assets/icons/vectorAuth.svg';
import LogoImage from '../../assets/logos/resume_logo_mini.png';

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

const LoginModal = ({ onClose, onSuccess, onRegisterClick, onForgotClick }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        const trimmedUsername = username.trim();
        const trimmedPassword = password.trim();

        if (!trimmedUsername && !trimmedPassword) {
            setError('Заполните все поля');
            return;
        }
        if (!trimmedUsername) {
            setError('Введите логин');
            return;
        }
        if (!trimmedPassword) {
            setError('Введите пароль');
            return;
        }

        setLoading(true);
        try {
            await login(trimmedUsername, trimmedPassword);
            setTimeout(() => {
                setLoading(false);
                onSuccess();
            }, 100);
        } catch (err) {
            const message =
                (err && err.message && String(err.message).trim()) ||
                'Неверное имя пользователя или пароль';
            setError(message);
            console.error('Login error:', err);
            setLoading(false);
        }
    };

    const handleUsernameChange = (e) => {
        setUsername(e.target.value);
        if (error) setError('');
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
        if (error) setError('');
    };

    const handleBack = () => {
        onClose();
    };

    return (
        <div className="loginModal__overlay">
            <div className="loginModal__card">
                <button
                    type="button"
                    className="loginModal__backBtn"
                    onClick={handleBack}
                    aria-label="Назад"
                >
                    <img
                        src={BackIcon}
                        alt="Назад"
                        className="loginModal__backIcon"
                    />
                </button>

                <div className="loginModal__logoWrap">
                    <img
                        src={LogoImage}
                        alt="Resume Singularity"
                        className="loginModal__logoImage"
                    />
                </div>

                <h2 className="loginModal__heading">Вход</h2>

                <form onSubmit={handleLogin} className="loginModal__form" noValidate>
                    <div className="loginModal__inputGroup">
                        <label
                            htmlFor="loginModal-login"
                            className={error ? 'loginModal__label--error' : undefined}
                        >
                            Логин
                        </label>
                        <div className="loginModal__inputWrap">
                            <input
                                id="loginModal-login"
                                type="text"
                                autoComplete="username"
                                value={username}
                                onChange={handleUsernameChange}
                                disabled={loading}
                                className={error ? 'loginModal__input--error' : undefined}
                            />
                        </div>
                    </div>

                    <div className="loginModal__inputGroup">
                        <label
                            htmlFor="loginModal-password"
                            className={error ? 'loginModal__label--error' : undefined}
                        >
                            Пароль
                        </label>
                        <div className="loginModal__inputWrap">
                            <input
                                id="loginModal-password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                value={password}
                                onChange={handlePasswordChange}
                                disabled={loading}
                                className={`loginModal__inputPassword${error ? ' loginModal__input--error' : ''}`}
                            />
                            <button
                                type="button"
                                className="loginModal__passwordToggle"
                                onClick={() => setShowPassword((v) => !v)}
                                disabled={loading}
                                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                                aria-pressed={showPassword}
                            >
                                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="loginModal__primaryBtn" disabled={loading}>
                        {loading ? 'Вход…' : 'Войти'}
                    </button>
                </form>

                <button
                    type="button"
                    className="loginModal__registerLink"
                    onClick={onRegisterClick}
                >
                    <span>Зарегистрироваться</span>
                </button>

                <button
                    type="button"
                    className="loginModal__forgotLink"
                    onClick={onForgotClick}
                >
                    Забыли пароль?
                </button>
            </div>

            {error ? (
                <div className="loginModal__error" role="alert">
                    <span className="loginModal__errorText">{error}</span>
                    <button
                        type="button"
                        className="loginModal__errorClose"
                        onClick={() => setError('')}
                        aria-label="Закрыть"
                    >
                        ×
                    </button>
                </div>
            ) : null}
        </div>
    );
};

export default LoginModal;