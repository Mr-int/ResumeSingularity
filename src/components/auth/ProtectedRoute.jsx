import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../../services/authApi.js';

const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    const [authenticated, setAuthenticated] = useState(() => isAuthenticated());

    useEffect(() => {
        const onAuthRequired = () => setAuthenticated(false);
        window.addEventListener('resume:auth-required', onAuthRequired);
        return () => window.removeEventListener('resume:auth-required', onAuthRequired);
    }, []);

    useEffect(() => {
        const authStatus = isAuthenticated();
        setAuthenticated(authStatus);

        if (authStatus && sessionStorage.getItem('showLoginAfter403') === 'true') {
            sessionStorage.removeItem('showLoginAfter403');
        }

        const handleStorageChange = (e) => {
            if (e.key === 'showLoginAfter403' || e.key === 'isAuthenticated') {
                setAuthenticated(isAuthenticated());
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [location.pathname]);

    if (!authenticated) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    return children;
};

export default ProtectedRoute;
