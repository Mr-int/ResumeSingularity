import { API_BASE_URL } from '../config/api.js';

const VERIFICATION_FORBIDDEN_MSG =
    'Сейчас нельзя подтвердить телефон — сервер регистрации временно недоступен. Попробуйте позже или напишите в поддержку.';

const parseError = async (response) => {
    const text = await response.text();
    let msg = text;
    try {
        const parsed = JSON.parse(text);
        msg = parsed.message || parsed.error || text;
    } catch {
        /* empty */
    }
    if (response.status === 403) {
        msg = VERIFICATION_FORBIDDEN_MSG;
    }
    const err = new Error(msg || `Ошибка ${response.status}`);
    err.status = response.status;
    throw err;
};

/**
 * POST /verification/phone/start
 * @param {{ phoneNumber: string }} body
 */
export const startPhoneVerification = async (body) => {
    const response = await fetch(`${API_BASE_URL}verification/phone/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
    });
    if (!response.ok) await parseError(response);
    return response.json();
};

/**
 * GET /verification/phone/{id}/status
 */
export const getPhoneVerificationStatus = async (verificationId) => {
    const response = await fetch(`${API_BASE_URL}verification/phone/${verificationId}/status`, {
        method: 'GET',
        credentials: 'include',
    });
    if (!response.ok) await parseError(response);
    return response.json();
};

/**
 * POST /verification/phone/{id}/confirm-code — тестовый код (allow-dev-confirm на бэкенде)
 */
export const confirmPhoneVerificationCode = async (verificationId, code) => {
    const response = await fetch(`${API_BASE_URL}verification/phone/${verificationId}/confirm-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code }),
    });
    if (!response.ok) await parseError(response);
    return response.json();
};
