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
 * @param {{ eventType: string, path: string, sessionId?: string, userAgent?: string }} body
 */
export const ingestAnalyticsEvent = async (body) => {
    const payload = {
        eventType: body.eventType,
        path: body.path,
        sessionId: body.sessionId || getOrCreateSessionId(),
        userAgent: body.userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : undefined),
    };

    const response = await fetch(`${API_BASE_URL}public/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'omit',
        body: JSON.stringify(payload),
    });

    if (response.status === 429) {
        const err = new Error('Слишком много событий аналитики');
        err.status = 429;
        throw err;
    }
    if (!response.ok) {
        const text = await response.text();
        const err = new Error(text || `Ошибка аналитики ${response.status}`);
        err.status = response.status;
        throw err;
    }
};
