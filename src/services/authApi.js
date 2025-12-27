import { API_BASE_URL } from '../config/api.js';

const AUTH_FLAG_KEY = 'isAuthenticated';

/**
 * Авторизация пользователя
 * @param {string} username - Имя пользователя
 * @param {string} password - Пароль
 * @returns {Promise<Object>} Ответ сервера
 */
export const login = async (username, password) => {
    try {
        const url = `${API_BASE_URL}auth/login`;
        console.log('[AUTH] Attempting login to:', url);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', 
            body: JSON.stringify({
                username,
                password
            })
        });

        console.log('[AUTH] Response status:', response.status);
        console.log('[AUTH] Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[AUTH] Error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        // Проверяем, есть ли тело ответа
        const contentType = response.headers.get('content-type');
        const contentLength = response.headers.get('content-length');
        
        let data = null;
        
        // Если есть тело и это JSON, парсим его
        if (contentLength && parseInt(contentLength) > 0) {
            if (contentType && contentType.includes('application/json')) {
                try {
                    data = await response.json();
                } catch (e) {
                    console.warn('[AUTH] Failed to parse JSON, response might be empty');
                }
            } else {
                // Если не JSON, читаем как текст
                const text = await response.text();
                if (text) {
                    try {
                        data = JSON.parse(text);
                    } catch (e) {
                        data = { message: text };
                    }
                }
            }
        }
        
        console.log('[AUTH] Login successful, cookies:', document.cookie);
        console.log('[AUTH] Response data:', data);
        
        // Сохраняем флаг успешной авторизации в localStorage для постоянного хранения
        localStorage.setItem(AUTH_FLAG_KEY, 'true');
        return data || { success: true };
    } catch (error) {
        console.error('[AUTH] Error during login:', error);
        throw error;
    }
};

/**
 * Получить значение cookie по имени
 * @param {string} name - Имя cookie
 * @returns {string|null} Значение cookie или null
 */
const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop().split(';').shift();
    }
    return null;
};

/**
 * Проверка наличия cookies авторизации
 * @returns {boolean} true если есть ACCESS_TOKEN или REFRESH_TOKEN
 */
const hasAuthCookies = () => {
    const accessToken = getCookie('ACCESS_TOKEN');
    const refreshToken = getCookie('REFRESH_TOKEN');
    const hasTokens = !!(accessToken || refreshToken);
    
    console.log('[AUTH] Cookie check - ACCESS_TOKEN:', !!accessToken, 'REFRESH_TOKEN:', !!refreshToken);
    
    return hasTokens;
};

/**
 * Проверка, авторизован ли пользователь
 * @returns {boolean} true если пользователь авторизован
 */
export const isAuthenticated = () => {
    // Проверяем наличие токенов в cookies (основная проверка)
    const hasTokens = hasAuthCookies();
    
    // Проверяем флаг в localStorage (дополнительная проверка)
    const authFlag = localStorage.getItem(AUTH_FLAG_KEY);
    
    console.log('[AUTH] isAuthenticated - hasTokens:', hasTokens, 'authFlag:', authFlag);
    
    // Пользователь авторизован если есть токены ИЛИ есть флаг
    const isAuth = hasTokens || authFlag === 'true';
    
    // Если токены удалены, но флаг есть - очищаем флаг
    if (!hasTokens && authFlag === 'true') {
        console.log('[AUTH] Tokens removed, clearing flag');
        localStorage.removeItem(AUTH_FLAG_KEY);
        return false;
    }
    
    return isAuth;
};

/**
 * Выход из системы
 */
export const logout = () => {
    localStorage.removeItem(AUTH_FLAG_KEY);
    // Cookies будут удалены сервером или можно удалить вручную
    // Очищаем все cookies
    document.cookie.split(";").forEach((c) => {
        document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
};

