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
