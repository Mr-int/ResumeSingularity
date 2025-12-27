import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../../services/authApi.js';
import LoginModal from './LoginModal.jsx';

const ProtectedRoute = ({ children }) => {
    const [showLogin, setShowLogin] = useState(false);
    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Проверяем авторизацию при монтировании компонента
        const checkAuth = () => {
            const authStatus = isAuthenticated();
            console.log('[ProtectedRoute] Auth status:', authStatus);
            setAuthenticated(authStatus);
            setLoading(false);
            
            if (!authStatus) {
                setShowLogin(true);
            }
        };

        checkAuth();
    }, []);

    const handleLoginSuccess = () => {
        console.log('[ProtectedRoute] Login successful, updating state');
        // Обновляем состояние после успешного входа
        const authStatus = isAuthenticated();
        setAuthenticated(authStatus);
        setShowLogin(false);
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

