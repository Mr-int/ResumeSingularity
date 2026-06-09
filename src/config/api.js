const envBase = import.meta.env.VITE_API_URL;

/** Dev: /api/ (Vite proxy). Prod: VITE_API_URL + trailing slash */
export const API_BASE_URL = envBase
    ? `${String(envBase).replace(/\/$/, '')}/`
    : '/api/';

/** Origin для WebSocket (без /api) */
export const API_WS_ORIGIN = envBase
    ? String(envBase).replace(/\/$/, '')
    : typeof window !== 'undefined'
      ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`
      : '';

/**
 * URL изображения: {BASE}main/photo/{imagePath}
 */
export const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }

    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `${API_BASE_URL}main/photo/${cleanPath}`;
};
