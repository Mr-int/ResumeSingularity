import { useCallback, useEffect, useState } from 'react';
import {
    getAccountStatus,
    getAuthRole,
    isAuthenticated,
    syncAuthSession,
    AUTH_CHANGED_EVENT,
} from '../services/authApi.js';

/**
 * Реактивное состояние входа (Header/Hero слушают resume:auth-changed).
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

    useEffect(() => {
        if (!isAuthenticated()) return undefined;
        let cancelled = false;
        syncAuthSession().then((me) => {
            if (!cancelled && (me || isAuthenticated())) {
                refresh();
            }
        });
        return () => {
            cancelled = true;
        };
    }, [version, refresh]);

    return {
        authed: isAuthenticated(),
        role: getAuthRole(),
        accountStatus: getAccountStatus(),
        refresh,
    };
}
