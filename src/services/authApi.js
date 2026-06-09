import { API_BASE_URL } from '../config/api.js';
import { apiClientJson } from '../utils/apiClient.js';

export const AUTH_CHANGED_EVENT = 'resume:auth-changed';
export const AUTH_REQUIRED_EVENT = 'resume:auth-required';

/** Инкремент при выходе — отменяет устаревшие syncAuthSession в полёте. */
let authSessionEpoch = 0;
/** Один in-flight syncAuthSession на всех потребителей. */
let syncInFlight = null;

export function notifyAuthChanged() {
    window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT));
}

export { AUTH_CHANGED_EVENT as RESUME_AUTH_CHANGED_EVENT };

const AUTH_FLAG_KEY = 'isAuthenticated';
export const AUTH_USERNAME_KEY = 'resumeAuthUsername';
export const AUTH_ROLE_KEY = 'resumeAuthRole';
export const AUTH_ACCOUNT_STATUS_KEY = 'resumeAccountStatus';
export const AUTH_HINTS_DISABLED_KEY = 'resumeHintsDisabled';
export const AUTH_RETURN_KEY = 'authReturnTo';

export const consumeAuthReturnTo = () => {
    const returnTo = sessionStorage.getItem(AUTH_RETURN_KEY);
    sessionStorage.removeItem(AUTH_RETURN_KEY);
    return returnTo;
};

const parseResponseJson = async (response) => {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
        try {
            return await response.json();
        } catch {
            return null;
        }
    }
    const text = await response.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return { message: text };
    }
};

const parseAuthErrorMessage = (status, rawBody) => {
    let message = rawBody;
    try {
        const parsed = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
        message = parsed?.message || message;
    } catch {
        /* keep raw */
    }
    if (status === 401) {
        return 'Неверный логин или пароль. Если ошибка повторяется — обновите страницу и попробуйте снова.';
    }
    if (status === 403) {
        return message || 'Доступ запрещён. Аккаунт может быть на проверке.';
    }
    return message || `Ошибка входа (${status})`;
};

async function resetStaleSessionBeforeAuth() {
    try {
        await fetch(`${API_BASE_URL}auth/logout`, {
            method: 'POST',
            credentials: 'include',
        });
    } catch {
        /* ignore */
    }
    authSessionEpoch += 1;
    syncInFlight = null;
    localStorage.removeItem(AUTH_FLAG_KEY);
    localStorage.removeItem(`${AUTH_FLAG_KEY}_time`);
    localStorage.removeItem(AUTH_USERNAME_KEY);
    localStorage.removeItem(AUTH_ROLE_KEY);
    localStorage.removeItem(AUTH_ACCOUNT_STATUS_KEY);
    localStorage.removeItem(AUTH_HINTS_DISABLED_KEY);
    sessionStorage.removeItem('showLoginAfter403');
}

export const login = async (username, password) => {
    try {
        await resetStaleSessionBeforeAuth();

        const url = `${API_BASE_URL}auth/login`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                username: String(username || '').trim(),
                password,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            const err = new Error(parseAuthErrorMessage(response.status, errorText));
            err.status = response.status;
            throw err;
        }

        const data = await parseResponseJson(response);

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
    return !!(accessToken || refreshToken);
};

export const isAuthenticated = () => {
    const authFlag = localStorage.getItem(AUTH_FLAG_KEY);
    const authTime = localStorage.getItem(`${AUTH_FLAG_KEY}_time`);

    if (authFlag === 'true') {
        if (authTime) {
            const timeDiff = Date.now() - parseInt(authTime, 10);
            const hours24 = 24 * 60 * 60 * 1000;
            if (timeDiff > hours24) {
                localStorage.removeItem(AUTH_FLAG_KEY);
                localStorage.removeItem(`${AUTH_FLAG_KEY}_time`);
                return false;
            }
        }
        return true;
    }

    if (hasAuthCookies()) {
        localStorage.setItem(AUTH_FLAG_KEY, 'true');
        localStorage.setItem(`${AUTH_FLAG_KEY}_time`, Date.now().toString());
        return true;
    }

    return false;
};

const clearLocalAuth = () => {
    authSessionEpoch += 1;
    syncInFlight = null;
    localStorage.removeItem(AUTH_FLAG_KEY);
    localStorage.removeItem(`${AUTH_FLAG_KEY}_time`);
    localStorage.removeItem(AUTH_USERNAME_KEY);
    localStorage.removeItem(AUTH_ROLE_KEY);
    localStorage.removeItem(AUTH_ACCOUNT_STATUS_KEY);
    localStorage.removeItem(AUTH_HINTS_DISABLED_KEY);
    sessionStorage.removeItem('resumeOnboardingStudent');
    sessionStorage.removeItem('resumeOnboardingRecruiter');
    document.cookie.split(';').forEach((c) => {
        document.cookie = c
            .replace(/^ +/, '')
            .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
    });
};

export const registerStudent = async (body) => {
    await resetStaleSessionBeforeAuth();
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

export const registerRecruiter = async (body) => {
    await resetStaleSessionBeforeAuth();
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

export const changePassword = async (currentPassword, newPassword) => {
    return apiClientJson('auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
    });
};

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
};

async function syncAuthSessionInternal() {
    const epochAtStart = authSessionEpoch;

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
        if (epochAtStart !== authSessionEpoch) {
            return null;
        }

        const prevUsername = localStorage.getItem(AUTH_USERNAME_KEY);
        const prevRole = localStorage.getItem(AUTH_ROLE_KEY);
        const prevStatus = localStorage.getItem(AUTH_ACCOUNT_STATUS_KEY);
        const prevHints = localStorage.getItem(AUTH_HINTS_DISABLED_KEY);

        const nextUsername = data?.username ? String(data.username).trim() : prevUsername;
        const nextRole = data?.role ? String(data.role).trim() : prevRole;
        const nextStatus = data?.accountStatus != null ? String(data.accountStatus) : null;
        const nextHints = data?.hintsDisabled != null ? (data.hintsDisabled ? '1' : '0') : prevHints;

        const changed =
            localStorage.getItem(AUTH_FLAG_KEY) !== 'true' ||
            prevUsername !== nextUsername ||
            prevRole !== nextRole ||
            prevStatus !== nextStatus ||
            prevHints !== nextHints;

        localStorage.setItem(AUTH_FLAG_KEY, 'true');
        localStorage.setItem(`${AUTH_FLAG_KEY}_time`, Date.now().toString());
        if (data?.username) {
            localStorage.setItem(AUTH_USERNAME_KEY, nextUsername);
        }
        if (data?.role) {
            localStorage.setItem(AUTH_ROLE_KEY, nextRole);
        }
        if (data?.accountStatus != null) {
            localStorage.setItem(AUTH_ACCOUNT_STATUS_KEY, nextStatus);
        } else {
            localStorage.removeItem(AUTH_ACCOUNT_STATUS_KEY);
        }
        if (data?.hintsDisabled != null) {
            localStorage.setItem(AUTH_HINTS_DISABLED_KEY, nextHints);
        }
        if (changed) {
            notifyAuthChanged();
        }
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
                if (refreshErr?.status === 401 || refreshErr?.status === 403) {
                    clearLocalAuth();
                    notifyAuthChanged();
                }
                return null;
            }
            console.warn('[AUTH] auth/me still unauthorized after refresh — keeping local session');
            return null;
        }

        throw new Error(`auth/me failed: ${result.status}`);
    } catch (e) {
        console.warn('[AUTH] syncAuthSession failed', e);
        return null;
    }
}

export async function syncAuthSession() {
    if (syncInFlight) {
        return syncInFlight;
    }
    syncInFlight = syncAuthSessionInternal().finally(() => {
        syncInFlight = null;
    });
    return syncInFlight;
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

export function hasApprovedCatalogAccess() {
    if (!isAuthenticated()) return false;
    if (isAdmin()) return true;
    if (isStudentRole()) return true;
    return getAccountStatus() === 'APPROVED';
}

export function hasRecruiterCatalogAccess() {
    return hasApprovedCatalogAccess();
}

export function getAuthenticatedDestination() {
    if (!isAuthenticated()) return null;
    if (isStudentRole()) return '/settings';
    if (hasApprovedCatalogAccess()) return '/students';
    if (isRecruiterRole()) return '/settings';
    return '/settings';
}

export function requestLogin() {
    const redirectTo = getAuthenticatedDestination();
    window.dispatchEvent(
        new CustomEvent(AUTH_REQUIRED_EVENT, {
            detail: redirectTo ? { redirectTo } : undefined,
        }),
    );
}

/** @deprecated use getAccountStatus */
export const getAuthAccountStatus = getAccountStatus;

/** @deprecated use consumeAuthReturnTo + getAuthenticatedDestination */
export const getPostLoginPath = () => {
    const returnTo = consumeAuthReturnTo();
    if (returnTo) return returnTo;
    return getAuthenticatedDestination() || '/settings';
};
