const BUSYNESS_LABELS = {
    EMPLOYED: 'Фулл-тайм',
    FREELANCE: 'Парт-тайм',
    FREE: 'Нет занятости',
    PROJECT_WORK: 'Проектная работа',
};

const JOB_SEARCH_LABELS = {
    LOOKING: 'Ищу работу',
    CONSIDERING: 'Рассматриваю предложения',
    NOT_LOOKING: 'Не ищу работу',
};

export const formatBusynessLabel = (value) => {
    const key = String(value || '').toUpperCase();
    return BUSYNESS_LABELS[key] || '';
};

export const formatJobSearchStatusLabel = (value) => {
    const key = String(value || '').toUpperCase();
    return JOB_SEARCH_LABELS[key] || '';
};

export const isProjectBusyness = (value) => String(value || '').toUpperCase() === 'PROJECT_WORK';

export const isLookingForJob = (value) => String(value || '').toUpperCase() === 'LOOKING';
