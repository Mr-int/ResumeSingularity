import React from 'react';
import { isAuthenticated, getAuthRole } from '../../services/authApi.js';
import GradientButton from './gradientButton/GradientButton.jsx';

const promptLogin = () => {
    sessionStorage.setItem('showLoginAfter403', 'true');
    window.dispatchEvent(new CustomEvent('resume:auth-required'));
};

/**
 * CTA для гостей; скрывает отклик для студентов (на резюме) и рекрутеров (на вакансиях).
 */
const AnonymousApplyCTA = ({
    children,
    target = 'student',
    className = '',
    message = 'Зарегистрируйтесь, чтобы откликнуться',
}) => {
    const authed = isAuthenticated();
    const role = getAuthRole();

    if (authed && target === 'student' && role === 'STUDENT') {
        return <p className="anonymousApplyCta__text">Студенты не отправляют заявки на резюме</p>;
    }
    if (authed && target === 'vacancy' && (role === 'RECRUITER' || role === 'USER')) {
        return <p className="anonymousApplyCta__text">{message}</p>;
    }
    if (authed) {
        return children;
    }

    return (
        <div className={`anonymousApplyCta${className ? ` ${className}` : ''}`}>
            <p className="anonymousApplyCta__text">{message}</p>
            <GradientButton as="button" type="button" onClick={promptLogin}>
                Войти или зарегистрироваться
            </GradientButton>
        </div>
    );
};

export default AnonymousApplyCTA;
