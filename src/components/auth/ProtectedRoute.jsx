import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../../services/authApi.js';

const ProtectedRoute = ({ children }) => {
    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const onAuthRequired = () => {
            setAuthenticated(false);
            setLoading(false);
        };
        window.addEventListener('resume:auth-required', onAuthRequired);
        return () => window.removeEventListener('resume:auth-required', onAuthRequired);
    }, []);

    useEffect(() => {
        const checkAuth = () => {
            const authStatus = isAuthenticated();
            const showLoginFlag = sessionStorage.getItem('showLoginAfter403');

            console.log('[ProtectedRoute] Auth status:', authStatus, 'location:', location.pathname, 'showLoginFlag:', showLoginFlag);

            setAuthenticated(authStatus);
            setLoading(false);

            if (authStatus && showLoginFlag === 'true') {
                sessionStorage.removeItem('showLoginAfter403');
            }
        };

        checkAuth();

        const handleStorageChange = (e) => {
            if (e.key === 'showLoginAfter403' || e.key === 'isAuthenticated') {
                checkAuth();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [location.pathname]);

    if (loading) {
        return null;
    }

    if (!authenticated) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    return children;
};

export default ProtectedRoute;
