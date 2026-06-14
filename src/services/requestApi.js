import { apiClientJson } from '../utils/apiClient.js';

const pageQuery = (page, size) => {
    const p = new URLSearchParams();
    p.set('page', String(page));
    p.set('size', String(size));
    return p.toString();
};

/** Тело POST /request: только studentId или studentId + поля рекрутера. */
export const buildCreateRequestBody = (studentId, fields) => {
    if (!fields) return { studentId };
    return { studentId, ...fields };
};

/** @ в UI → username для API (ivan_petrov). */
export const normalizeTelegramForApi = (value) => {
    const pure = String(value ?? '').trim().replace(/^@+/, '');
    return pure || undefined;
};

/**
 * POST /request — заявка рекрутера студенту
 */
export const createRequest = (body) =>
    apiClientJson('request', {
        method: 'POST',
        body: JSON.stringify(body),
    });

/**
 * GET /request/{id}
 */
export const getRequestById = (id) =>
    apiClientJson(`request/${id}`, { method: 'GET' });

/**
 * POST /request/filter
 */
export const filterRequests = (filter = {}, page = 0, size = 50) =>
    apiClientJson(`request/filter?${pageQuery(page, size)}`, {
        method: 'POST',
        body: JSON.stringify(filter),
    });

/**
 * POST /request/{id}/student-decision
 */
export const postStudentDecision = (requestId, payload) =>
    apiClientJson(`request/${requestId}/student-decision`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });

/**
 * POST /request/mine/filter
 */
export const filterMyRequests = (filter = {}, page = 0, size = 50) =>
    apiClientJson(`request/mine/filter?${pageQuery(page, size)}`, {
        method: 'POST',
        body: JSON.stringify(filter),
    });

/**
 * POST /request/{id}/tu-decision
 */
export const postRequestTuDecision = (requestId, payload) =>
    apiClientJson(`request/${requestId}/tu-decision`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });

/**
 * DELETE /request/{id}
 */
export const deleteRequest = (id) =>
    apiClientJson(`request/${id}`, { method: 'DELETE' });
