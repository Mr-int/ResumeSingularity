/** Логин по OpenAPI: ^[a-zA-Z0-9_]{3,64}$ */
export const REGISTRATION_USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,64}$/;

export function validateRegistrationUsername(username) {
    const login = String(username || '').trim();
    if (!login) {
        return { ok: false, message: 'Укажите логин' };
    }
    if (login.length < 3) {
        return { ok: false, message: 'Логин должен быть не короче 3 символов' };
    }
    if (!REGISTRATION_USERNAME_PATTERN.test(login)) {
        return {
            ok: false,
            message: 'Логин может содержать только латинские буквы, цифры и подчёркивание',
        };
    }
    return { ok: true, login };
}

/**
 * Тело POST /auth/register-recruiter — без пустых необязательных полей.
 */
export function buildRecruiterRegistrationBody(fields) {
    const body = {
        username: String(fields.username || '').trim(),
        password: fields.password,
        passwordConfirm: fields.passwordConfirm,
        phoneNumber: fields.phoneNumber,
        phoneVerificationId: fields.phoneVerificationId,
        companyName: String(fields.companyName || '').trim(),
        firstName: String(fields.firstName || '').trim(),
        lastName: String(fields.lastName || '').trim(),
    };
    const email = String(fields.email || '').trim();
    if (email) body.email = email;
    const city = String(fields.city || '').trim();
    if (city) body.city = city;
    return body;
}
