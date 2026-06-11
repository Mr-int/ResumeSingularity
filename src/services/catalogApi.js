import { apiClientJson } from '../utils/apiClient.js';
import { buildPageQuery, normalizePageResponse } from '../utils/pageable.js';
import { hasApprovedCatalogAccess } from './authApi.js';

const withDefaultStudentSort = (filterReq = {}) => ({
    useDefaultRanking: true,
    ...filterReq,
});

const appendVacancyFilterParams = (params, filter = {}) => {
    if (filter.findString) params.set('findString', filter.findString);
    if (filter.city) params.set('city', filter.city);
    (filter.workFormats || []).forEach((v) => params.append('workFormats', v));
    (filter.employmentTypes || []).forEach((v) => params.append('employmentTypes', v));
    (filter.specialityIds || []).forEach((v) => params.append('specialityIds', String(v)));
    (filter.skillIds || []).forEach((v) => params.append('skillIds', String(v)));
};

function requireApprovedCatalog() {
    if (!hasApprovedCatalogAccess()) {
        const err = new Error('Каталог доступен после одобрения аккаунта');
        err.status = 403;
        throw err;
    }
}

/**
 * POST /student/cardsFilter — только для одобренных пользователей.
 */
export const filterStudentCardsPage = async (filterReq = {}, pageable = { page: 0, size: 20 }) => {
    requireApprovedCatalog();
    const { page, size, query } = buildPageQuery(pageable);
    const resp = await apiClientJson(`student/cardsFilter?${query}`, {
        method: 'POST',
        body: JSON.stringify(withDefaultStudentSort(filterReq)),
    });
    return normalizePageResponse(resp, page, size);
};

/** GET /student/{id} */
export const getStudentById = async (id) => {
    requireApprovedCatalog();
    return apiClientJson(`student/${id}`, { method: 'GET' });
};

/** GET /vacancies — лента для авторизованных одобренных пользователей. */
export const listVacanciesPage = async (filter = {}, page = 0, size = 20) => {
    requireApprovedCatalog();
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('size', String(size));
    appendVacancyFilterParams(params, filter);
    return apiClientJson(`vacancies?${params.toString()}`, { method: 'GET' });
};

/** GET /vacancies/{id} */
export const getVacancyById = async (id) => {
    requireApprovedCatalog();
    return apiClientJson(`vacancies/${id}`, { method: 'GET' });
};

/** GET /projects */
export const listAuthProjects = (q) => {
    const params = q ? `?q=${encodeURIComponent(q)}` : '';
    return apiClientJson(`projects${params}`, { method: 'GET' });
};

/** GET /projects/{id} */
export const getAuthProject = (id) => apiClientJson(`projects/${id}`, { method: 'GET' });
