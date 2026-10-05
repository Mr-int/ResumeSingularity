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
/** 403 не сбрасывает сессию — иначе рекрутёр теряет вход при проверке «не студент». */
export const getStudentMe = () =>
    apiClientJson('student/me', { method: 'GET', skipSessionClearOn403: true });

export const getRecruiterById = (id) => apiClientJson(`recruiter/${id}`, { method: 'GET' });
export const getRecruiterMe = () =>
    apiClientJson('recruiter/me', { method: 'GET', skipSessionClearOn403: true });

const catalogRows = (json) => {
    if (Array.isArray(json)) return json;
    if (Array.isArray(json?.data)) return json.data;
    if (Array.isArray(json?.content)) return json.content;
    return [];
};

const fetchJsonSafe = async (url, options) => {
    const response = await fetch(url, { credentials: 'include', ...options });
    if (!response.ok) return null;
    try {
        return await response.json();
    } catch {
        return null;
    }
};

/** Справочник специальностей: POST /speciality/filter, страница в query, тело фильтра пустое. */
export const getSpecialitiesForRegistration = async () => {
    const pageSize = 200;
    const byId = new Map();
    let page = 0;
    let totalPages = 1;

    while (page < totalPages && page < 20) {
        const response = await fetchJsonSafe(
            `${API_BASE_URL}speciality/filter?page=${page}&size=${pageSize}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            },
        );
        for (const item of catalogRows(response)) {
            if (item?.id != null) byId.set(String(item.id), item);
        }
        totalPages = typeof response?.totalPages === 'number' ? response.totalPages : 1;
        page += 1;
        if (!response) break;
    }

    return Array.from(byId.values());
};

// ---- Dictionaries / entities ----
export const getSpecialityById = (id) => apiClientJson(`speciality/${id}`, { method: 'GET' });
export const getSkillById = (id) => apiClientJson(`skill/${id}`, { method: 'GET' });

export const getPortfolioById = (id) => apiClientJson(`portfolio/${id}`, { method: 'GET' });
export const getInstitutionById = (id) => apiClientJson(`institution/${id}`, { method: 'GET' });
export const getExperienceById = (id) => apiClientJson(`experience/${id}`, { method: 'GET' });
export const getEducationById = (id) => apiClientJson(`education/${id}`, { method: 'GET' });
export const getCompanyById = (id) => apiClientJson(`company/${id}`, { method: 'GET' });

// ---- Requests ----
export const getRequestById = (id) => apiClientJson(`request/${id}`, { method: 'GET' });

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

