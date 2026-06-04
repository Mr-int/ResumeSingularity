import React, { useEffect, useState } from 'react';
import LoginModal from './LoginModal.jsx';

/** Модал входа на публичных страницах по событию resume:auth-required */
const GlobalAuthPrompt = () => {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const onAuthRequired = () => setOpen(true);
        if (sessionStorage.getItem('showLoginAfter403') === 'true') {
            setOpen(true);
        }
        window.addEventListener('resume:auth-required', onAuthRequired);
        return () => window.removeEventListener('resume:auth-required', onAuthRequired);
    }, []);

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
                window.location.reload();
            }}
        />
    );
};

export default GlobalAuthPrompt;
