import { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import LoginModal from '../components/auth/LoginModal.jsx';
import RegisterModal from '../components/auth/RegisterModal.jsx';
import RegisterForm from '../components/auth/RegisterForm.jsx';
import ForgotPasswordModal from '../components/auth/ForgotPasswordModal.jsx';
import { isAuthenticated } from '../services/authApi.js';

const Auth = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const getViewFromUrl = () => {
        if (location.pathname === '/forgot-password') {
            return 'forgot-password';
        }
        if (location.pathname === '/registration') {
            const role = new URLSearchParams(location.search).get('role');
            if (role === 'student') return 'register-student';
            if (role === 'recruiter') return 'register-recruiter';
            return 'register';
        }
        return 'login';
    };

    const [view, setView] = useState(getViewFromUrl);

    useEffect(() => {
        setView(getViewFromUrl());
    }, [location.pathname, location.search]);

    if (isAuthenticated()) {
        const from = location.state?.from;
        const dest = from && from !== '/login' && from !== '/registration' ? from : '/students';
        return <Navigate to={dest} replace />;
    }

    const handleLoginSuccess = () => {
        const from = location.state?.from;
        const dest = from && from !== '/login' && from !== '/registration' ? from : '/students';
        navigate(dest, { replace: true });
    };

    const handleClose = () => {
        navigate('/');
    };

    const goToLogin = () => {
        navigate('/login', { replace: true });
    };

    const goToRegister = () => {
        navigate('/registration', { replace: true });
    };

    const goToStudentRegister = () => {
        navigate('/registration?role=student', { replace: true });
    };

    const goToRecruiterRegister = () => {
        navigate('/registration?role=recruiter', { replace: true });
    };

    const goToForgotPassword = () => {
        navigate('/forgot-password', { replace: true });
    };

    const handleRegisterSuccess = (role) => {
        if (role === 'student') {
            alert('Аккаунт создан! Профиль появится у рекрутеров после модерации администратором.');
        } else {
            alert('Заявка на регистрацию принята. Вход будет доступен после одобрения администратором.');
        }
        goToLogin();
    };

    if (view === 'forgot-password') {
        return (
            <ForgotPasswordModal
                onBack={goToLogin}
                onClose={handleClose}
            />
        );
    }

    if (view === 'login') {
        return (
            <LoginModal
                onClose={handleClose}
                onSuccess={handleLoginSuccess}
                onRegisterClick={goToRegister}
                onForgotClick={goToForgotPassword}
            />
        );
    }

    if (view === 'register') {
        return (
            <RegisterModal
                onBack={goToLogin}
                onSelectRole={(role) => {
                    if (role === 'student') goToStudentRegister();
                    else goToRecruiterRegister();
                }}
            />
        );
    }

    if (view === 'register-student') {
        return (
            <RegisterForm
                role="student"
                onBack={goToRegister}
                onSuccess={handleRegisterSuccess}
            />
        );
    }

    if (view === 'register-recruiter') {
        return (
            <RegisterForm
                role="recruiter"
                onBack={goToRegister}
                onSuccess={handleRegisterSuccess}
            />
        );
    }

    return null;
};

export default Auth;