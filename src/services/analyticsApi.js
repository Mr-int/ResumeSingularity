import { API_BASE_URL } from '../config/api.js';

const SESSION_KEY = 'resumeAnalyticsSessionId';

function getOrCreateSessionId() {
    try {
        let id = localStorage.getItem(SESSION_KEY);
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem(SESSION_KEY, id);
        }
        return id;
    } catch {
        return crypto.randomUUID();
    }
}

/**
 * POST /public/analytics/events
 * @param {{ eventType?: string, path: string }} payload
 */
export async function trackAnalyticsEvent({ eventType = 'PAGE_VIEW', path }) {
    if (!path) return;
    try {
        await fetch(`${API_BASE_URL}public/analytics/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventType,
                path,
                sessionId: getOrCreateSessionId(),
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent?.slice(0, 512) : undefined,
            }),
        });
    } catch {
        /* не блокируем навигацию */
    }
}
