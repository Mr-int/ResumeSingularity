import { API_BASE_URL } from '../config/api.js';
import { apiClientJson } from '../utils/apiClient.js';

export const AUTH_CHANGED_EVENT = 'resume:auth-changed';
export const AUTH_REQUIRED_EVENT = 'resume:auth-required';

/** Инкремент при выходе — отменяет устаревшие syncAuthSession в полёте. */
let authSessionEpoch = 0;
/** Один in-flight syncAuthSession на всех потребителей. */
let syncInFlight = null;
/** Не дёргать auth/me сразу после 5xx — бэкенд может быть недоступен. */
let authMeServerErrorUntil = 0;
const AUTH_ME_SERVER_ERROR_COOLDOWN_MS = 30_000;

const AUTH_FLAG_KEY = 'isAuthenticated';
/** Логин с последнего входа — для UI чатов (сравнение с authorUsername). */
export const AUTH_USERNAME_KEY = 'resumeAuthUsername';
/** Телефон, подтверждённый при регистрации (auth/me его не отдаёт). */
export const AUTH_PHONE_KEY = 'resumeAuthPhone';
/** Email, подтверждённый при регистрации (auth/me может не отдавать). */
export const AUTH_EMAIL_KEY = 'resumeAuthEmail';
/** Роль с последнего входа (STUDENT, RECRUITER, ADMIN). */
export const AUTH_ROLE_KEY = 'resumeAuthRole';
export const AUTH_ACCOUNT_STATUS_KEY = 'resumeAccountStatus';
export const AUTH_HINTS_DISABLED_KEY = 'resumeHintsDisabled';
export const AUTH_RETURN_KEY = 'authReturnTo';

export function notifyAuthChanged() {
    window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT));
}

export function getStoredAuthPhone() {
    try {
        return (localStorage.getItem(AUTH_PHONE_KEY) || '').trim();
    } catch {
        return '';
    }
}

function persistAuthPhone(phoneNumber) {
    const normalized = String(phoneNumber || '').trim();
    if (!normalized) return;
    try {
        localStorage.setItem(AUTH_PHONE_KEY, normalized);
    } catch {
        /* ignore */
    }
}

export function getStoredAuthEmail() {
    try {
        return (localStorage.getItem(AUTH_EMAIL_KEY) || '').trim();
    } catch {
        return '';
    }
}

export function persistAuthEmail(email) {
    const normalized = String(email || '').trim().toLowerCase();
    if (!normalized) return;
    try {
        localStorage.setItem(AUTH_EMAIL_KEY, normalized);
    } catch {
        /* ignore */
    }
}

// Re-export for hooks
export { AUTH_CHANGED_EVENT as RESUME_AUTH_CHANGED_EVENT };

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
    let parsed = null;
    try {
        parsed = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
        message = parsed?.message || message;
        if (Array.isArray(parsed?.errors) && parsed.errors.length) {
            message = parsed.errors.join('; ');
        } else if (Array.isArray(parsed?.fieldErrors) && parsed.fieldErrors.length) {
            message = parsed.fieldErrors
                .map((f) => f.message || `${f.field}: ${f.defaultMessage || ''}`)
                .join('; ');
        }
    } catch {
        /* keep raw */
    }
    if (status === 401) {
        return 'Неверный логин или пароль. Если ошибка повторяется — обновите страницу и попробуйте снова.';
    }
    if (status === 403) {
        return message || 'Доступ запрещён. Аккаунт может быть на проверке.';
    }
    if (status === 400) {
        const lower = String(message || '').toLowerCase();
        if (lower.includes('username') || lower.includes('логин')) {
            return 'Логин занят или не подходит. Используйте латинские буквы, цифры и подчёркивание (3–64 символа).';
        }
        if (
            lower.includes('verification')
            || lower.includes('верификац')
            || lower.includes('phoneverification')
        ) {
            return 'Подтверждение телефона недействительно или истекло. Подтвердите номер в Telegram заново.';
        }
    }
    return message || `Ошибка (${status})`;
};

/** Сбрасывает протухшую серверную сессию, чтобы login не ломался из‑за старых cookies. */
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
    localStorage.removeItem(AUTH_PHONE_KEY);
    localStorage.removeItem(AUTH_EMAIL_KEY);
    localStorage.removeItem(AUTH_ROLE_KEY);
    localStorage.removeItem(AUTH_ACCOUNT_STATUS_KEY);
    localStorage.removeItem(AUTH_HINTS_DISABLED_KEY);
    sessionStorage.removeItem('showLoginAfter403');
}

/**
 * Авторизация пользователя
 * @param {string} username - Имя пользователя
 * @param {string} password - Пароль
 * @returns {Promise<Object>} Ответ сервера
 */
export const login = async (username, password) => {
    try {
        await resetStaleSessionBeforeAuth();

        const url = `${API_BASE_URL}auth/login`;
        console.log('[AUTH] Attempting login to:', url);

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

        console.log('[AUTH] Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[AUTH] Error response:', errorText);
            const err = new Error(parseAuthErrorMessage(response.status, errorText));
            err.status = response.status;
            throw err;
        }

        const data = await parseResponseJson(response);
        console.log('[AUTH] Login successful, response data:', data);

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
    authSessionEpoch += 1;
    syncInFlight = null;
    localStorage.removeItem(AUTH_FLAG_KEY);
    localStorage.removeItem(`${AUTH_FLAG_KEY}_time`);
    localStorage.removeItem(AUTH_USERNAME_KEY);
    localStorage.removeItem(AUTH_PHONE_KEY);
    localStorage.removeItem(AUTH_EMAIL_KEY);
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

/**
 * POST /auth/register-student
 * @param {{ username: string, password: string, passwordConfirm: string, name?: string, phoneNumber: string, phoneVerificationId: string }} body
 */
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
        const err = new Error(parseAuthErrorMessage(response.status, text));
        err.status = response.status;
        throw err;
    }
    localStorage.setItem(AUTH_FLAG_KEY, 'true');
    localStorage.setItem(`${AUTH_FLAG_KEY}_time`, Date.now().toString());
    if (body.username != null && String(body.username).trim()) {
        localStorage.setItem(AUTH_USERNAME_KEY, String(body.username).trim());
    }
    persistAuthPhone(body.phoneNumber);
    persistAuthEmail(body.email);
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
        const err = new Error(parseAuthErrorMessage(response.status, text));
        err.status = response.status;
        throw err;
    }
    localStorage.setItem(AUTH_FLAG_KEY, 'true');
    localStorage.setItem(`${AUTH_FLAG_KEY}_time`, Date.now().toString());
    if (body.username != null && String(body.username).trim()) {
        localStorage.setItem(AUTH_USERNAME_KEY, String(body.username).trim());
    }
    persistAuthPhone(body.phoneNumber);
    persistAuthEmail(body.email);
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
    console.log('[AUTH] Logged out, cleared all auth data');
};

/**
 * GET /auth/me — синхронизирует флаг входа, логин и роль на клиенте.
 * @returns {Promise<{ username: string, role: string } | null>}
 */
async function syncAuthSessionInternal() {
    const epochAtStart = authSessionEpoch;

    if (Date.now() < authMeServerErrorUntil) {
        return null;
    }

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
        if (data?.phoneNumber) {
            persistAuthPhone(data.phoneNumber);
        }
        if (data?.email) {
            persistAuthEmail(data.email);
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

        if (result.status >= 500) {
            authMeServerErrorUntil = Date.now() + AUTH_ME_SERVER_ERROR_COOLDOWN_MS;
            console.warn(`[AUTH] auth/me server error (${result.status}) — keeping local session`);
            return null;
        }

        throw new Error(`auth/me failed: ${result.status}`);
    } catch (e) {
        console.warn('[AUTH] syncAuthSession failed', e);
        return null;
    }
}

/** GET /auth/me — текущая сессия без побочных эффектов на клиенте. */
export const getAuthMe = () => apiClientJson('auth/me', { method: 'GET' });

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

export function isAccountPending(status = getAccountStatus()) {
    return status === 'PENDING_APPROVAL' || status === 'PENDING';
}

export function isAccountApproved(status = getAccountStatus()) {
    if (isAdmin()) return true;
    return status === 'APPROVED';
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

/** Одобренный аккаунт или админ — доступ к каталогам после регистрации. */
export function hasApprovedCatalogAccess() {
    if (!isAuthenticated()) return false;
    if (isAdmin()) return true;
    const status = getAccountStatus();
    if (isAccountPending(status) || status === 'REJECTED') return false;
    if (isStudentRole()) return isAccountApproved(status);
    return isAccountApproved(status);
}

/** Отклик на вакансию — только одобренный студент (как на бэкенде). */
export function canStudentApplyToVacancies() {
    if (!isAuthenticated() || !isStudentRole()) return false;
    return isAccountApproved(getAccountStatus());
}

/** Полный каталог студентов (/student/*) — одобренные пользователи. */
export function hasRecruiterCatalogAccess() {
    return hasApprovedCatalogAccess();
}

/** Куда направить уже авторизованного пользователя вместо модала входа. */
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

