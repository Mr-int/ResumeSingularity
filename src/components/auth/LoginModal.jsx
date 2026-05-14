import React, { useState } from 'react';
import { login } from '../../services/authApi.js';
import './loginModal.css';

const ChevronLeftIcon = () => (
    <svg className="loginModal__backIcon" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path
            fill="currentColor"
            d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"
        />
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

const LoginModal = ({ onClose, onSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(username, password);
            setTimeout(() => {
                setLoading(false);
                onSuccess();
            }, 100);
        } catch (err) {
            setError('Неверное имя пользователя или пароль');
            console.error('Login error:', err);
            setLoading(false);
        }
    };

    return (
        <div className="loginModal__overlay">
            <div className="loginModal__card">
                <button type="button" className="loginModal__backBtn" onClick={onClose} aria-label="Назад">
                    <ChevronLeftIcon />
                </button>

                <div className="loginModal__logoWrap">
                    <div className="loginModal__logoPlaceholder" aria-hidden="true">
                        рез<br />юм<br />ище
                    </div>
                </div>

                <h2 className="loginModal__heading">Вход</h2>

                <form onSubmit={handleSubmit} className="loginModal__form">
                    <div className="loginModal__inputGroup">
                        <label htmlFor="loginModal-login">Логин</label>
                        <div className="loginModal__inputWrap">
                            <input
                                id="loginModal-login"
                                type="text"
                                autoComplete="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="loginModal__inputGroup">
                        <label htmlFor="loginModal-password">Пароль</label>
                        <div className="loginModal__inputWrap">
                            <input
                                id="loginModal-password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                                className="loginModal__inputPassword"
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

                    {error ? <div className="loginModal__error" role="alert">{error}</div> : null}

                    <button type="submit" className="loginModal__primaryBtn" disabled={loading}>
                        {loading ? 'Вход…' : 'Войти'}
                    </button>
                    <button type="button" className="loginModal__secondaryBtn" disabled={loading}>
                        <span>Зарегистрироваться</span>
                    </button>
                </form>

                <a href="#" className="loginModal__forgotLink" onClick={(e) => e.preventDefault()}>
                    Забыли пароль?
                </a>
            </div>
        </div>
    );
};

export default LoginModal;
