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
        // Проверяем авторизацию при монтировании компонента и при изменении location
        const checkAuth = () => {
            const authStatus = isAuthenticated();
            console.log('[ProtectedRoute] Auth status:', authStatus, 'location:', location.pathname);
            setAuthenticated(authStatus);
            setLoading(false);
            
            if (!authStatus) {
                setShowLogin(true);
            } else {
                setShowLogin(false);
            }
        };

        checkAuth();
    }, [location.pathname]);

    const handleLoginSuccess = () => {
        console.log('[ProtectedRoute] Login successful, updating state');
        // После успешного входа сразу устанавливаем авторизацию
        // Флаг уже установлен в login(), cookies могут быть HttpOnly
        setAuthenticated(true);
        setShowLogin(false);
        
        // Дополнительная проверка через небольшую задержку
        setTimeout(() => {
            const authStatus = isAuthenticated();
            console.log('[ProtectedRoute] After login check - auth status:', authStatus);
            if (!authStatus) {
                // Если проверка не прошла, проверяем еще раз
                setTimeout(() => {
                    const recheckStatus = isAuthenticated();
                    console.log('[ProtectedRoute] Recheck - auth status:', recheckStatus);
                    setAuthenticated(recheckStatus);
                    setShowLogin(!recheckStatus);
                }, 300);
            }
        }, 100);
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

