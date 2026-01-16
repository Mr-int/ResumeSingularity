import { API_BASE_URL } from '../config/api.js';

export const apiClientJson = async (endpoint, options = {}) => {
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    console.log('[API Client] Base URL:', API_BASE_URL);
    console.log('[API Client] Endpoint:', endpoint);

    const url = `${API_BASE_URL}${endpoint}`;
    console.log('[API Client] Full URL:', url);
    console.log('[API Client] Request Body:', options.body);

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
            credentials: 'include',
        });

        if (response.status === 401) {
            console.log('[API] 401 Unauthorized - redirecting to login');
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('isAuthenticated_time');
            window.location.href = '/login';
            throw new Error('HTTP error! status: 401 - Unauthorized');
        }

        if (response.status === 403) {
            console.log('[API] 403 Forbidden - access denied');
            const error = new Error('HTTP error! status: 403 - Forbidden');
            error.status = 403;
            throw error;
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[API] HTTP error! status: ${response.status}, endpoint: ${endpoint}`);
            const error = new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            error.status = response.status;
            throw error;
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
        console.error(`[API] Error for endpoint ${endpoint}:`, error);
        console.error('[API] Full URL was:', url);

        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            throw new Error(`Не удалось подключиться к серверу API. Проверьте, запущен ли сервер по адресу: ${window.location.origin}/api/`);
        }

        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            error.requiresAuth = true;
        }

        throw error;
    }
};