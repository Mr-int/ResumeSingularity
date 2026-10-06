const CYRILLIC = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
    и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

const translitPart = (value) => String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .split('')
    .map((char) => (char in CYRILLIC ? CYRILLIC[char] : char))
    .join('')
    .replace(/[^a-z0-9_]/g, '');

/** Логин для регистрации: латиница, цифры и _, 3–64 символа. */
export const usernameFromName = (lastName, firstName) => {
    const last = translitPart(lastName).replace(/^_+|_+$/g, '');
    const first = translitPart(firstName).replace(/^_+|_+$/g, '');
    let raw = [last, first].filter(Boolean).join('_').replace(/_+/g, '_');
    if (raw.length < 3) {
        raw = `${raw}user`;
    }
    return raw.slice(0, 64);
};

export const usernameWithSuffix = (base, attempt) => {
    if (attempt <= 1) return base.slice(0, 64);
    const suffix = `_${attempt}`;
    return `${base.slice(0, 64 - suffix.length)}${suffix}`;
};

export const isUsernameTakenError = (err) => {
    if (err?.status === 409) return true;
    const message = String(err?.message || '').toLowerCase();
    return /username|логин/.test(message) && /exist|taken|занят|уже|duplicate|уникал/.test(message);
};

export const isEmailTakenError = (err) => {
    if (err?.status === 409) {
        const message = String(err?.message || '').toLowerCase();
        return /email|почт|mail/.test(message) || !/username|логин/.test(message);
    }
    const message = String(err?.message || '').toLowerCase();
    return /email|почт|mail/.test(message) && /exist|taken|занят|уже|duplicate|уникал|использу/.test(message);
};

export const isValidEmail = (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

/**
 * РФ мобильный: ровно 11 цифр, начинается с 7 → `+7XXXXXXXXXX` (12 символов).
 * Принимает ввод 8999… / 999… / +7999…
 */
export const normalizePhoneNumber = (value) => {
    let digits = String(value || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('8') && digits.length === 11) {
        digits = `7${digits.slice(1)}`;
    }
    if (digits.length === 10 && digits.startsWith('9')) {
        digits = `7${digits}`;
    }
    if (digits.length !== 11 || !digits.startsWith('7')) return '';
    return `+${digits}`;
};

/** Маска ввода: не больше 11 цифр, всегда с префиксом +7. */
export const formatRuPhoneInput = (value) => {
    let digits = String(value || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('8')) {
        digits = `7${digits.slice(1)}`;
    }
    if (!digits.startsWith('7')) {
        digits = `7${digits}`;
    }
    digits = digits.slice(0, 11);
    return `+${digits}`;
};
