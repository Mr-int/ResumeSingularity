import { apiClientJson } from '../utils/apiClient.js';

const pageQuery = (page, size) => {
    const p = new URLSearchParams();
    p.set('page', String(page));
    p.set('size', String(size));
    return p.toString();
};

const appendFilterParams = (params, filter = {}) => {
    if (filter.findString) params.set('findString', filter.findString);
    if (filter.city) params.set('city', filter.city);
    (filter.workFormats || []).forEach((v) => params.append('workFormats', v));
    (filter.employmentTypes || []).forEach((v) => params.append('employmentTypes', v));
    (filter.specialityIds || []).forEach((v) => params.append('specialityIds', String(v)));
    (filter.skillIds || []).forEach((v) => params.append('skillIds', String(v)));
};

export const listVacancies = (filter = {}, page = 0, size = 20) => {
    const params = new URLSearchParams(pageQuery(page, size));
    appendFilterParams(params, filter);
    return apiClientJson(`vacancies?${params.toString()}`, { method: 'GET' });
};

export const getVacancyById = (id) => apiClientJson(`vacancies/${id}`, { method: 'GET' });

export const listMyVacancies = () => apiClientJson('vacancies/mine', { method: 'GET' });

export const listMyApplications = (page = 0, size = 20) =>
    apiClientJson(`vacancies/applications/mine?${pageQuery(page, size)}`, { method: 'GET' });

export const createVacancy = (body) =>
    apiClientJson('vacancies', { method: 'POST', body: JSON.stringify(body) });

export const updateVacancy = (id, body) =>
    apiClientJson(`vacancies/${id}`, { method: 'PUT', body: JSON.stringify(body) });

export const submitVacancyForReview = (id) =>
    apiClientJson(`vacancies/${id}/submit-for-review`, { method: 'POST' });

export const closeVacancy = (id) =>
    apiClientJson(`vacancies/${id}/close`, { method: 'POST' });

export const deleteVacancy = (id) =>
    apiClientJson(`vacancies/${id}`, { method: 'DELETE' });

export const applyToVacancy = (id, body) =>
    apiClientJson(`vacancies/${id}/applications`, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
    });

export const withdrawApplication = (applicationId) =>
    apiClientJson(`vacancies/applications/${applicationId}/withdraw`, { method: 'POST' });

export const vacancyPageRows = (res) => {
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.content)) return res.content;
    return [];
};
