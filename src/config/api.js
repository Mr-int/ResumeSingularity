/**
 * Парсит VITE_API_URL из .env в origin (https://host без слэша).
 * @returns {string | null}
 */
function parseApiOrigin(raw) {
    if (!raw) return null;
    const trimmed = String(raw).trim().replace(/\/$/, '');
    try {
        return new URL(trimmed).origin;
    } catch {
        return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    }
}

const apiBaseRaw = import.meta.env.VITE_API_BASE || '/api/';

/** Origin бэкенда из .env (VITE_API_URL). */
export const API_ORIGIN = parseApiOrigin(import.meta.env.VITE_API_URL);

/** База для JSON-запросов: прокси на фронте (VITE_API_BASE, по умолчанию /api/). */
export const API_BASE_URL = apiBaseRaw.endsWith('/') ? apiBaseRaw : `${apiBaseRaw}/`;

export function getApiOrigin() {
    return API_ORIGIN;
}

/** Origin для фото и других прямых ссылок на API. */
export function getPhotoApiOrigin() {
    return API_ORIGIN || (typeof window !== 'undefined' ? window.location.origin : '');
}

/**
 * Получить URL изображения через эндпоинт /main/photo/{image_path}
 * @param {string} imagePath - Путь к изображению из поля imagePath в теле ответа
 * @returns {string | null} Полный URL изображения
 */
export const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }

    const origin = getPhotoApiOrigin();
    if (!origin) return null;

    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `${origin}/main/photo/${cleanPath}`;
};
