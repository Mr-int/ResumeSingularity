import React, { useEffect, useState } from 'react';
import { syncAuthSession, getAccountStatus, isAuthenticated } from '../../services/authApi.js';
import './pendingApprovalBanner.css';

const PendingApprovalBanner = () => {
    const [status, setStatus] = useState(null);

    useEffect(() => {
        if (!isAuthenticated()) {
            setStatus(null);
            return;
        }
        let cancelled = false;
        (async () => {
            const me = await syncAuthSession();
            if (!cancelled) {
                setStatus(me?.accountStatus ?? getAccountStatus());
            }
        })();
        return () => {
            cancelled = true;
        };
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
