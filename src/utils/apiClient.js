import { API_BASE_URL } from '../config/api.js';
import { refreshSession } from '../services/authApi.js';
import { appPath } from './appBase.js';

const clearAuthAndRedirect = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('isAuthenticated_time');
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
    const method = options.method || 'GET';
    const headers = { ...defaultHeaders, ...options.headers };
    const body = options.body;

    console.log('[API Client] Base URL:', API_BASE_URL);
    console.log('[API Client] Endpoint:', endpoint);

    const url = `${API_BASE_URL}${endpoint}`;
    console.log('[API Client] Full URL:', url);
    console.log('[API Client] Request Body:', body);

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
            console.log('[API] 401 Unauthorized - redirecting to login');
            clearAuthAndRedirect();
            throw new Error('HTTP error! status: 401 - Unauthorized');
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
            // (иначе студент вылетает из аккаунта на create company и т.п.).
            // skipSessionClearOn403 — ожидаемый soft-probe (чаты до заполнения профиля и т.п.)
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
        // Уже размеченные ответы API (403 soft и т.п.) — без повторного error в консоль
        if (error?.status) {
            if (!error.softForbidden) {
                console.warn(`[API] ${error.status} for ${endpoint}:`, error.message);
            }
            throw error;
        }

        console.error(`[API] Error for endpoint ${endpoint}:`, error);
        console.error('[API] Full URL was:', url);

        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            throw new Error(`Не удалось подключиться к серверу API. Проверьте, запущен ли сервер по адресу: ${API_BASE_URL}`);
        }

        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            error.requiresAuth = true;
        }

        throw error;
    }
};