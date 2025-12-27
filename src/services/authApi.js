import { API_BASE_URL } from '../config/api.js';

const AUTH_FLAG_KEY = 'isAuthenticated';

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

        const data = await response.json();
        console.log('[AUTH] Login successful, cookies:', document.cookie);
        
        // Сохраняем флаг успешной авторизации
        sessionStorage.setItem(AUTH_FLAG_KEY, 'true');
        return data;
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
    // Проверяем флаг в sessionStorage (сохраняется только на время сессии)
    const authFlag = sessionStorage.getItem(AUTH_FLAG_KEY);
    return authFlag === 'true';
};

/**
 * Выход из системы
 */
export const logout = () => {
    sessionStorage.removeItem(AUTH_FLAG_KEY);
    // Cookies будут удалены сервером или можно удалить вручную
};

