import { apiClientJson } from '../utils/apiClient.js';
import { API_BASE_URL } from '../config/api.js';
import { hasRecruiterCatalogAccess, isAuthenticated } from './authApi.js';

const pageQuery = (pageable = {}) => {
    const page = typeof pageable.page === 'number' ? pageable.page : 0;
    const size = typeof pageable.size === 'number' ? pageable.size : 100;
    return { page, size };
};

/** Spring Page: content (актуальный API) или data (legacy). */
export const extractPageRows = (resp) => {
    if (Array.isArray(resp?.content)) return resp.content;
    if (Array.isArray(resp?.data)) return resp.data;
    return [];
};

const withDefaultCatalogSort = (filterReq = {}) => ({
    sortBy: 'CREATED_AT',
    sortDirection: 'DESC',
    useDefaultRanking: true,
    ...filterReq,
});

const normalizePage = (resp, page, size) => ({
    data: extractPageRows(resp),
    page: typeof resp?.page === 'number' ? resp.page : page,
    size: typeof resp?.size === 'number' ? resp.size : size,
    totalElements: typeof resp?.totalElements === 'number' ? resp.totalElements : 0,
    totalPages: typeof resp?.totalPages === 'number' ? resp.totalPages : 0,
});

async function publicJson(path, init = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        credentials: 'omit',
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...(init.headers || {}),
        },
    });
    if (!response.ok) {
        const text = await response.text();
        let msg = text;
        try {
            msg = JSON.parse(text).message || text;
        } catch {
            /* empty */
        }
        const err = new Error(msg || `Ошибка ${response.status}`);
        err.status = response.status;
        throw err;
    }
    const ct = response.headers.get('content-type');
    if (ct?.includes('application/json')) {
        return response.json();
    }
    return {};
}

const fetchPublicStudentCardsPage = async (filterReq, page, size) => {
    const resp = await publicJson(`public/students/cards?page=${page}&size=${size}`, {
        method: 'POST',
        body: JSON.stringify(withDefaultCatalogSort(filterReq)),
    });
    return normalizePage(resp, page, size);
};

/**
 * Каталог карточек студентов.
 * - без входа / STUDENT / pending → POST /public/students/cards
 * - RECRUITER / ADMIN → POST /student/cardsFilter
 */
export const filterStudentCardsPage = async (filterReq = {}, pageable = { page: 0, size: 100 }) => {
    const { page, size } = pageQuery(pageable);
    const body = withDefaultCatalogSort(filterReq);

    if (!hasRecruiterCatalogAccess()) {
        return fetchPublicStudentCardsPage(body, page, size);
    }
    try {
        const resp = await apiClientJson(`student/cardsFilter?page=${page}&size=${size}`, {
            method: 'POST',
            body: JSON.stringify(body),
            skipSessionClearOn403: true,
        });
        return normalizePage(resp, page, size);
    } catch (error) {
        if (error.status === 403 || error.status === 401) {
            return fetchPublicStudentCardsPage(body, page, size);
        }
        throw error;
    }
};

export const getStudentCardById = async (id) => {
    if (!hasRecruiterCatalogAccess()) {
        return publicJson(`public/students/${id}`, { method: 'GET' });
    }
    try {
        return await apiClientJson(`student/${id}`, { method: 'GET', skipSessionClearOn403: true });
    } catch (error) {
        if (error.status === 403 || error.status === 401) {
            return publicJson(`public/students/${id}`, { method: 'GET' });
        }
        throw error;
    }
};

const appendVacancyFilterParams = (params, filter = {}) => {
    if (filter.findString) params.set('findString', filter.findString);
    if (filter.city) params.set('city', filter.city);
    (filter.workFormats || []).forEach((v) => params.append('workFormats', v));
    (filter.employmentTypes || []).forEach((v) => params.append('employmentTypes', v));
    (filter.specialityIds || []).forEach((v) => params.append('specialityIds', String(v)));
    (filter.skillIds || []).forEach((v) => params.append('skillIds', String(v)));
};

/** Лента вакансий: анонимы — /public/vacancies, авторизованные — /vacancies */
export const listVacanciesPage = async (filter = {}, page = 0, size = 20) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('size', String(size));
    appendVacancyFilterParams(params, filter);

    if (!isAuthenticated()) {
        const url = `${API_BASE_URL}public/vacancies?${params.toString()}`;
        const response = await fetch(url, { method: 'GET' });
        if (!response.ok) {
            throw new Error(`Не удалось загрузить вакансии: ${response.status}`);
        }
        return response.json();
    }
    return apiClientJson(`vacancies?${params.toString()}`, { method: 'GET' });
};

export const getVacancyCardById = async (id) => {
    if (!isAuthenticated()) {
        const url = `${API_BASE_URL}public/vacancies/${id}`;
        const response = await fetch(url, { method: 'GET' });
        if (!response.ok) {
            const err = new Error(response.status === 404 ? 'Вакансия не найдена' : `Ошибка: ${response.status}`);
            err.status = response.status;
            throw err;
        }
        return response.json();
    }
    return apiClientJson(`vacancies/${id}`, { method: 'GET' });
};

export { getPublicProjects, getPublicProject, getProjects, getProject, getProjectsForViewer, getProjectForViewer } from './projectsApi.js';
