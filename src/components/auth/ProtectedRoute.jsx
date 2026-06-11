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
        const onAuthRequired = () => {
            setAuthenticated(false);
            setShowLogin(true);
            setLoading(false);
        };
        window.addEventListener('resume:auth-required', onAuthRequired);
        return () => window.removeEventListener('resume:auth-required', onAuthRequired);
    }, []);

    useEffect(() => {
        // Проверяем авторизацию при монтировании компонента и при изменении location
        const checkAuth = () => {
            const authStatus = isAuthenticated();
            const showLoginFlag = sessionStorage.getItem('showLoginAfter403');
            
            console.log('[ProtectedRoute] Auth status:', authStatus, 'location:', location.pathname, 'showLoginFlag:', showLoginFlag);
            
            setAuthenticated(authStatus);
            setLoading(false);

            if (authStatus) {
                setShowLogin(false);
                if (showLoginFlag === 'true') {
                    sessionStorage.removeItem('showLoginAfter403');
                }
                return;
            }
            
            if (!authStatus) {
                setShowLogin(true);
            }
        };

        checkAuth();
        
        // Слушаем события storage для синхронизации между вкладками
        const handleStorageChange = (e) => {
            if (e.key === 'showLoginAfter403') {
                checkAuth();
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
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

