import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginModal from './LoginModal.jsx';
import {
    consumeAuthReturnTo,
    AUTH_REQUIRED_EVENT,
    isAuthenticated,
    getAuthenticatedDestination,
} from '../../services/authApi.js';

/** Модал входа на публичных страницах по событию resume:auth-required */
const GlobalAuthPrompt = () => {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        sessionStorage.removeItem('showLoginAfter403');

        const onAuthRequired = (event) => {
            if (isAuthenticated()) {
                const dest = event?.detail?.redirectTo ?? getAuthenticatedDestination() ?? '/settings';
                navigate(dest);
                return;
            }
            setOpen(true);
        };

        window.addEventListener(AUTH_REQUIRED_EVENT, onAuthRequired);
        return () => window.removeEventListener(AUTH_REQUIRED_EVENT, onAuthRequired);
    }, [navigate]);

    if (!open) return null;

    return (
        <LoginModal
            onClose={() => {
                sessionStorage.removeItem('showLoginAfter403');
                setOpen(false);
            }}
            onSuccess={() => {
                sessionStorage.removeItem('showLoginAfter403');
                setOpen(false);
                const returnTo = consumeAuthReturnTo();
                if (returnTo) {
                    navigate(returnTo);
                    return;
                }
            }}
        />
    );
};

export default GlobalAuthPrompt;
