export const WORK_FORMAT_OPTIONS = ['REMOTE', 'OFFICE', 'HYBRID'];

export const EMPLOYMENT_TYPE_OPTIONS = ['INTERNSHIP', 'PART_TIME', 'FULL_TIME', 'PROJECT'];

export const WORK_FORMAT_LABELS = {
    REMOTE: 'Удалённо',
    OFFICE: 'Офис',
    HYBRID: 'Гибрид',
};

export const EMPLOYMENT_TYPE_LABELS = {
    INTERNSHIP: 'Стажировка',
    PART_TIME: 'Частичная занятость',
    FULL_TIME: 'Полная занятость',
    PROJECT: 'Проектная работа',
};

export const VACANCY_STATUS_LABELS = {
    DRAFT: 'Черновик',
    PENDING_REVIEW: 'На модерации',
    PUBLISHED: 'Опубликована',
    CLOSED: 'Закрыта',
    REJECTED: 'Отклонена',
};

export const APPLICATION_STATUS_LABELS = {
    SUBMITTED: 'Отправлен',
    ACCEPTED: 'Принят',
    REJECTED: 'Отклонён',
    WITHDRAWN: 'Отозван',
    TU_PENDING: 'Ожидает решения ТУ',
    TU_APPROVED: 'Одобрен ТУ',
    TU_REJECTED: 'Отклонён ТУ',
};

export const getWorkFormatLabel = (value) =>
    WORK_FORMAT_LABELS[value] || (value ? String(value) : '');

export const getEmploymentTypeLabel = (value) =>
    EMPLOYMENT_TYPE_LABELS[value] || (value ? String(value) : '');

export const getVacancyStatusLabel = (value) =>
    VACANCY_STATUS_LABELS[value] || (value ? String(value) : '');

export const getApplicationStatusLabel = (value) =>
    APPLICATION_STATUS_LABELS[value] || (value ? String(value) : '');

/** workFormats[] или устаревшее workFormat. */
export const extractWorkFormats = (vacancy) => {
    if (!vacancy || typeof vacancy !== 'object') return [];
    if (Array.isArray(vacancy.workFormats) && vacancy.workFormats.length) {
        return vacancy.workFormats.filter(Boolean);
    }
    if (vacancy.workFormat) return [vacancy.workFormat];
    return [];
};

/** employmentTypes[] или устаревшее employmentType. */
export const extractEmploymentTypes = (vacancy) => {
    if (!vacancy || typeof vacancy !== 'object') return [];
    if (Array.isArray(vacancy.employmentTypes) && vacancy.employmentTypes.length) {
        return vacancy.employmentTypes.filter(Boolean);
    }
    if (vacancy.employmentType) return [vacancy.employmentType];
    return [];
};

export const formatWorkFormats = (vacancy) =>
    extractWorkFormats(vacancy).map(getWorkFormatLabel).filter(Boolean).join(', ');

export const formatEmploymentTypes = (vacancy) =>
    extractEmploymentTypes(vacancy).map(getEmploymentTypeLabel).filter(Boolean).join(', ');

/** Строка метаданных для карточки/детали вакансии. */
export const buildVacancyMetaParts = (vacancy, { includeStatus = false } = {}) => {
    if (!vacancy) return [];
    const parts = [
        vacancy.companyName || null,
        vacancy.city || null,
        formatWorkFormats(vacancy) || null,
        formatEmploymentTypes(vacancy) || null,
    ];
    if (includeStatus && vacancy.status) {
        parts.push(getVacancyStatusLabel(vacancy.status));
    }
    return parts.filter(Boolean);
};

export const buildVacancyMetaLine = (vacancy, options) =>
    buildVacancyMetaParts(vacancy, options).join(' · ');
