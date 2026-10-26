/** Города кампусов — те же значения, что сохраняются в поле city на бэкенде. */
export const CAMPUS_OPTIONS = [
    'Чебоксары',
    'Красноярск',
    'Новочебоксарск',
    'Тюмень',
    'Нижний Новгород',
    'Хабаровск',
    'Другой город'
];

export const isCampusCity = (city) => {
    const trimmed = city?.trim();
    return Boolean(trimmed && CAMPUS_OPTIONS.includes(trimmed));
};

/**
 * Для PATCH/валидации: кампусный город или уже сохранённый на сервере
 * (старые профили вне списка кампусов не блокируем).
 */
export const isAllowedProfileCity = (city, legacyCity = '') => {
    const trimmed = city?.trim();
    if (!trimmed) return false;
    if (isCampusCity(trimmed)) return true;
    const legacy = legacyCity?.trim();
    return Boolean(legacy && trimmed === legacy);
};
