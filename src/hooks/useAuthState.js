import { useCallback, useEffect, useState } from 'react';
import {
    getAccountStatus,
    getAuthRole,
    isAuthenticated,
    AUTH_CHANGED_EVENT,
} from '../services/authApi.js';

/**
 * Реактивное состояние входа (Header/Hero слушают resume:auth-changed).
 * Синхронизация сессии — в ProtectedRoute / PendingApprovalBanner, не здесь.
 */
export function useAuthState() {
    const [version, setVersion] = useState(0);

    const refresh = useCallback(() => {
        setVersion((v) => v + 1);
    }, []);

    useEffect(() => {
        const onAuthChanged = () => refresh();
        window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
        return () => window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    }, [refresh]);

    return {
        authed: isAuthenticated(),
        role: getAuthRole(),
        accountStatus: getAccountStatus(),
        refresh,
    };
}
