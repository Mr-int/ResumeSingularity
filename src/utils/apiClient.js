import { API_BASE_URL } from '../config/api.js';
import { refreshSession } from '../services/authApi.js';
import { formatApiUserMessage, isPendingApprovalError } from './apiErrors.js';

const clearLocalAuthSilently = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('isAuthenticated_time');
};

export const apiClientJson = async (endpoint, options = {}) => {
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    const skipSessionClearOn403 = options.skipSessionClearOn403 === true;
    const quiet = options.quiet === true;
    const method = options.method || 'GET';
    const headers = { ...defaultHeaders, ...options.headers };
    const body = options.body;

    const url = `${API_BASE_URL}${endpoint}`;

    try {
        const response = await fetch(url, {
            method,
            headers,
            body,
            credentials: 'include',
            signal: options.signal,
        });

        if (response.status === 401) {
            if (!options._retriedAfterRefresh && !endpoint.startsWith('auth/')) {
                try {
                    await refreshSession();
                    return apiClientJson(endpoint, { ...options, _retriedAfterRefresh: true });
                } catch {
                    /* fall through */
                }
            }
            console.log('[API] 401 Unauthorized — session cleared silently');
            clearLocalAuthSilently();
            const unauthorized = new Error('HTTP error! status: 401 - Unauthorized');
            unauthorized.status = 401;
            unauthorized.requiresAuth = true;
            throw unauthorized;
        }

        if (response.status === 403) {
            const errorText = await response.text();
            let responseBody = null;
            try {
                responseBody = errorText ? JSON.parse(errorText) : null;
            } catch (_) {
                responseBody = { message: errorText };
            }
            if (!skipSessionClearOn403 && !quiet) {
                console.log('[API] 403 Forbidden — access denied');
            } else if (!quiet) {
                console.log('[API] 403 Forbidden (soft probe)');
            }
            const error = new Error(
                formatApiUserMessage({ status: 403, message: responseBody?.message, responseBody }),
            );
            error.status = 403;
            error.responseBody = responseBody;
            throw error;
        }

        if (!response.ok) {
            const errorText = await response.text();
            if (!quiet) {
                console.error(`[API] HTTP error! status: ${response.status}, endpoint: ${endpoint}`, errorText);
            }
            let responseBody = null;
            try {
                responseBody = errorText ? JSON.parse(errorText) : null;
            } catch (_) {
                responseBody = { message: errorText };
            }
            const err = new Error(
                formatApiUserMessage({ status: response.status, message: responseBody?.message, responseBody }),
            );
            err.status = response.status;
            err.responseBody = responseBody;
            throw err;
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else {
            const text = await response.text();
            if (text) {
                try {
                    return JSON.parse(text);
                } catch (e) {
                    return { message: text };
                }
            }
            return {};
        }
    } catch (error) {
        if (!quiet && !isPendingApprovalError(error)) {
            console.error(`[API] Error for endpoint ${endpoint}:`, error);
            console.error('[API] Full URL was:', url);
        }

        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            throw new Error(`Не удалось подключиться к серверу API. Проверьте, запущен ли сервер по адресу: ${window.location.origin}/api/`);
        }

        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            error.requiresAuth = true;
        }

        throw error;
    }
};