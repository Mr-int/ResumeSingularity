import React, { useState } from 'react';
import { login } from '../../services/authApi.js';
import './loginModal.css';

const LoginModal = ({ onClose, onSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(username, password);
            // Cookies будут сохранены автоматически благодаря credentials: 'include'
            onSuccess();
        } catch (err) {
            setError('Неверное имя пользователя или пароль');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="loginModal__overlay" onClick={onClose}>
            <div className="loginModal__content" onClick={(e) => e.stopPropagation()}>
                <button className="loginModal__close" onClick={onClose}>×</button>
                <h2 className="loginModal__title">Вход</h2>
                <form onSubmit={handleSubmit} className="loginModal__form">
                    <div className="loginModal__field">
                        <label htmlFor="username">Имя пользователя</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="loginModal__field">
                        <label htmlFor="password">Пароль</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>
                    {error && <div className="loginModal__error">{error}</div>}
                    <button type="submit" className="loginModal__submit" disabled={loading}>
                        {loading ? 'Вход...' : 'Войти'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginModal;

