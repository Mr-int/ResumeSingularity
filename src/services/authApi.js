import { API_BASE_URL } from '../config/api.js';

export const AUTH_CHANGED_EVENT = 'resume:auth-changed';

export function notifyAuthChanged() {
    window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT));
}

// Re-export for hooks
export { AUTH_CHANGED_EVENT as RESUME_AUTH_CHANGED_EVENT };

const AUTH_FLAG_KEY = 'isAuthenticated';
/** Логин с последнего входа — для UI чатов (сравнение с authorUsername). */
export const AUTH_USERNAME_KEY = 'resumeAuthUsername';
/** Роль с последнего входа (STUDENT, RECRUITER, ADMIN). */
export const AUTH_ROLE_KEY = 'resumeAuthRole';
export const AUTH_ACCOUNT_STATUS_KEY = 'resumeAccountStatus';
export const AUTH_HINTS_DISABLED_KEY = 'resumeHintsDisabled';
export const AUTH_RETURN_KEY = 'authReturnTo';

export const consumeAuthReturnTo = () => {
    const returnTo = sessionStorage.getItem(AUTH_RETURN_KEY);
    sessionStorage.removeItem(AUTH_RETURN_KEY);
    return returnTo;
};

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

        const contentType = response.headers.get('content-type');
        const contentLength = response.headers.get('content-length');
        
        let data = null;

        if (contentLength && parseInt(contentLength) > 0) {
            if (contentType && contentType.includes('application/json')) {
                try {
                    data = await response.json();
                } catch (e) {
                    console.warn('[AUTH] Failed to parse JSON, response might be empty');
                }
            } else {
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

        const cookiesAfterLogin = document.cookie;
        console.log('[AUTH] Login successful, cookies:', cookiesAfterLogin);
        console.log('[AUTH] Response data:', data);

        const setCookieHeader = response.headers.get('set-cookie');
        console.log('[AUTH] Set-Cookie header:', setCookieHeader);

        localStorage.setItem(AUTH_FLAG_KEY, 'true');

        localStorage.setItem(`${AUTH_FLAG_KEY}_time`, Date.now().toString());
        if (username != null && String(username).trim()) {
            localStorage.setItem(AUTH_USERNAME_KEY, String(username).trim());
        }

        await syncAuthSession();
        notifyAuthChanged();

        return data || { success: true };
    } catch (error) {
        console.error('[AUTH] Error during login:', error);
        throw error;
    }
};

const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop().split(';').shift();
    }
    return null;
};

const hasAuthCookies = () => {
    const accessToken = getCookie('ACCESS_TOKEN');
    const refreshToken = getCookie('REFRESH_TOKEN');
    const hasTokens = !!(accessToken || refreshToken);
    
    console.log('[AUTH] Cookie check - ACCESS_TOKEN:', !!accessToken, 'REFRESH_TOKEN:', !!refreshToken);
    
    return hasTokens;
};

export const isAuthenticated = () => {
    const authFlag = localStorage.getItem(AUTH_FLAG_KEY);
    const authTime = localStorage.getItem(`${AUTH_FLAG_KEY}_time`);

    const hasTokens = hasAuthCookies();
    
    console.log('[AUTH] isAuthenticated - hasTokens:', hasTokens, 'authFlag:', authFlag, 'authTime:', authTime);

    if (authFlag === 'true') {
        if (authTime) {
            const timeDiff = Date.now() - parseInt(authTime);
            const hours24 = 24 * 60 * 60 * 1000;
            if (timeDiff > hours24) {
                console.log('[AUTH] Session expired, clearing flag');
                localStorage.removeItem(AUTH_FLAG_KEY);
                localStorage.removeItem(`${AUTH_FLAG_KEY}_time`);
                return false;
            }
        }
        return true;
    }

    if (hasTokens) {
        console.log('[AUTH] Tokens found, setting flag');
        localStorage.setItem(AUTH_FLAG_KEY, 'true');
        localStorage.setItem(`${AUTH_FLAG_KEY}_time`, Date.now().toString());
        return true;
    }
    
    return false;
};

const clearLocalAuth = () => {
    localStorage.removeItem(AUTH_FLAG_KEY);
    localStorage.removeItem(`${AUTH_FLAG_KEY}_time`);
    localStorage.removeItem(AUTH_USERNAME_KEY);
    localStorage.removeItem(AUTH_ROLE_KEY);
    localStorage.removeItem(AUTH_ACCOUNT_STATUS_KEY);
    localStorage.removeItem(AUTH_HINTS_DISABLED_KEY);
    document.cookie.split(';').forEach((c) => {
        document.cookie = c
            .replace(/^ +/, '')
            .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
    });
};

/**
 * POST /auth/register-student
 * @param {{ username: string, password: string, passwordConfirm: string, name?: string, phoneNumber: string, phoneVerificationId: string }} body
 */
export const registerStudent = async (body) => {
    const url = `${API_BASE_URL}auth/register-student`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const text = await response.text();
        let msg = text;
        try {
            msg = JSON.parse(text).message || text;
        } catch {
            /* empty */
        }
        const err = new Error(msg || `Ошибка ${response.status}`);
        err.status = response.status;
        throw err;
    }
    localStorage.setItem(AUTH_FLAG_KEY, 'true');
    localStorage.setItem(`${AUTH_FLAG_KEY}_time`, Date.now().toString());
    if (body.username != null && String(body.username).trim()) {
        localStorage.setItem(AUTH_USERNAME_KEY, String(body.username).trim());
    }
    await syncAuthSession();
    notifyAuthChanged();
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
        return response.json();
    }
    return {};
};

/**
 * POST /auth/register-recruiter
 */
export const registerRecruiter = async (body) => {
    const url = `${API_BASE_URL}auth/register-recruiter`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const text = await response.text();
        let msg = text;
        try {
            msg = JSON.parse(text).message || text;
        } catch {
            /* empty */
        }
        const err = new Error(msg || `Ошибка ${response.status}`);
        err.status = response.status;
        throw err;
    }
    localStorage.setItem(AUTH_FLAG_KEY, 'true');
    localStorage.setItem(`${AUTH_FLAG_KEY}_time`, Date.now().toString());
    if (body.username != null && String(body.username).trim()) {
        localStorage.setItem(AUTH_USERNAME_KEY, String(body.username).trim());
    }
    await syncAuthSession();
    notifyAuthChanged();
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
        return response.json();
    }
    return {};
};

/**
 * POST /auth/refresh
 */
export const refreshSession = async () => {
    const url = `${API_BASE_URL}auth/refresh`;
    const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
    });
    if (!response.ok) {
        const err = new Error(`Refresh failed: ${response.status}`);
        err.status = response.status;
        throw err;
    }
    localStorage.setItem(AUTH_FLAG_KEY, 'true');
    localStorage.setItem(`${AUTH_FLAG_KEY}_time`, Date.now().toString());
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
        return response.json();
    }
    return {};
};

/**
 * POST /auth/logout + очистка клиента
 */
export const logoutServer = async () => {
    try {
        await fetch(`${API_BASE_URL}auth/logout`, {
            method: 'POST',
            credentials: 'include',
        });
    } catch (e) {
        console.warn('[AUTH] logout request failed', e);
    } finally {
        clearLocalAuth();
        notifyAuthChanged();
    }
};

export const logout = () => {
    clearLocalAuth();
    notifyAuthChanged();
    console.log('[AUTH] Logged out, cleared all auth data');
};

/**
 * GET /auth/me — синхронизирует флаг входа, логин и роль на клиенте.
 * @returns {Promise<{ username: string, role: string } | null>}
 */
export async function syncAuthSession() {
    const fetchMe = async () => {
        const response = await fetch(`${API_BASE_URL}auth/me`, {
            method: 'GET',
            credentials: 'include',
        });
        if (!response.ok) {
            return { ok: false, status: response.status };
        }
        return { ok: true, data: await response.json() };
    };

    const applyMeData = (data) => {
        localStorage.setItem(AUTH_FLAG_KEY, 'true');
        localStorage.setItem(`${AUTH_FLAG_KEY}_time`, Date.now().toString());
        if (data?.username) {
            localStorage.setItem(AUTH_USERNAME_KEY, String(data.username).trim());
        }
        if (data?.role) {
            localStorage.setItem(AUTH_ROLE_KEY, String(data.role).trim());
        }
        if (data?.accountStatus != null) {
            localStorage.setItem(AUTH_ACCOUNT_STATUS_KEY, String(data.accountStatus));
        } else {
            localStorage.removeItem(AUTH_ACCOUNT_STATUS_KEY);
        }
        if (data?.hintsDisabled != null) {
            localStorage.setItem(AUTH_HINTS_DISABLED_KEY, data.hintsDisabled ? '1' : '0');
        }
        notifyAuthChanged();
        return data;
    };

    try {
        let result = await fetchMe();
        if (result.ok) {
            return applyMeData(result.data);
        }

        if (result.status === 401) {
            try {
                await refreshSession();
                result = await fetchMe();
                if (result.ok) {
                    return applyMeData(result.data);
                }
            } catch (refreshErr) {
                console.warn('[AUTH] refresh after auth/me 401 failed', refreshErr);
            }
            clearLocalAuth();
            notifyAuthChanged();
            return null;
        }

        throw new Error(`auth/me failed: ${result.status}`);
    } catch (e) {
        console.warn('[AUTH] syncAuthSession failed', e);
        return null;
    }
}

export function getAuthRole() {
    return localStorage.getItem(AUTH_ROLE_KEY);
}

export function isAdmin() {
    return getAuthRole() === 'ADMIN';
}

export function getAccountStatus() {
    return localStorage.getItem(AUTH_ACCOUNT_STATUS_KEY);
}

export function isHintsDisabled() {
    if (localStorage.getItem('resumeHintsDisabledLocal') === '1') return true;
    return localStorage.getItem(AUTH_HINTS_DISABLED_KEY) === '1';
}

export function isRecruiterRole() {
    const role = getAuthRole();
    return role === 'RECRUITER' || role === 'USER';
}

export function isStudentRole() {
    return getAuthRole() === 'STUDENT';
}

