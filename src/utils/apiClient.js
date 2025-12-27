import { API_BASE_URL } from '../config/api.js';
import { logout } from '../services/authApi.js';

/**
 * Централизованный fetch клиент с обработкой ошибок авторизации
 * @param {string} url - URL для запроса (относительный путь)
 * @param {RequestInit} options - Опции для fetch
 * @returns {Promise<Response>} Ответ сервера
 */
export const apiClient = async (url, options = {}) => {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url.replace(/^\//, '')}`;
    
    const defaultOptions = {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    };

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    };

    try {
        const response = await fetch(fullUrl, mergedOptions);

        // Если получили 403, значит авторизация недействительна
        if (response.status === 403) {
            console.warn('[API] 403 Forbidden - clearing auth and showing login');
            
            // Очищаем авторизацию
            logout();
            
            // Сохраняем информацию о том, что нужно показать форму входа
            sessionStorage.setItem('showLoginAfter403', 'true');
            
            // Выбрасываем специальную ошибку
            const error = new Error('Unauthorized - please login again');
            error.status = 403;
            error.requiresAuth = true;
            throw error;
        }

        return response;
    } catch (error) {
        // Если это наша ошибка 403, пробрасываем дальше
        if (error.requiresAuth) {
            throw error;
        }
        
        // Для других ошибок просто пробрасываем
        throw error;
    }
};

/**
 * Обертка для JSON запросов
 */
export const apiClientJson = async (url, options = {}) => {
    const response = await apiClient(url, options);
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    
    // Если тело пустое, возвращаем null
    if (contentLength && parseInt(contentLength) === 0) {
        return null;
    }

    if (contentType && contentType.includes('application/json')) {
        try {
            return await response.json();
        } catch (e) {
            console.warn('[API] Failed to parse JSON:', e);
            return null;
        }
    }

    return await response.text();
};

