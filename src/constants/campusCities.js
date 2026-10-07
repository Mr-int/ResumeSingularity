/** Города кампусов — те же значения, что сохраняются в поле city на бэкенде. */
export const CAMPUS_OPTIONS = [
    'Москва',
    'Санкт-Петербург',
    'Казань',
    'Новосибирск',
    'Екатеринбург',
    'Нижний Новгород',
    'Краснодар',
    'Ростов-на-Дону',
    'Самара',
    'Воронеж',
    'Уфа',
    'Пермь',
    'Чебоксары',
    'Челябинск',
    'Онлайн',
];

export const isCampusCity = (city) => {
    const trimmed = city?.trim();
    return Boolean(trimmed && CAMPUS_OPTIONS.includes(trimmed));
};
