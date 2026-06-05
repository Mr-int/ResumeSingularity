import React, { useEffect, useState } from 'react';
import { syncAuthSession, getAccountStatus, isAuthenticated, AUTH_CHANGED_EVENT } from '../../services/authApi.js';
import './pendingApprovalBanner.css';

const PendingIcon = () => (
    <svg
        className="pendingApprovalBanner__iconSvg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
    >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path
            d="M12 7v5l3 2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const PendingApprovalBanner = () => {
    const [status, setStatus] = useState(null);

    useEffect(() => {
        const applyStatus = () => {
            if (!isAuthenticated()) {
                setStatus(null);
                return;
            }
            setStatus(getAccountStatus());
        };

        const loadInitial = async () => {
            if (!isAuthenticated()) {
                setStatus(null);
                return;
            }
            if (getAccountStatus()) {
                setStatus(getAccountStatus());
                return;
            }
            const me = await syncAuthSession();
            setStatus(me?.accountStatus ?? getAccountStatus());
        };

        loadInitial();
        window.addEventListener(AUTH_CHANGED_EVENT, applyStatus);
        return () => window.removeEventListener(AUTH_CHANGED_EVENT, applyStatus);
    }, []);

    if (status !== 'PENDING_APPROVAL') {
        return null;
    }

    return (
        <div className="pendingApprovalBanner" role="status">
            <div className="pendingApprovalBanner__inner">
                <div className="pendingApprovalBanner__icon" aria-hidden="true">
                    <PendingIcon />
                </div>
                <div className="pendingApprovalBanner__content">
                    <p className="pendingApprovalBanner__title">Аккаунт на проверке</p>
                    <p className="pendingApprovalBanner__text">
                        После одобрения администратором откроются заявки, чаты и полный доступ к каталогу.
                        Пока можно заполнить профиль и просматривать публичные разделы.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PendingApprovalBanner;
