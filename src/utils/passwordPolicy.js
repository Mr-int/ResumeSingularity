/** Должно совпадать с app.registration.min-password-length в application.yaml */
export const MIN_REGISTRATION_PASSWORD_LENGTH = 12;

export function validateRegistrationPassword(password) {
    if (!password || password.length < MIN_REGISTRATION_PASSWORD_LENGTH) {
        return {
            ok: false,
            message: `Пароль должен быть не короче ${MIN_REGISTRATION_PASSWORD_LENGTH} символов`,
        };
    }
    if (!/[A-Za-zА-Яа-я]/.test(password) || !/\d/.test(password)) {
        return { ok: false, message: 'Пароль должен содержать буквы и цифры' };
    }
    return { ok: true };
}
