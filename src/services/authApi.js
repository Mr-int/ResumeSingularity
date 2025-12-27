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
 * Проверка, авторизован ли пользователь
 * @returns {boolean} true если пользователь авторизован
 */
export const isAuthenticated = () => {
    // Проверяем флаг в localStorage (сохраняется между сессиями)
    const authFlag = localStorage.getItem(AUTH_FLAG_KEY);
    // Также проверяем наличие cookies (дополнительная проверка)
    const hasCookies = document.cookie.length > 0;
    return authFlag === 'true' || hasCookies;
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

