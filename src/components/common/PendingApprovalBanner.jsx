import React, { useEffect, useState } from 'react';
import { syncAuthSession, getAccountStatus, isAuthenticated, AUTH_CHANGED_EVENT } from '../../services/authApi.js';
import './pendingApprovalBanner.css';

const PendingApprovalBanner = () => {
    const [status, setStatus] = useState(null);

    useEffect(() => {
        const load = async () => {
            if (!isAuthenticated()) {
                setStatus(null);
                return;
            }
            const me = await syncAuthSession();
            setStatus(me?.accountStatus ?? getAccountStatus());
        };
        load();
        const onAuthChanged = () => load();
        window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
        return () => window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    }, []);

    if (status !== 'PENDING_APPROVAL') {
        return null;
    }

    return (
        <div className="pendingApprovalBanner" role="status">
            <strong>Аккаунт на проверке.</strong> После одобрения администратором откроются заявки, чаты и полный доступ к
            каталогу. Пока можно заполнить профиль и просматривать публичные разделы.
        </div>
    );
};

export default PendingApprovalBanner;
