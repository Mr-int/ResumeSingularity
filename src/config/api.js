import { APP_BASE_URL } from '../utils/appBase.js';

const withTrailingSlash = (url) => (url.endsWith('/') ? url : `${url}/`);

const defaultApiBase = import.meta.env.DEV
    ? '/api/v1/'
    : `${APP_BASE_URL}api/v1/`;

export const API_BASE_URL = withTrailingSlash(
    import.meta.env.VITE_API_BASE_URL || defaultApiBase,
);

export const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }

    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `${API_BASE_URL}main/photo/${cleanPath}`;
};