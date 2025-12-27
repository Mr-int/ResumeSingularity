import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../../services/authApi.js';
import LoginModal from './LoginModal.jsx';

const ProtectedRoute = ({ children }) => {
    const [showLogin, setShowLogin] = useState(false);
    const [authenticated, setAuthenticated] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Проверяем авторизацию при монтировании компонента
        const checkAuth = () => {
            const authStatus = isAuthenticated();
            setAuthenticated(authStatus);
            
            if (!authStatus) {
                setShowLogin(true);
            }
        };

        checkAuth();
    }, []);

    const handleLoginSuccess = () => {
        setAuthenticated(true);
        setShowLogin(false);
    };

    const handleCloseLogin = () => {
        // Если пользователь закрыл модальное окно без входа, перенаправляем на главную
        navigate('/');
    };

    if (!authenticated) {
        return showLogin ? (
            <LoginModal onClose={handleCloseLogin} onSuccess={handleLoginSuccess} />
        ) : null;
    }

    return children;
};

export default ProtectedRoute;

