import { API_BASE_URL } from '../config/api.js';

const AUTH_FLAG_KEY = 'isAuthenticated';
/** Пока студент не подтвердил почту, /registration не должен сбрасывать его из‑за cookie. */
export const EMAIL_CONFIRMATION_PENDING_KEY = 'resume:email-confirmation-pending';
export const EMAIL_CONFIRMATION_EMAIL_KEY = 'resume:email-confirmation-email';
export const REGISTRATION_USERNAME_KEY = 'resume:registration-username';
export const REGISTRATION_TEMP_PASSWORD_KEY = 'resume:registration-temp-password';
/** Роль незавершённой регистрации: student | recruiter — спрашивать «продолжить?» только при повторном выборе той же. */
export const REGISTRATION_PENDING_ROLE_KEY = 'resume:registration-pending-role';
/** Логин с последнего входа — для UI чатов (сравнение с authorUsername). */
export const AUTH_USERNAME_KEY = 'resumeAuthUsername';
/** Роль из GET /auth/me — ADMIN | STUDENT | RECRUITER | … */
export const AUTH_ROLE_KEY = 'resumeAuthRole';

let refreshInFlight = null;

const normalizeRole = (raw) => {
    const value = String(raw || '').trim().toUpperCase().replace(/^ROLE_/, '');
    return value || null;
};

const isAdminRole = (role) => normalizeRole(role) === 'ADMIN';

export const isAdminSession = () => isAdminRole(localStorage.getItem(AUTH_ROLE_KEY));

const extractRoleFromMe = (me) => {
    if (!me || typeof me !== 'object') return null;
    if (me.role != null) return normalizeRole(me.role);
    if (Array.isArray(me.roles) && me.roles.length) {
        const roles = me.roles.map((r) => normalizeRole(typeof r === 'string' ? r : r?.name || r?.role));
        if (roles.some(isAdminRole)) return 'ADMIN';
        return roles.find(Boolean) || null;
    }
    if (Array.isArray(me.authorities) && me.authorities.length) {
        const list = me.authorities.map((a) =>
            normalizeRole(typeof a === 'string' ? a : a?.authority || a?.role),
        );
        if (list.some(isAdminRole)) return 'ADMIN';
        return list.find(Boolean) || null;
    }
    return null;
};

const setStoredRole = (role) => {
    const normalized = normalizeRole(role);
    if (normalized) {
        localStorage.setItem(AUTH_ROLE_KEY, normalized);
    }
};

/**
 * GET /auth/me — кэширует роль в localStorage.
 */
export const fetchAuthMe = async () => {
    const response = await fetch(`${API_BASE_URL}auth/me`, {
        method: 'GET',
        credentials: 'include',
    });
    if (!response.ok) {
        const err = new Error(`auth/me failed: ${response.status}`);
        err.status = response.status;
        throw err;
    }
    let data = {};
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
        try {
            data = await response.json();
        } catch {
            data = {};
        }
    }
    const role = extractRoleFromMe(data);
    if (role) setStoredRole(role);
    return data;
};

const shouldSkipServerLogout = async () => {
    if (isAdminSession()) return true;
    try {
        const response = await fetch(`${API_BASE_URL}auth/me`, {
            method: 'GET',
            credentials: 'include',
        });
        if (!response.ok) return false;
        let data = {};
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
            try {
                data = await response.json();
            } catch {
                data = {};
            }
        }
        const role = extractRoleFromMe(data);
        if (role) setStoredRole(role);
        return isAdminRole(role);
    } catch {
        return false;
    }
};

/** Черновик регистрации в sessionStorage (почта/логин/ожидание кода). */
export const clearRegistrationDraft = () => {
    sessionStorage.removeItem(EMAIL_CONFIRMATION_PENDING_KEY);
    sessionStorage.removeItem(EMAIL_CONFIRMATION_EMAIL_KEY);
    sessionStorage.removeItem(REGISTRATION_USERNAME_KEY);
    sessionStorage.removeItem(REGISTRATION_TEMP_PASSWORD_KEY);
    sessionStorage.removeItem(REGISTRATION_PENDING_ROLE_KEY);
};

export const isEmailConfirmationPending = () =>
    sessionStorage.getItem(EMAIL_CONFIRMATION_PENDING_KEY) === '1';

/** Есть незавершённая регистрация именно для этой роли. */
export const isRegistrationPendingForRole = (role) => {
    if (!isEmailConfirmationPending() || !role) return false;
    const pendingRole = sessionStorage.getItem(REGISTRATION_PENDING_ROLE_KEY);
    // Старые сессии без ключа роли — только студент (раньше pending был только у студента)
    if (!pendingRole) return role === 'student';
    return pendingRole === role;
};

const parseLoginErrorMessage = (status, errorText) => {
    let serverMessage = '';
    try {
        const parsed = JSON.parse(errorText);
        serverMessage = String(parsed?.message || parsed?.error || '').trim();
    } catch {
        serverMessage = String(errorText || '').trim();
    }

    const lower = serverMessage.toLowerCase();
    // После регистрации/протухшей сессии JWT-фильтр часто отвечает так вместо Bad credentials
    if (
        status === 401
        && (/authentication is required|full authentication is required|unauthorized/i.test(lower)
            || !serverMessage)
    ) {
        return 'Неверный логин или пароль';
    }
    if (status === 401 || status === 403) {
        return serverMessage || 'Неверный логин или пароль';
    }
    return serverMessage || `Ошибка входа (${status})`;
};

/**
 * Принудительный сброс cookie перед login/регистрацией.
 * Всегда зовём logout (и admin/logout) — иначе старый HttpOnly ACCESS_TOKEN
 * уходит с credentials:include и /auth/login отвечает 401
 * "Authentication is required", не доходя до проверки пароля.
 * Нельзя пропускать logout из‑за кэша роли ADMIN в localStorage.
 */
export const clearServerSessionBeforeLogin = async () => {
    try {
        await fetch(`${API_BASE_URL}auth/logout`, {
            method: 'POST',
            credentials: 'include',
        });
    } catch (e) {
        console.warn('[AUTH] pre-login logout failed', e);
    }
    try {
        await fetch(`${API_BASE_URL}auth/admin/logout`, {
            method: 'POST',
            credentials: 'include',
        });
    } catch (e) {
        console.warn('[AUTH] pre-login admin logout failed', e);
    }
    localStorage.removeItem(AUTH_FLAG_KEY);
    localStorage.removeItem(`${AUTH_FLAG_KEY}_time`);
    localStorage.removeItem(AUTH_ROLE_KEY);
};

/**
 * Авторизация пользователя
 * @param {string} username - Имя пользователя
 * @param {string} password - Пароль
 * @returns {Promise<Object>} Ответ сервера
 */
export const login = async (username, password) => {
    try {
        await clearServerSessionBeforeLogin();

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
                password,
            }),
        });

        console.log('[AUTH] Response status:', response.status);
        console.log('[AUTH] Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[AUTH] Error response:', errorText);
            const err = new Error(parseLoginErrorMessage(response.status, errorText));
            err.status = response.status;
            throw err;
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

        const roleFromLogin = extractRoleFromMe(data);
        if (roleFromLogin) {
            setStoredRole(roleFromLogin);
        } else {
            try {
                await fetchAuthMe();
            } catch (e) {
                console.warn('[AUTH] post-login auth/me failed', e);
            }
        }

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

export const clearLocalAuth = () => {
    localStorage.removeItem(AUTH_FLAG_KEY);
    localStorage.removeItem(`${AUTH_FLAG_KEY}_time`);
    localStorage.removeItem(AUTH_USERNAME_KEY);
    localStorage.removeItem(AUTH_ROLE_KEY);
    // Черновик подтверждения почты НЕ трогаем — иначе после ухода на /login
    // сессия confirm-email теряется, а почта на сервере уже занята.
    document.cookie.split(';').forEach((c) => {
        document.cookie = c
            .replace(/^ +/, '')
            .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
    });
};

/**
 * POST /auth/register-student
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
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
        return response.json();
    }
    return {};
};

const parseAuthError = async (response) => {
    const text = await response.text();
    let msg = text;
    try {
        msg = JSON.parse(text).message || text;
    } catch {
        /* empty */
    }
    const err = new Error(msg || `Ошибка ${response.status}`);
    err.status = response.status;
    return err;
};

/**
 * POST /auth/confirm-email
 * @param {string} code
 */
export const confirmEmail = async (code) => {
    const url = `${API_BASE_URL}auth/confirm-email`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code }),
    });
    if (!response.ok) {
        throw await parseAuthError(response);
    }
    return {};
};

export const resendEmailConfirmation = async () => {
    const url = `${API_BASE_URL}auth/resend-email-confirmation`;
    const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
    });
    if (!response.ok) {
        throw await parseAuthError(response);
    }
    return {};
};

export const forgotPassword = async (email) => {
    const url = `${API_BASE_URL}auth/forgot-password`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
    });
    if (!response.ok) {
        throw await parseAuthError(response);
    }
    return {};
};

/**
 * POST /auth/change-password
 */
export const changePassword = async (currentPassword, newPassword) => {
    const url = `${API_BASE_URL}auth/change-password`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!response.ok) {
        throw await parseAuthError(response);
    }
    return {};
};

/**
 * POST /auth/reset-password
 */
export const resetPassword = async ({ email, code, newPassword, passwordConfirm }) => {
    const url = `${API_BASE_URL}auth/reset-password`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
            email,
            code,
            newPassword,
            passwordConfirm,
        }),
    });
    if (!response.ok) {
        throw await parseAuthError(response);
    }
    return {};
};


export const verifyResetPasswordCode = async (email, code) => {
    const probeA = `ProbeOk1!${Date.now()}`;
    const probeB = `ProbeBad2!${Date.now()}`;
    try {
        await resetPassword({
            email,
            code,
            newPassword: probeA,
            passwordConfirm: probeB,
        });
        return 'ok';
    } catch (err) {
        const message = String(err?.message || '').toLowerCase();
        const looksLikeBadCode =
            /код|code|otp|истёк|истек|expired|неверн|invalid|wrong|incorrect/.test(message);
        const looksLikeMismatch =
            /совпад|match|confirm|одинаков|различ|не совпад/.test(message);

        if (looksLikeBadCode && !looksLikeMismatch) {
            throw err;
        }
        if (looksLikeMismatch) {
            return 'ok';
        }
        if (looksLikeBadCode) {
            throw err;
        }
        const unknown = new Error(
            message || 'Не удалось проверить код. Запросите новый или попробуйте снова.',
        );
        unknown.status = err?.status;
        throw unknown;
    }
};

const postRefresh = async (path) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
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
 * Выбор refresh по роли:
 * 1) GET /auth/me → ADMIN: только auth/admin/refresh, иначе auth/refresh
 * 2) me=401 → auth/refresh, при 403 → auth/admin/refresh
 * Параллельные вызовы ждут один in-flight refresh.
 */
const refreshSessionInternal = async () => {
    let meResponse;
    try {
        meResponse = await fetch(`${API_BASE_URL}auth/me`, {
            method: 'GET',
            credentials: 'include',
        });
    } catch (e) {
        console.error('[AUTH] auth/me network error', e);
        throw e;
    }

    if (meResponse.ok) {
        let me = {};
        const contentType = meResponse.headers.get('content-type');
        if (contentType?.includes('application/json')) {
            try {
                me = await meResponse.json();
            } catch {
                me = {};
            }
        }
        const role = extractRoleFromMe(me);
        if (role) setStoredRole(role);

        if (isAdminRole(role)) {
            return postRefresh('auth/admin/refresh');
        }
        return postRefresh('auth/refresh');
    }

    if (meResponse.status === 401) {
        try {
            return await postRefresh('auth/refresh');
        } catch (err) {
            if (err?.status === 403) {
                const data = await postRefresh('auth/admin/refresh');
                setStoredRole('ADMIN');
                return data;
            }
            throw err;
        }
    }

    const err = new Error(`auth/me failed: ${meResponse.status}`);
    err.status = meResponse.status;
    throw err;
};

export const refreshSession = async () => {
    if (refreshInFlight) {
        return refreshInFlight;
    }
    refreshInFlight = refreshSessionInternal().finally(() => {
        refreshInFlight = null;
    });
    return refreshInFlight;
};

export const logoutServer = async () => {
    const skipLogout = await shouldSkipServerLogout();
    try {
        if (!skipLogout) {
            await fetch(`${API_BASE_URL}auth/logout`, {
                method: 'POST',
                credentials: 'include',
            });
        }
    } catch (e) {
        console.warn('[AUTH] logout request failed', e);
    } finally {
        clearLocalAuth();
    }
};

export const logout = () => {
    clearLocalAuth();
    console.log('[AUTH] Logged out, cleared all auth data');
};

