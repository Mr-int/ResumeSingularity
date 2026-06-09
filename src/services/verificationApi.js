import { API_BASE_URL } from '../config/api.js';

const parseError = async (response) => {
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
