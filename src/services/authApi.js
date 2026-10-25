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
/** UUID пользователя из GET /auth/me */
export const AUTH_USER_ID_KEY = 'resumeAuthUserId';
/** accountStatus: PENDING_APPROVAL | APPROVED | REJECTED */
export const AUTH_ACCOUNT_STATUS_KEY = 'resumeAuthAccountStatus';
/** emailVerified из GET /auth/me */
export const AUTH_EMAIL_VERIFIED_KEY = 'resumeAuthEmailVerified';

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

const clearStoredSessionProfile = () => {
    localStorage.removeItem(AUTH_USER_ID_KEY);
    localStorage.removeItem(AUTH_ACCOUNT_STATUS_KEY);
    localStorage.removeItem(AUTH_EMAIL_VERIFIED_KEY);
};

/** Кэш полей AuthMeDTO после GET /auth/me. */
export const applyAuthMeToStorage = (me) => {
    if (!me || typeof me !== 'object') return;
    const role = extractRoleFromMe(me);
    if (role) setStoredRole(role);
    if (me.id != null && String(me.id).trim()) {
        localStorage.setItem(AUTH_USER_ID_KEY, String(me.id).trim());
    }
    if (me.username != null && String(me.username).trim()) {
        localStorage.setItem(AUTH_USERNAME_KEY, String(me.username).trim());
    }
    if (me.accountStatus != null && String(me.accountStatus).trim()) {
        localStorage.setItem(
            AUTH_ACCOUNT_STATUS_KEY,
            String(me.accountStatus).trim().toUpperCase(),
        );
    }
    if (typeof me.emailVerified === 'boolean') {
        localStorage.setItem(AUTH_EMAIL_VERIFIED_KEY, me.emailVerified ? '1' : '0');
    }
};

export const getStoredAccountStatus = () =>
    String(localStorage.getItem(AUTH_ACCOUNT_STATUS_KEY) || '').toUpperCase() || null;

export const getStoredEmailVerified = () => {
    const raw = localStorage.getItem(AUTH_EMAIL_VERIFIED_KEY);
    if (raw === '1') return true;
    if (raw === '0') return false;
    return null;
};

export const getStoredUserId = () => localStorage.getItem(AUTH_USER_ID_KEY) || null;

export const getStoredRole = () => normalizeRole(localStorage.getItem(AUTH_ROLE_KEY));

/**
 * GET /auth/me — роль, accountStatus, emailVerified и id в localStorage.
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
    applyAuthMeToStorage(data);
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
        applyAuthMeToStorage(data);
        return isAdminRole(extractRoleFromMe(data));
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
    clearStoredSessionProfile();
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

        // Login обычно 204 без тела — статус/роль берём из GET /auth/me
        applyAuthMeToStorage(data);
        try {
            await fetchAuthMe();
        } catch (e) {
            console.warn('[AUTH] post-login auth/me failed', e);
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
    // HttpOnly-cookie с JS не читаются — проверка только для редких non-HttpOnly случаев.
    const accessToken = getCookie('ACCESS_TOKEN');
    const refreshToken = getCookie('REFRESH_TOKEN');
    return !!(accessToken || refreshToken);
};

export const isAuthenticated = () => {
    const authFlag = localStorage.getItem(AUTH_FLAG_KEY);
    const authTime = localStorage.getItem(`${AUTH_FLAG_KEY}_time`);
    const hasTokens = hasAuthCookies();

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

    if (hasTokens) {
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
    clearStoredSessionProfile();
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
    localStorage.setItem(AUTH_FLAG_KEY, 'true');
    localStorage.setItem(`${AUTH_FLAG_KEY}_time`, Date.now().toString());
    try {
        await fetchAuthMe();
    } catch {
        /* cookie уже есть — me подтянется на следующем шаге */
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
    try {
        await fetchAuthMe();
    } catch {
        /* сессия могла ещё не отдавать me — не валим confirm */
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

