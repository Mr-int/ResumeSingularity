import { API_BASE_URL } from '../config/api.js';

const VERIFICATION_FORBIDDEN_MSG =
    'Сейчас нельзя подтвердить контакт — сервер регистрации временно недоступен. Попробуйте позже или напишите в поддержку.';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidVerificationEmail = (value) => EMAIL_REGEX.test(String(value || '').trim());

/** Бэкенд вернул 400, когда SMTP/почта недоступна при старте с email. */
export const isVerificationMailDeliveryError = (err) =>
    err?.status === 400 &&
    /почт|mail|email|smtp/i.test(String(err?.message || ''));

/**
 * Тело POST /verification/phone/start
 * @param {string} phoneNumber — E.164, например +79991234567
 * @param {string} [email] — при app.mail.enabled=true OTP уходит на почту
 */
export const buildVerificationStartBody = (phoneNumber, email) => {
    const digits = String(phoneNumber || '').replace(/\D/g, '');
    const normalized =
        digits.length === 11 && digits.startsWith('7')
            ? `+${digits}`
            : String(phoneNumber || '').trim();
    const body = { phoneNumber: normalized };
    const mail = String(email || '').trim().toLowerCase();
    if (mail) body.email = mail;
    return body;
};

const parseError = async (response) => {
    const text = await response.text();
    let msg = text;
    try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === 'object') {
            msg =
                parsed.message ||
                parsed.error ||
                (Array.isArray(parsed.errors) ? parsed.errors.join('; ') : null) ||
                text;
        }
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
 */
export const startPhoneVerification = async (body) => {
    const payload =
        body?.phoneNumber != null
            ? buildVerificationStartBody(body.phoneNumber, body.email)
            : body;
    const response = await fetch(`${API_BASE_URL}verification/phone/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
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
