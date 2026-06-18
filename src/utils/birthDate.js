const MAX_AGE_YEARS = 100;

const pad2 = (n) => String(n).padStart(2, '0');

const formatDateOnly = (date) => {
    const y = date.getFullYear();
    return `${y}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

/** Границы для input[type=date]: не раньше 100 лет назад и не позже сегодня. */
export const getBirthDateInputBounds = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const minDate = new Date(today);
    minDate.setFullYear(today.getFullYear() - MAX_AGE_YEARS);

    return {
        min: formatDateOnly(minDate),
        max: formatDateOnly(today),
    };
};

const isValidCalendarDate = (year, month, day) => {
    if (!Number.isInteger(year) || year < 1000 || year > 9999) return false;
    if (!Number.isInteger(month) || month < 1 || month > 12) return false;
    if (!Number.isInteger(day) || day < 1 || day > 31) return false;

    const date = new Date(year, month - 1, day);
    return (
        date.getFullYear() === year
        && date.getMonth() === month - 1
        && date.getDate() === day
    );
};

/**
 * Нормализует дату рождения YYYY-MM-DD: отсекает некорректный год и дату.
 * Пустая строка, если значение невалидно.
 */
export const sanitizeBirthDateInput = (raw) => {
    const value = String(raw || '').trim();
    if (!value) return '';

    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return '';

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    if (!isValidCalendarDate(year, month, day)) return '';

    const { min, max } = getBirthDateInputBounds();
    const minYear = Number(min.slice(0, 4));
    const maxYear = Number(max.slice(0, 4));

    if (year > maxYear || year < minYear) return '';

    const normalized = `${String(year).padStart(4, '0')}-${pad2(month)}-${pad2(day)}`;
    if (normalized > max || normalized < min) return '';

    return normalized;
};

export const validateBirthDate = (raw) => {
    const value = String(raw || '').trim();
    if (!value) {
        return { ok: true, value: '' };
    }

    const sanitized = sanitizeBirthDateInput(value);
    if (!sanitized) {
        const { min, max } = getBirthDateInputBounds();
        return {
            ok: false,
            value: '',
            message: `Укажите дату рождения между ${min.split('-').reverse().join('.')} и ${max.split('-').reverse().join('.')}`,
        };
    }

    return { ok: true, value: sanitized };
};
