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
export const getStudentMe = () => apiClientJson('student/me', { method: 'GET' });

export const getRecruiterById = (id) => apiClientJson(`recruiter/${id}`, { method: 'GET' });
export const getRecruiterMe = () => apiClientJson('recruiter/me', { method: 'GET' });

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

    const response = await fetch(url.startsWith('/api/') ? url : `${API_BASE_URL}${url}`, {
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

