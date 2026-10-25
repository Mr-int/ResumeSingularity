import { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import LoginModal from '../components/auth/LoginModal.jsx';
import RegisterModal from '../components/auth/RegisterModal.jsx';
import RegisterForm from '../components/auth/RegisterForm.jsx';
import ForgotPasswordModal from '../components/auth/ForgotPasswordModal.jsx';
import { EMAIL_CONFIRMATION_PENDING_KEY, fetchAuthMe, isAuthenticated } from '../services/authApi.js';
import { resolveStudentOnboarding } from '../services/studentOnboardingApi.js';

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
    const [authRedirect, setAuthRedirect] = useState(null);

    useEffect(() => {
        setView(getViewFromUrl());
    }, [location.pathname, location.search]);

    const emailConfirmationPending = sessionStorage.getItem(EMAIL_CONFIRMATION_PENDING_KEY) === '1';
    const stayForEmailConfirmation = location.pathname === '/registration' && emailConfirmationPending;

    const resolvePostAuthPath = async (fallback = '/students') => {
        try {
            const me = await fetchAuthMe();
            const role = String(me?.role || '').toUpperCase();
            if (role === 'STUDENT') {
                const { path } = await resolveStudentOnboarding();
                return path || '/resume/create';
            }
        } catch {
            /* fall through */
        }
        return fallback;
    };

    useEffect(() => {
        if (!isAuthenticated() || stayForEmailConfirmation) {
            setAuthRedirect(null);
            return undefined;
        }
        let cancelled = false;
        (async () => {
            const from = location.state?.from;
            const fallback = from && from !== '/login' && from !== '/registration' && from !== '/onboarding' && from !== '/plug'
                ? from
                : '/students';
            const dest = await resolvePostAuthPath(fallback);
            if (!cancelled) setAuthRedirect(dest);
        })();
        return () => { cancelled = true; };
    }, [location.pathname, location.state, stayForEmailConfirmation]);

    if (isAuthenticated() && !stayForEmailConfirmation) {
        if (authRedirect) {
            return <Navigate to={authRedirect} replace />;
        }
        return null;
    }

    const handleLoginSuccess = async () => {
        const from = location.state?.from;
        const fallback = from && from !== '/login' && from !== '/registration' && from !== '/onboarding' && from !== '/plug'
            ? from
            : '/students';
        const dest = await resolvePostAuthPath(fallback);
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

    const handleRegisterSuccess = (role, username, meta = {}) => {
        if (role === 'student' && meta.next === 'questionnaire') {
            navigate('/resume/create', { replace: true });
            return;
        }
        const loginLine = username ? ` Логин для входа: ${username}.` : '';
        if (role === 'student') {
            alert(`Аккаунт создан! Профиль появится у рекрутеров после модерации администратором.${loginLine}`);
        } else {
            alert(`Заявка на регистрацию принята. Вход будет доступен после одобрения администратором.${loginLine}`);
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