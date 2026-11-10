/** Варианты из UI kit Singularity Resume (Search status / Busyness). */

export const JOB_SEARCH_OPTIONS = [
    { value: 'LOOKING', label: 'Ищу работу', tone: 'looking' },
    { value: 'CONSIDERING', label: 'Рассматриваю предложения', tone: 'considering' },
    { value: 'NOT_LOOKING', label: 'Не ищу работу', tone: 'notLooking' },
];

/** Желаемый формат и фактическая занятость (без FREE в «желаемом»). */
export const BUSYNESS_OPTIONS = [
    {
        value: 'EMPLOYED',
        label: 'Фулл-тайм',
        icon: 'fulltime',
        hint: 'Фулл-тайм (full-time) — занятость с полной рабочей неделей, обычно от 35 до 40 часов (по ТК РФ 40+ часов).',
    },
    {
        value: 'FREELANCE',
        label: 'Парт-тайм',
        icon: 'parttime',
        hint: 'Парт-тайм (part-time) — занятость с неполным рабочим днём или неполной рабочей неделей (по ТК РФ 15–39 часов).',
    },
    {
        value: 'PROJECT_WORK',
        label: 'Проектная работа',
        icon: 'project',
        hint: 'Проектная работа — временная занятость под конкретную задачу. Время зависит от задач (по СМЗ/ИП ~10–19 часов).',
    },
    {
        value: 'FREE',
        label: 'Нет занятости',
        icon: null,
        hint: 'Сейчас нет занятости.',
    },
];

export const DESIRED_BUSYNESS_OPTIONS = BUSYNESS_OPTIONS.filter((item) => item.value !== 'FREE');

const BUSYNESS_LABELS = Object.fromEntries(
    BUSYNESS_OPTIONS.map((item) => [item.value, item.label]),
);

const JOB_SEARCH_LABELS = Object.fromEntries(
    JOB_SEARCH_OPTIONS.map((item) => [item.value, item.label]),
);

export const formatBusynessLabel = (value) => {
    const key = String(value || '').toUpperCase();
    return BUSYNESS_LABELS[key] || '';
};

export const formatJobSearchStatusLabel = (value) => {
    const key = String(value || '').toUpperCase();
    return JOB_SEARCH_LABELS[key] || '';
};

export const getBusynessMeta = (value) => {
    const key = String(value || '').toUpperCase();
    return BUSYNESS_OPTIONS.find((item) => item.value === key) || null;
};

export const getJobSearchMeta = (value) => {
    const key = String(value || '').toUpperCase();
    return JOB_SEARCH_OPTIONS.find((item) => item.value === key) || null;
};

export const isProjectBusyness = (value) => String(value || '').toUpperCase() === 'PROJECT_WORK';

export const isLookingForJob = (value) => String(value || '').toUpperCase() === 'LOOKING';

export const getBusynessIconKind = (value) => getBusynessMeta(value)?.icon || null;
