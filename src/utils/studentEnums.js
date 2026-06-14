export const COURSE_OPTIONS = ['NEW', 'FIRST', 'SECOND', 'THIRD', 'FOURTH'];

export const BUSYNESS_OPTIONS = ['FREE', 'FREELANCE', 'EMPLOYED'];

export const COURSE_LABELS = {
    NEW: 'Новый',
    FIRST: '1 курс',
    SECOND: '2 курс',
    THIRD: '3 курс',
    FOURTH: '4 курс',
};

export const BUSYNESS_LABELS = {
    FREE: 'Свободен',
    FREELANCE: 'Фриланс',
    EMPLOYED: 'Занят',
};

export const getCourseLabel = (value) => COURSE_LABELS[value] || value || '—';

export const getBusynessLabel = (value) => BUSYNESS_LABELS[value] || value || '—';
