import { apiClientJson } from '../utils/apiClient.js';
import { hasApprovedCatalogAccess, requestLogin } from './authApi.js';

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

const requireCatalogAccess = () => {
    if (!hasApprovedCatalogAccess()) {
        requestLogin();
        const err = new Error('Требуется вход и одобрение аккаунта');
        err.status = 401;
        throw err;
    }
};

/**
 * Каталог карточек студентов — только для одобренных пользователей.
 */
export const filterStudentCardsPage = async (filterReq = {}, pageable = { page: 0, size: 100 }) => {
    requireCatalogAccess();
    const { page, size } = pageQuery(pageable);
    const body = withDefaultCatalogSort(filterReq);

    const resp = await apiClientJson(`student/cardsFilter?page=${page}&size=${size}`, {
        method: 'POST',
        body: JSON.stringify(body),
        skipSessionClearOn403: true,
    });
    return normalizePage(resp, page, size);
};

const unwrapStudentPayload = (payload) => {
    if (!payload || typeof payload !== 'object') return payload;
    if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
        return payload.data;
    }
    if (payload.content && typeof payload.content === 'object' && !Array.isArray(payload.content)) {
        return payload.content;
    }
    return payload;
};

const normalizeStudentCard = (student, fallbackId) => {
    if (!student || typeof student !== 'object') return null;
    const resolvedId = student.id ?? student.studentId ?? fallbackId;
    if (resolvedId == null || resolvedId === '') return null;
    return { ...student, id: resolvedId };
};

/** Карточка резюме — authenticated API для одобренных пользователей. */
export const getStudentCardById = async (id) => {
    if (!id) {
        const err = new Error('ID студента не указан');
        err.status = 400;
        throw err;
    }

    requireCatalogAccess();

    try {
        const raw = await apiClientJson(`student/${id}`, { method: 'GET', skipSessionClearOn403: true });
        const student = normalizeStudentCard(unwrapStudentPayload(raw), id);
        if (student) return student;
    } catch (error) {
        const err = new Error('Студент не найден');
        err.status = error?.status ?? 404;
        throw err;
    }

    const err = new Error('Студент не найден');
    err.status = 404;
    throw err;
};

const appendVacancyFilterParams = (params, filter = {}) => {
    if (filter.findString) params.set('findString', filter.findString);
    if (filter.city) params.set('city', filter.city);
    (filter.workFormats || []).forEach((v) => params.append('workFormats', v));
    (filter.employmentTypes || []).forEach((v) => params.append('employmentTypes', v));
    (filter.specialityIds || []).forEach((v) => params.append('specialityIds', String(v)));
    (filter.skillIds || []).forEach((v) => params.append('skillIds', String(v)));
};

/** Лента вакансий — только для одобренных пользователей. */
export const listVacanciesPage = async (filter = {}, page = 0, size = 20) => {
    requireCatalogAccess();
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('size', String(size));
    appendVacancyFilterParams(params, filter);
    return apiClientJson(`vacancies?${params.toString()}`, { method: 'GET' });
};

export const getVacancyCardById = async (id) => {
    requireCatalogAccess();
    return apiClientJson(`vacancies/${id}`, { method: 'GET' });
};

export { getProjects, getProject, getProjectsForViewer, getProjectForViewer } from './projectsApi.js';
