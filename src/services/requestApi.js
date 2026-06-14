import { apiClientJson } from '../utils/apiClient.js';
import { extractPageRows } from '../utils/pageable.js';

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

/** Строки из POST /request/mine/filter и POST /request/filter. */
export const extractRequestRows = (resp) => extractPageRows(resp);

/** Числовой id заявки (int64) из DTO. */
export const resolveRequestId = (request) => {
    const raw = request?.id ?? request?.requestId;
    const id = Number(raw);
    return Number.isFinite(id) && id >= 1 ? Math.trunc(id) : null;
};

/**
 * POST /request/{id}/student-decision
 * Тело: { accept: boolean, comment: string }
 */
export const buildStudentDecisionBody = (accept, comment = '') => ({
    accept: accept === true,
    comment: String(comment ?? '').trim().slice(0, 4000),
});

export const postStudentDecision = (requestId, payload) => {
    const id = resolveRequestId({ id: requestId });
    if (id == null) {
        throw new Error('Не удалось определить номер заявки');
    }
    if (payload?.accept === undefined) {
        throw new Error('Не указано решение по заявке');
    }
    return apiClientJson(`request/${id}/student-decision`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
};

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
 * Тело: { accept: boolean, reasonCode?: string, comment: string }
 */
export const postRequestTuDecision = (requestId, payload) => {
    const id = resolveRequestId({ id: requestId });
    if (id == null) {
        throw new Error('Не удалось определить номер заявки');
    }
    if (payload?.accept === undefined) {
        throw new Error('Не указано решение по ТУ');
    }
    return apiClientJson(`request/${id}/tu-decision`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
};

/**
 * DELETE /request/{id}
 */
export const deleteRequest = (id) =>
    apiClientJson(`request/${id}`, { method: 'DELETE' });
