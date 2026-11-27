import { apiClientJson } from '../utils/apiClient.js';
import { API_BASE_URL, getImageUrl } from '../config/api.js';

const withPageParams = (endpoint, pageable) => {
    if (!pageable) return endpoint;
    const page = typeof pageable.page === 'number' ? pageable.page : 0;
    const size = typeof pageable.size === 'number' ? pageable.size : 10;
    const qs = new URLSearchParams({ page: String(page), size: String(size) }).toString();
    return `${endpoint}?${qs}`;
};

// ---- Students / Recruiters ----
export const getStudentById = (id) => apiClientJson(`student/${id}`, { method: 'GET' });
/**
 * Пробы роли: 403/401 на «чужом» /me не должны выкидывать из аккаунта
 * (хедер/настройки/чаты по очереди дергают student и recruiter).
 */
export const getStudentMe = () =>
    apiClientJson('student/me', {
        method: 'GET',
        skipSessionClearOn403: true,
        skipAuthRedirect: true,
    });

export const getRecruiterById = (id) => apiClientJson(`recruiter/${id}`, { method: 'GET' });
export const getRecruiterMe = () =>
    apiClientJson('recruiter/me', {
        method: 'GET',
        skipSessionClearOn403: true,
        skipAuthRedirect: true,
    });

// ---- Dictionaries / entities ----
export const getSpecialityById = (id) => apiClientJson(`speciality/${id}`, { method: 'GET' });
export const getSkillById = (id) => apiClientJson(`skill/${id}`, { method: 'GET' });

export const getPortfolioById = (id) => apiClientJson(`portfolio/${id}`, { method: 'GET' });
export const getInstitutionById = (id) => apiClientJson(`institution/${id}`, { method: 'GET' });
export const getExperienceById = (id) => apiClientJson(`experience/${id}`, { method: 'GET' });
export const getEducationById = (id) => apiClientJson(`education/${id}`, { method: 'GET' });
export const getCompanyById = (id) => apiClientJson(`company/${id}`, { method: 'GET' });

/** POST /city/filter — поиск городов с серверной пагинацией, без входа. */
export const searchCityPage = async ({ name = '', page = 0, size = 20 } = {}, options = {}) => {
    const resp = await apiClientJson(`city/filter?page=${page}&size=${size}`, {
        method: 'POST',
        body: JSON.stringify({ name: String(name || '') }),
        ...options,
    });
    const rows = Array.isArray(resp?.data) ? resp.data : [];
    const normalized = rows
        .map((item) => ({
            id: Number(item?.id),
            name: String(item?.name || '').trim(),
        }))
        .filter((item) => Number.isInteger(item.id) && item.id > 0 && item.name);

    return {
        rows: normalized,
        page: Number.isFinite(resp?.page) ? resp.page : page,
        totalPages: Number.isFinite(resp?.totalPages) ? resp.totalPages : 0,
    };
};

/** POST /city/filter — справочник городов, без входа. */
export const filterCityNames = async (options = {}) => {
    const resp = await apiClientJson('city/filter?page=0&size=200', {
        method: 'POST',
        body: JSON.stringify({ name: '' }),
        ...options,
    });
    const rows = Array.isArray(resp?.data) ? resp.data : [];
    const names = [];
    const seen = new Set();
    rows.forEach((item) => {
        const name = String(item?.name || '').trim();
        const key = name.toLowerCase();
        if (!name || seen.has(key)) return;
        seen.add(key);
        names.push(name);
    });
    return names;
};

// ---- Requests ----
export const getRequestById = () => {
    const err = new Error('Заявки временно недоступны');
    err.status = 0;
    return Promise.reject(err);
};

// ---- Main ----
export const getMainStatus = () => apiClientJson('main/status', { method: 'GET' });

/**
 * URL для картинки через /main/photo/{image_path}
 * (используй в <img src="...">, чтобы не возиться с blob).
 */
export const getMainPhotoUrl = (imagePath) => getImageUrl(imagePath);

/**
 * Если нужно именно скачать изображение как Blob.
 */
export const fetchMainPhotoBlob = async (imagePath) => {
    const url = getImageUrl(imagePath);
    if (!url) return null;

    const response = await fetch(url.startsWith('http') || url.startsWith('/') ? url : `${API_BASE_URL}${url}`, {
        method: 'GET',
        credentials: 'include',
    });

    if (!response.ok) {
        const err = new Error(`Не удалось загрузить изображение: ${response.status}`);
        err.status = response.status;
        throw err;
    }

    return await response.blob();
};

