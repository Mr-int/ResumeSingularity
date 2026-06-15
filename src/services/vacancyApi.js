import { apiClientJson } from '../utils/apiClient.js';
import { buildPageQuery, extractPageRows } from '../utils/pageable.js';
import { canStudentApplyToVacancies } from './authApi.js';
import { PENDING_APPROVAL_MESSAGE } from '../utils/apiErrors.js';
import { getVacancyById, listVacanciesPage } from './catalogApi.js';

export const vacancyPageRows = (res) => extractPageRows(res);

const requireStudentVacancyAccess = () => {
    if (!canStudentApplyToVacancies()) {
        const err = new Error(PENDING_APPROVAL_MESSAGE);
        err.status = 403;
        throw err;
    }
};

export const listVacancies = (filter = {}, page = 0, size = 20) => listVacanciesPage(filter, page, size);

export const getVacancy = (id) => getVacancyById(id);

export const listMyVacancies = () => apiClientJson('vacancies/mine', { method: 'GET' });

export const listMyApplications = (page = 0, size = 20) => {
    requireStudentVacancyAccess();
    const { query } = buildPageQuery({ page, size });
    return apiClientJson(`vacancies/applications/mine?${query}`, { method: 'GET' });
};

export const createVacancy = (body) =>
    apiClientJson('vacancies', { method: 'POST', body: JSON.stringify(body) });

export const updateVacancy = (id, body) =>
    apiClientJson(`vacancies/${id}`, { method: 'PUT', body: JSON.stringify(body) });

export const submitVacancyForReview = (id) =>
    apiClientJson(`vacancies/${id}/submit-for-review`, { method: 'POST' });

export const closeVacancy = (id) => apiClientJson(`vacancies/${id}/close`, { method: 'POST' });

export const deleteVacancy = (id) => apiClientJson(`vacancies/${id}`, { method: 'DELETE' });

export const listVacancyApplications = (vacancyId, page = 0, size = 20) => {
    const { query } = buildPageQuery({ page, size });
    return apiClientJson(`vacancies/${vacancyId}/applications?${query}`, { method: 'GET' });
};

export const applyToVacancy = (id, body) => {
    requireStudentVacancyAccess();
    return apiClientJson(`vacancies/${id}/applications`, {
        method: 'POST',
        body: JSON.stringify(body ?? {}),
    });
};

export const acceptApplication = (vacancyId, applicationId) =>
    apiClientJson(`vacancies/${vacancyId}/applications/${applicationId}/accept`, { method: 'POST' });

export const rejectApplication = (vacancyId, applicationId, body) =>
    apiClientJson(`vacancies/${vacancyId}/applications/${applicationId}/reject`, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
    });

export const withdrawApplication = (applicationId) =>
    apiClientJson(`vacancies/applications/${applicationId}/withdraw`, { method: 'POST' });

export const tuDecisionOnApplication = (applicationId, body) =>
    apiClientJson(`vacancies/applications/${applicationId}/tu-decision`, {
        method: 'POST',
        body: JSON.stringify(body),
    });
