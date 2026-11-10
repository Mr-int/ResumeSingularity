/**
 * UI kit (4055:2):
 * - Search status 10273:14347
 * - Busyness / Icon Busyness 10273:3057, 10273:3010
 * - Tooltips 10287:13341, 10317:14856, 10317:14882
 *
 * Типы занятости (желаемый формат и «имеется занятость»):
 * Фулл-тайм (40ч+) / Парт-тайм (±20ч) / Проектная работа (±15ч).
 * Пустое значение = «нет данных» (не отдельный тип в ките).
 */

export const JOB_SEARCH_OPTIONS = [
    {
        value: 'LOOKING',
        label: 'Ищу работу',
        tone: 'looking',
        icon: 'looking',
        hint: 'Активный поиск работы, предложения работодателей рассматриваются.',
    },
    {
        value: 'CONSIDERING',
        label: 'Рассматриваю предложения',
        tone: 'considering',
        icon: 'considering',
        hint: 'Активного поиска нет, но предложения работодателей рассматриваются.',
    },
    {
        value: 'NOT_LOOKING',
        label: 'Не ищу работу',
        tone: 'notLooking',
        icon: 'notLooking',
        hint: 'Поиск работы не ведётся, предложения сейчас не рассматриваются.',
    },
];

/** Три типа из UI kit Busyness (без FREE — это «нет данных»). */
export const BUSYNESS_OPTIONS = [
    {
        value: 'EMPLOYED',
        label: 'Фулл-тайм',
        icon: 'fulltime',
        badge: '40ч+',
        hint: 'Фулл-тайм (full-time) — это занятость с полной рабочей неделей, который обычно составляет от 35 до 40 часов (по ТК РФ 40+ часов).',
    },
    {
        value: 'FREELANCE',
        label: 'Парт-тайм',
        icon: 'parttime',
        badge: '±20ч',
        hint: 'Парт-тайм (part-time) — это занятость с неполным рабочим днем или неполной рабочей неделей (по ТК РФ 15-39 часов).',
    },
    {
        value: 'PROJECT_WORK',
        label: 'Проектная работа',
        icon: 'project',
        badge: '±15ч',
        hint: 'Проектная работа — временная занятость, при которой исполнителя привлекают для выполнения конкретной задачи. Время работы может быть разным в зависимости от задач (по СМЗ/ИП 10-19 часов).',
    },
];

/** Желаемый формат = те же 3 типа (FREE / пусто = нет данных). */
export const DESIRED_BUSYNESS_OPTIONS = BUSYNESS_OPTIONS;

const BUSYNESS_LABELS = {
    ...Object.fromEntries(BUSYNESS_OPTIONS.map((item) => [item.value, item.label])),
    FREE: 'Нет занятости',
};

const JOB_SEARCH_LABELS = Object.fromEntries(
    JOB_SEARCH_OPTIONS.map((item) => [item.value, item.label]),
);

const normalizeBusynessValue = (value) => {
    const key = String(value || '').trim().toUpperCase();
    if (!key || key === 'FREE' || key === 'NONE' || key === 'NULL') return '';
    return key;
};

export const formatBusynessLabel = (value) => {
    const key = String(value || '').toUpperCase();
    if (!key || key === 'FREE') return '';
    return BUSYNESS_LABELS[key] || '';
};

export const formatJobSearchStatusLabel = (value) => {
    const key = String(value || '').toUpperCase();
    return JOB_SEARCH_LABELS[key] || '';
};

export const getBusynessMeta = (value) => {
    const key = normalizeBusynessValue(value);
    if (!key) return null;
    return BUSYNESS_OPTIONS.find((item) => item.value === key) || null;
};

export const getJobSearchMeta = (value) => {
    const key = String(value || '').toUpperCase();
    return JOB_SEARCH_OPTIONS.find((item) => item.value === key) || null;
};

export const isProjectBusyness = (value) => normalizeBusynessValue(value) === 'PROJECT_WORK';

export const isLookingForJob = (value) => String(value || '').toUpperCase() === 'LOOKING';

export const getBusynessIconKind = (value) => getBusynessMeta(value)?.icon || null;

export const getJobSearchIconKind = (value) => getJobSearchMeta(value)?.icon || null;

/** Для форм: FREE с бэка → пустой выбор («нет данных»). */
export const toBusynessFormValue = (value) => normalizeBusynessValue(value);

/** Для PATCH: пусто → null (нет данных). */
export const toBusynessApiValue = (value) => {
    const key = normalizeBusynessValue(value);
    return key || null;
};
