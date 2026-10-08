/** Города кампусов — те же значения, что сохраняются в поле city на бэкенде. */
export const CAMPUS_OPTIONS = [
    'Чебоксары',
    'Красноярск',
    'Новочебоксарск',
    'Тюмень',
    'Нижний Новгород',
    'Хабаровск',
];

export const isCampusCity = (city) => {
    const trimmed = city?.trim();
    return Boolean(trimmed && CAMPUS_OPTIONS.includes(trimmed));
};
