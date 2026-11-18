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
 * Город можно сохранить, если он уже был в анкете или есть в загруженном справочнике.
 * Пока справочник не пришёл (catalogNames не массив), новый город не принимаем.
 */
export const isAllowedProfileCity = (city, legacyCity = '', catalogNames) => {
    const trimmed = String(city ?? '').trim();
    if (!trimmed) return false;
    const legacy = String(legacyCity ?? '').trim();
    if (legacy && trimmed === legacy) return true;
    if (!Array.isArray(catalogNames)) return false;
    return catalogNames.some((name) => String(name).trim() === trimmed);
};
