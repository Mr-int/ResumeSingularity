import { API_BASE_URL } from '../config/api.js';
import { APP_BASE_URL } from '../utils/appBase.js';

const SESSION_KEY = 'resume:analytics-session-id';

/** Типы, которые сайт шлёт на POST /public/analytics/events */
export const ANALYTICS_EVENT = {
    PAGE_VIEW: 'PAGE_VIEW',
    REGISTRATION_STARTED: 'REGISTRATION_STARTED',
    REGISTRATION_COMPLETED: 'REGISTRATION_COMPLETED',
    APPLICATION_SUBMITTED: 'APPLICATION_SUBMITTED',
    REQUEST_SUBMITTED: 'REQUEST_SUBMITTED',
    CHAT_MESSAGE_SENT: 'CHAT_MESSAGE_SENT',
    CHAT_TU_CONFIRMED: 'CHAT_TU_CONFIRMED',
    CHAT_TU_REJECTED: 'CHAT_TU_REJECTED',
    CHAT_SUCCESS: 'CHAT_SUCCESS',
    ACCOUNT_APPROVED: 'ACCOUNT_APPROVED',
};

const uuid = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `s-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const getAnalyticsSessionId = () => {
    try {
        let id = localStorage.getItem(SESSION_KEY);
        if (!id) {
            id = uuid();
            localStorage.setItem(SESSION_KEY, id);
        }
        return id;
    } catch {
        return uuid();
    }
};

/** Путь без basename площадки, как в доке: `/students`. */
export const getAnalyticsPath = (pathname) => {
    const raw = pathname
        || (typeof window !== 'undefined' ? window.location.pathname : '/')
        || '/';
    const base = String(APP_BASE_URL || '/').replace(/\/$/, '');
    if (base && base !== '/' && raw.startsWith(base)) {
        const rest = raw.slice(base.length) || '/';
        return rest.startsWith('/') ? rest : `/${rest}`;
    }
    return raw.startsWith('/') ? raw : `/${raw}`;
};

/**
 * POST /public/analytics/events — без логина, без payload.
 * Ошибки глотаем: аналитика не должна ломать UX.
 */
export const trackAnalyticsEvent = (eventType, options = {}) => {
    if (!eventType) return Promise.resolve();

    const path = getAnalyticsPath(options.path);
    const body = {
        eventType,
        path,
        sessionId: getAnalyticsSessionId(),
    };

    const url = `${API_BASE_URL}public/analytics/events`;

    return fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        keepalive: true,
    }).then((res) => {
        if (!res.ok) {
            console.warn(`[analytics] ${eventType} → ${res.status}`);
        }
    }).catch((err) => {
        console.warn(`[analytics] ${eventType} failed`, err?.message || err);
    });
};
