import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    isAuthenticated,
    syncAuthSession,
    isAdmin,
    isStudentRole,
    getAccountStatus,
    consumeAuthReturnTo,
    notifyAuthChanged,
    AUTH_CHANGED_EVENT,
    AUTH_RETURN_KEY,
} from '../../services/authApi.js';
import LoginModal from './LoginModal.jsx';

const RouteLoadingScreen = () => (
    <div className="appRouteLoader" aria-label="Загрузка">
        <div className="appRouteLoader__spinner" />
    </div>
);

const ApprovedRoute = ({ children, allowPendingRecruiter = false }) => {
    const [showLogin, setShowLogin] = useState(false);
    const [allowed, setAllowed] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        let cancelled = false;

        const finish = (state) => {
            if (cancelled) return;
            setShowLogin(state.showLogin);
            setAllowed(state.allowed);
            setLoading(false);
        };

        const checkAccess = async () => {
            setLoading(true);

            if (!isAuthenticated()) {
                sessionStorage.setItem(AUTH_RETURN_KEY, location.pathname + location.search);
                finish({ showLogin: true, allowed: false });
                return;
            }

            await syncAuthSession();
            if (cancelled) return;

            if (!isAuthenticated()) {
                sessionStorage.setItem(AUTH_RETURN_KEY, location.pathname + location.search);
                finish({ showLogin: true, allowed: false });
                return;
            }

            const status = getAccountStatus();
            if (
                !allowPendingRecruiter
                && !isAdmin()
                && status === 'PENDING_APPROVAL'
                && !isStudentRole()
            ) {
                navigate('/', { replace: true });
                finish({ showLogin: false, allowed: false });
                return;
            }

            finish({ showLogin: false, allowed: true });
        };

        checkAccess();

        window.addEventListener(AUTH_CHANGED_EVENT, checkAccess);
        return () => {
            cancelled = true;
            window.removeEventListener(AUTH_CHANGED_EVENT, checkAccess);
        };
    }, [location.pathname, location.search, navigate, allowPendingRecruiter]);

    const handleLoginSuccess = async () => {
        await syncAuthSession();
        setShowLogin(false);
        notifyAuthChanged();

        const status = getAccountStatus();
        if (
            !allowPendingRecruiter
            && !isAdmin()
            && status === 'PENDING_APPROVAL'
            && !isStudentRole()
        ) {
            navigate('/', { replace: true });
            return;
        }

        const returnTo = consumeAuthReturnTo();
        if (returnTo) {
            navigate(returnTo);
        }
        setAllowed(true);
        setLoading(false);
    };

    const handleCloseLogin = () => {
        navigate('/');
    };

    if (loading) {
        return <RouteLoadingScreen />;
    }

    if (!allowed) {
        return showLogin ? (
            <LoginModal onClose={handleCloseLogin} onSuccess={handleLoginSuccess} />
        ) : (
            <RouteLoadingScreen />
        );
    }

    return children;
};

export default ApprovedRoute;
