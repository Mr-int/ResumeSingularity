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

/** Телефон контракта: необязательный + и 7–15 цифр. */
export const normalizePhoneNumber = (value) => {
    const trimmed = String(value || '').trim();
    if (!trimmed) return '';
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) return '';
    return trimmed.startsWith('+') ? `+${digits}` : digits;
};
