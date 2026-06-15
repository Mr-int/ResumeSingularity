import { API_BASE_URL } from '../config/api.js';
import { refreshSession } from '../services/authApi.js';
import {
    formatApiUserMessage,
    isChatMessagesBlockedError,
    isPendingApprovalError,
} from './apiErrors.js';

const clearLocalAuthSilently = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('isAuthenticated_time');
};

const isHtmlBody = (text) => {
    const value = String(text || '').trim();
    return value.startsWith('<') || value.includes('<html') || value.includes('<!DOCTYPE');
};

const DEFAULT_REQUEST_TIMEOUT_MS = 25_000;

const mergeAbortSignals = (timeoutMs, externalSignal) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    const onExternalAbort = () => controller.abort();
    if (externalSignal) {
        if (externalSignal.aborted) {
            controller.abort();
        } else {
            externalSignal.addEventListener('abort', onExternalAbort, { once: true });
        }
    }

    return {
        signal: controller.signal,
        cleanup: () => {
            window.clearTimeout(timeoutId);
            if (externalSignal) {
                externalSignal.removeEventListener('abort', onExternalAbort);
            }
        },
    };
};

const buildHttpError = (status, errorText, responseBody) => {
    const message = responseBody?.message || (isHtmlBody(errorText) ? '' : errorText);
    const err = new Error(formatApiUserMessage({ status, message, responseBody }));
    err.status = status;
    err.responseBody = responseBody;
    return err;
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

    const timeoutMs =
        typeof options.timeoutMs === 'number' && options.timeoutMs > 0
            ? options.timeoutMs
            : DEFAULT_REQUEST_TIMEOUT_MS;
    const { signal, cleanup } = mergeAbortSignals(timeoutMs, options.signal);

    try {
        const response = await fetch(url, {
            method,
            headers,
            body,
            credentials: options.credentials ?? 'include',
            signal,
        });
        cleanup();

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
            const err = buildHttpError(response.status, errorText, responseBody);
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
        cleanup();

        if (error?.name === 'AbortError') {
            const timeoutError = new Error('Превышено время ожидания ответа от сервера');
            timeoutError.status = 408;
            throw timeoutError;
        }

        if (!quiet && !isPendingApprovalError(error) && !isChatMessagesBlockedError(error)) {
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