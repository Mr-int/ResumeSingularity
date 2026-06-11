import { apiClientJson } from '../utils/apiClient.js';
import { buildPageQuery, normalizePageResponse } from '../utils/pageable.js';

/** GET /public/vitrina/home */
export const getPublicHomeVitrina = () =>
    apiClientJson('public/vitrina/home', { method: 'GET' });

/** GET /public/projects */
export const listPublicProjects = (q) => {
    const params = q ? `?q=${encodeURIComponent(q)}` : '';
    return apiClientJson(`public/projects${params}`, { method: 'GET' });
};

/** GET /public/projects/{id} */
export const getPublicProject = (id) =>
    apiClientJson(`public/projects/${id}`, { method: 'GET' });

/** GET /public/students/{id} */
export const getPublicStudentCard = (id) =>
    apiClientJson(`public/students/${id}`, { method: 'GET' });

/**
 * POST /public/students/cards
 * Публичная витрина карточек (без JWT).
 */
export const filterPublicStudentCards = async (filterReq = {}, page = 0, size = 20) => {
    const { query } = buildPageQuery({ page, size });
    const resp = await apiClientJson(`public/students/cards?${query}`, {
        method: 'POST',
        body: JSON.stringify(filterReq ?? {}),
    });
    return normalizePageResponse(resp, page, size);
};

/** GET /public/vacancies — публичная витрина (не используется в ЛК, только для справки). */
export const listPublicVacancies = async (filter = {}, page = 0, size = 20) => {
    const { query } = buildPageQuery({ page, size });
    const params = new URLSearchParams(query);
    if (filter.findString) params.set('findString', filter.findString);
    if (filter.city) params.set('city', filter.city);
    (filter.workFormats || []).forEach((v) => params.append('workFormats', v));
    (filter.employmentTypes || []).forEach((v) => params.append('employmentTypes', v));
    (filter.specialityIds || []).forEach((v) => params.append('specialityIds', String(v)));
    (filter.skillIds || []).forEach((v) => params.append('skillIds', String(v)));
    return apiClientJson(`public/vacancies?${params.toString()}`, { method: 'GET' });
};

/** GET /main/status */
export const pingApiStatus = async () => {
    const { API_BASE_URL } = await import('../config/api.js');
    const response = await fetch(`${API_BASE_URL}main/status`, {
        method: 'GET',
        credentials: 'include',
    });
    return response.status === 204;
};
