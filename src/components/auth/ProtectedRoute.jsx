import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated, notifyAuthChanged, consumeAuthReturnTo } from '../../services/authApi.js';
import LoginModal from './LoginModal.jsx';

const ProtectedRoute = ({ children }) => {
    const [showLogin, setShowLogin] = useState(false);
    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const checkAuth = () => {
            const authStatus = isAuthenticated();
            setAuthenticated(authStatus);
            setLoading(false);
            setShowLogin(!authStatus);
        };

        checkAuth();
    }, [location.pathname]);

    const handleLoginSuccess = () => {
        sessionStorage.removeItem('showLoginAfter403');
        setAuthenticated(isAuthenticated());
        setShowLogin(false);
        notifyAuthChanged();

        const returnTo = consumeAuthReturnTo();
        if (returnTo) {
            navigate(returnTo);
        }
    };

    const handleCloseLogin = () => {
        // Если пользователь закрыл модальное окно без входа, перенаправляем на главную
        navigate('/');
    };

    // Показываем загрузку пока проверяем авторизацию
    if (loading) {
        return null; // или можно показать loader
    }

    // Если не авторизован, показываем модальное окно входа
    if (!authenticated) {
        return showLogin ? (
            <LoginModal onClose={handleCloseLogin} onSuccess={handleLoginSuccess} />
        ) : null;
    }

    // Если авторизован, показываем защищенный контент
    return children;
};

export default ProtectedRoute;

