import { API_BASE_URL } from '../config/api.js';
import { clearLocalAuth, refreshSession } from '../services/authApi.js';
import { appPath } from './appBase.js';

let authRedirectInFlight = false;

const clearAuthAndRedirect = () => {
    if (authRedirectInFlight) return;
    authRedirectInFlight = true;
    clearLocalAuth();
    sessionStorage.setItem('showLoginAfter403', 'true');
    window.dispatchEvent(new CustomEvent('resume:auth-required'));
    const path = window.location.pathname;
    const loginPath = appPath('login');
    const registrationPath = appPath('registration');
    if (!path.startsWith(loginPath) && !path.startsWith(registrationPath)) {
        window.location.href = loginPath;
    }
};

export const apiClientJson = async (endpoint, options = {}) => {
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    const skipSessionClearOn403 = options.skipSessionClearOn403 === true;
    const skipAuthRedirect = options.skipAuthRedirect === true;
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
                    // Refresh не удался — сессия реально мертва
                    if (!skipAuthRedirect) {
                        console.log('[API] 401 + refresh failed - redirecting to login');
                        clearAuthAndRedirect();
                    }
                    const unauthorized = new Error('HTTP error! status: 401 - Unauthorized');
                    unauthorized.status = 401;
                    unauthorized.requiresAuth = true;
                    throw unauthorized;
                }
            }

            // После успешного refresh всё ещё 401 — чаще wrong-role / ACL,
            // а не «сессия умерла». Не выкидываем из аккаунта.
            const unauthorized = new Error('HTTP error! status: 401 - Unauthorized');
            unauthorized.status = 401;
            unauthorized.requiresAuth = true;
            if (!skipAuthRedirect && !options._retriedAfterRefresh) {
                console.log('[API] 401 Unauthorized - redirecting to login');
                clearAuthAndRedirect();
            } else {
                console.warn(`[API] 401 for ${endpoint} after refresh — session kept`);
            }
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
            // 403 = доступ запрещён при живой сессии; сессию не сбрасываем
            const error = new Error(responseBody?.message || 'HTTP error! status: 403 - Forbidden');
            error.status = 403;
            error.responseBody = responseBody;
            error.softForbidden = skipSessionClearOn403;
            throw error;
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[API] HTTP error! status: ${response.status}, endpoint: ${endpoint}`, errorText);
            let responseBody = null;
            try {
                responseBody = errorText ? JSON.parse(errorText) : null;
            } catch (_) {
                responseBody = { message: errorText };
            }
            const err = new Error(responseBody?.message || `Ошибка ${response.status}`);
            err.status = response.status;
            err.responseBody = responseBody;
            throw err;
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        const text = await response.text();
        if (text) {
            try {
                return JSON.parse(text);
            } catch (e) {
                return { message: text };
            }
        }
        return {};
    } catch (error) {
        if (error?.status) {
            if (!error.softForbidden) {
                console.warn(`[API] ${error.status} for ${endpoint}:`, error.message);
            }
            throw error;
        }

        console.error(`[API] Error for endpoint ${endpoint}:`, error);

        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            throw new Error(`Не удалось подключиться к серверу API. Проверьте, запущен ли сервер по адресу: ${API_BASE_URL}`);
        }

        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            error.requiresAuth = true;
        }

        throw error;
    }
};
