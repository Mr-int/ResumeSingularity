/** Нормализует ввод в E.164-подобный формат +7XXXXXXXXXX */
export const normalizePhone = (raw) => {
    const digits = String(raw || '').replace(/\D/g, '');
    if (!digits) return '';
    const normalized = digits.startsWith('8') && digits.length === 11 ? `7${digits.slice(1)}` : digits;
    return normalized.startsWith('7') || normalized.length > 10 ? `+${normalized}` : `+7${normalized}`;
};

/** Отображение маски 999 999-99-99 (без кода страны) */
export const formatPhoneDisplay = (raw) => {
    const digits = String(raw || '').replace(/\D/g, '').replace(/^7|^8/, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    if (digits.length <= 8) return `${digits.slice(0, 3)} ${digits.slice(3, 6)}-${digits.slice(6)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
};

/** Локальная часть номера для хранения в state (только цифры после 7/8) */
export const phoneToLocalDigits = (phone) => {
    if (!phone) return '';
    return String(phone).replace(/\D/g, '').replace(/^7|^8/, '');
};

/** Берёт телефон из ответа API / профиля (разные имена полей). */
export const pickPhoneNumber = (...sources) => {
    for (const source of sources) {
        if (!source || typeof source !== 'object') continue;
        const candidates = [
            source.phoneNumber,
            source.phone,
            source.mobile,
            source.user?.phoneNumber,
            source.user?.phone,
        ];
        for (const value of candidates) {
            const normalized = String(value || '').trim();
            if (normalized) return normalized;
        }
    }
    return '';
};

/** Для отображения в текстовом поле профиля */
export const formatPhoneForInput = (phone) => {
    const raw = String(phone || '').trim();
    if (!raw) return '';
    if (raw.startsWith('+')) return raw;
    const digits = phoneToLocalDigits(raw);
    return digits ? formatPhoneDisplay(digits) : raw;
};
