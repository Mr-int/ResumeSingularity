import { apiClientJson } from '../utils/apiClient.js';

const pageQuery = (page, size) => {
    const p = new URLSearchParams();
    p.set('page', String(page));
    p.set('size', String(size));
    return p.toString();
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
 * POST /request/filter (ADMIN)
 */
export const filterRequests = (filter = {}, page = 0, size = 50) =>
    apiClientJson(`request/filter?${pageQuery(page, size)}`, {
        method: 'POST',
        body: JSON.stringify(filter),
    });

/**
 * POST /request/mine/filter — заявки текущего студента или рекрутера
 */
export const filterMyRequests = (filter = {}, page = 0, size = 50) =>
    apiClientJson(`request/mine/filter?${pageQuery(page, size)}`, {
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
 * POST /request/{id}/tu-decision
 * @param {{ accept: boolean, reasonCode?: string, comment?: string }} payload
 */
export const postTuDecision = (requestId, payload) =>
    apiClientJson(`request/${requestId}/tu-decision`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
