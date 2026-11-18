import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
    EMAIL_CONFIRMATION_PENDING_KEY,
    REGISTRATION_PENDING_ROLE_KEY,
    fetchAuthMe,
    getStoredEmailVerified,
    getStoredRole,
    isAuthenticated,
} from '../../services/authApi.js';

const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    const [authenticated, setAuthenticated] = useState(() => isAuthenticated());
    const [needsEmailConfirm, setNeedsEmailConfirm] = useState(
        () => getStoredRole() === 'RECRUITER' && getStoredEmailVerified() === false,
    );

    useEffect(() => {
        const onAuthRequired = () => setAuthenticated(false);
        window.addEventListener('resume:auth-required', onAuthRequired);
        return () => window.removeEventListener('resume:auth-required', onAuthRequired);
    }, []);

    useEffect(() => {
        const authStatus = isAuthenticated();
        setAuthenticated(authStatus);
        if (!authStatus) {
            setNeedsEmailConfirm(false);
            return undefined;
        }

        let cancelled = false;
        const storedUnverified = getStoredRole() === 'RECRUITER' && getStoredEmailVerified() === false;
        setNeedsEmailConfirm(storedUnverified);
        fetchAuthMe()
            .then((me) => {
                if (cancelled) return;
                const role = String(me?.role || '').toUpperCase();
                const unverified = role === 'RECRUITER' && me?.emailVerified === false;
                setNeedsEmailConfirm(unverified);
                if (unverified) {
                    sessionStorage.setItem(EMAIL_CONFIRMATION_PENDING_KEY, '1');
                    sessionStorage.setItem(REGISTRATION_PENDING_ROLE_KEY, 'recruiter');
                }
            })
            .catch(() => {
                /* оставляем сохранённый флаг */
            });

        if (authStatus && sessionStorage.getItem('showLoginAfter403') === 'true') {
            sessionStorage.removeItem('showLoginAfter403');
        }

        const handleStorageChange = (e) => {
            if (e.key === 'showLoginAfter403' || e.key === 'isAuthenticated') {
                setAuthenticated(isAuthenticated());
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            cancelled = true;
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [location.pathname]);

    if (!authenticated) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    if (needsEmailConfirm) {
        return <Navigate to="/registration?role=recruiter" replace />;
    }

    return children;
};

export default ProtectedRoute;
