import { isValidVerificationEmail } from '../services/verificationApi.js';
import { getStoredAuthPhone } from '../services/authApi.js';
import { normalizePhone } from './phoneFormat.js';
import { validateBirthDate } from './birthDate.js';

export const RESUME_FIELD_LABELS = {
    firstName: 'Имя',
    lastName: 'Фамилия',
    birthDate: 'Дата рождения',
    email: 'Email',
    course: 'Курс',
    busyness: 'Занятость',
    specialityId: 'Специальность',
    skillsIds: 'Навыки',
    phoneNumber: 'Телефон',
    city: 'Город',
    bio: 'О себе',
    telegramUsername: 'Telegram',
};

const formatMissingFieldsMessage = (fields) => {
    const labels = fields.map((field) => RESUME_FIELD_LABELS[field] || field);
    if (labels.length === 1) {
        return `Заполните поле: ${labels[0]}`;
    }
    return `Заполните поля: ${labels.join(', ')}`;
};

export const validateStudentResumeForm = (form, options = {}) => {
    const missing = [];
    const email = String(options.email ?? form.email ?? '').trim();
    const catalogue = options.catalogue || null;
    const allowedSpecIds = catalogue?.specialityIds
        ? new Set(catalogue.specialityIds.map(Number).filter((n) => n > 0))
        : null;
    const allowedSkillIds = catalogue?.skillIds
        ? new Set(catalogue.skillIds.map(Number).filter((n) => n > 0))
        : null;

    if (!String(form.firstName || '').trim()) missing.push('firstName');
    if (!String(form.lastName || '').trim()) missing.push('lastName');

    const birthCheck = validateBirthDate(form.birthDate);
    if (!birthCheck.ok) {
        return {
            ok: false,
            message: birthCheck.message,
            missingFields: ['birthDate'],
        };
    }

    if (!email) {
        missing.push('email');
    } else if (!isValidVerificationEmail(email)) {
        return {
            ok: false,
            message: 'Укажите корректный email',
            missingFields: ['email'],
        };
    }

    const specId = Number(form.specialityId);
    if (!Number.isFinite(specId) || specId <= 0) {
        missing.push('specialityId');
    } else if (allowedSpecIds?.size && !allowedSpecIds.has(specId)) {
        return {
            ok: false,
            message: 'Выберите специальность из списка на странице (обновите страницу, если список пустой).',
            missingFields: ['specialityId'],
        };
    }

    let skillIds = Array.isArray(form.skillsIds)
        ? form.skillsIds.map(Number).filter((n) => Number.isFinite(n) && n > 0)
        : [];
    if (allowedSkillIds?.size) {
        skillIds = skillIds.filter((id) => allowedSkillIds.has(id));
    }
    if (!skillIds.length) {
        missing.push('skillsIds');
    }

    if (missing.length) {
        return {
            ok: false,
            message: formatMissingFieldsMessage(missing),
            missingFields: missing,
        };
    }

    return {
        ok: true,
        birthDate: birthCheck.value,
        email,
        specialityId: specId,
        skillsIds: skillIds,
    };
};

export const isResumeConstraintError = (error) => {
    if (!error) return false;
    const raw = String(error.message || error.responseBody?.message || '').toLowerCase();
    return (
        raw.includes('constraint violation')
        || raw.includes('duplicate key')
        || raw.includes('foreign key')
        || raw.includes('data integrity')
        || raw.includes('нарушает ограничение')
        || raw.includes('нарушение целостности')
    );
};

export const buildStudentResumeRequestBody = (form, validation) => {
    const telegram = String(form.telegramUsername || '').trim();
    const city = String(form.city || '').trim();
    const bio = String(form.bio || '').trim();
    const phone = normalizePhone(String(form.phoneNumber || '').trim() || getStoredAuthPhone() || '');

    const body = {
        firstName: String(form.firstName || '').trim(),
        lastName: String(form.lastName || '').trim(),
        email: validation.email,
        birthDate: validation.birthDate,
        course: form.course || 'FIRST',
        busyness: form.busyness || 'FREE',
        specialityId: validation.specialityId,
        skillsIds: validation.skillsIds,
    };

    if (city) body.city = city;
    if (bio) body.bio = bio;
    if (phone) body.phoneNumber = phone;
    if (telegram) body.telegramUsername = telegram;

    return body;
};

const FIELD_ERROR_ALIASES = {
    skillsIds: 'skillsIds',
    skillIds: 'skillsIds',
    specialityId: 'specialityId',
    birthDate: 'birthDate',
    firstName: 'firstName',
    lastName: 'lastName',
    email: 'email',
    phoneNumber: 'phoneNumber',
    city: 'city',
    bio: 'bio',
    telegramUsername: 'telegramUsername',
};

export const formatResumeApiValidationError = (error) => {
    if (!error) return null;

    const body = error.responseBody;
    const fieldErrors = Array.isArray(body?.fieldErrors) ? body.fieldErrors : [];
    const errors = Array.isArray(body?.errors) ? body.errors : [];

    if (fieldErrors.length) {
        const fields = fieldErrors
            .map((item) => FIELD_ERROR_ALIASES[item.field] || item.field)
            .filter(Boolean);
        if (fields.length) {
            return formatMissingFieldsMessage([...new Set(fields)]);
        }
        const messages = fieldErrors
            .map((item) => item.message || item.defaultMessage)
            .filter(Boolean);
        if (messages.length) return messages.join('; ');
    }

    if (errors.length) {
        return errors.join('; ');
    }

    const raw = String(error.message || body?.message || '').trim();
    if (!raw) return null;

    if (/foreign key|violates foreign key|fk_|нарушает ограничение внешнего ключа|constraint violation|duplicate key|data integrity|нарушение целостности/i.test(raw)) {
        return 'Не удалось сохранить резюме: выбранные специальность или навыки недоступны, либо резюме уже создано. Обновите страницу и попробуйте снова.';
    }

    if (/не должно быть пустым|must not be (blank|empty)/i.test(raw)) {
        return 'Заполните все обязательные поля резюме: имя, фамилия, дата рождения, email, специальность и навыки.';
    }

    return raw;
};
