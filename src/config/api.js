/**
 * Парсит URL из .env в origin (https://host без слэша).
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

/** Origin JSON API из .env (для dev-прокси и WebSocket в dev). */
export const API_ORIGIN = parseApiOrigin(import.meta.env.VITE_API_URL);

/** База для запросов: same-origin /api/ → nginx/vite проксирует на бэкенд. */
export const API_BASE_URL = apiBaseRaw.endsWith('/') ? apiBaseRaw : `${apiBaseRaw}/`;

export function getApiOrigin() {
    return API_ORIGIN;
}

/**
 * Публичное фото: GET /main/photo/{image_path}
 * Напрямую на VITE_API_URL — storage на test-api; прокси test2-www может быть устаревшим.
 */
export const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }

    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    const encodedPath = cleanPath.split('/').map((segment) => encodeURIComponent(segment)).join('/');

    if (API_ORIGIN) {
        return `${API_ORIGIN}/main/photo/${encodedPath}`;
    }

    return `${API_BASE_URL}main/photo/${encodedPath}`;
};
