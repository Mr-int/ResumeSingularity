import { apiClientJson } from '../utils/apiClient.js';

const pathId = (id) => {
    if (id == null || id === '') throw new Error('Не указан ID заявки');
    return encodeURIComponent(String(id));
};

const pageQuery = (page, size) =>
    new URLSearchParams({ page: String(page), size: String(size) }).toString();

const normalizePage = (data, page, size) => ({
    data: Array.isArray(data?.data) ? data.data : Array.isArray(data?.content) ? data.content : [],
    page: Number.isInteger(data?.page) ? data.page : page,
    size: Number.isInteger(data?.size) ? data.size : size,
    totalElements: Number.isFinite(data?.totalElements) ? data.totalElements : 0,
    totalPages: Number.isFinite(data?.totalPages) ? data.totalPages : 0,
});

const ALLOWED_STATUSES = ['OPEN', 'CLOSED', 'ARCHIVED'];

export const filterRecruitmentRequests = async (
    { status, page = 0, size = 20, signal } = {},
) => {
    const safePage = Number.isInteger(page) && page >= 0 ? page : 0;
    const safeSize = Number.isInteger(size) && size > 0 && size <= 100 ? size : 20;

    const data = await apiClientJson(`recruitment-requests/filter?${pageQuery(safePage, safeSize)}`, {
        method: 'POST',
        body: JSON.stringify(ALLOWED_STATUSES.includes(status) ? { status } : {}),
        signal,
    });
    return normalizePage(data, safePage, safeSize);
};

export const getRecruitmentRequest = (id, options = {}) =>
    apiClientJson(`recruitment-requests/${pathId(id)}`, {
        method: 'GET',
        signal: options.signal,
    });

export const createRecruitmentRequest = (body) =>
    apiClientJson('recruitment-requests', {
        method: 'POST',
        body: JSON.stringify(body),
    });

export const updateRecruitmentRequest = (id, body) =>
    apiClientJson(`recruitment-requests/${pathId(id)}`, {
        method: 'PUT',
        body: JSON.stringify(body),
    });

export const closeRecruitmentRequest = (id) =>
    apiClientJson(`recruitment-requests/${pathId(id)}/close`, { method: 'POST' });

export const archiveRecruitmentRequest = (id) =>
    apiClientJson(`recruitment-requests/${pathId(id)}/archive`, { method: 'POST' });

export const listRecruitmentResponses = async (id, options = {}) => {
    const data = await apiClientJson(`recruitment-requests/${pathId(id)}/responses`, {
        method: 'GET',
        signal: options.signal,
        skipAuthRedirect: options.skipAuthRedirect === true,
        skipSessionClearOn403: options.skipSessionClearOn403 === true,
    });
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.content)) return data.content;
    return [];
};

export const respondToRecruitment = (id) =>
    apiClientJson(`recruitment-requests/${pathId(id)}/responses`, { method: 'POST' });

export const acceptRecruitmentResponse = (id, responseId) =>
    apiClientJson(
        `recruitment-requests/${pathId(id)}/responses/${pathId(responseId)}/accept`,
        { method: 'POST' },
    );

export const rejectRecruitmentResponse = (id, responseId) =>
    apiClientJson(
        `recruitment-requests/${pathId(id)}/responses/${pathId(responseId)}/reject`,
        { method: 'POST' },
    );

export const listCatalogCities = async (options = {}) => {
    const all = [];
    for (let page = 0; page < 20; page += 1) {
        const res = await apiClientJson(`city/filter?page=${page}&size=200`, {
            method: 'POST',
            body: JSON.stringify({}),
            signal: options.signal,
        });
        const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res?.content) ? res.content : [];
        all.push(...rows);
        const totalPages = Number.isFinite(res?.totalPages) ? res.totalPages : 1;
        if (!rows.length || page + 1 >= totalPages) break;
    }
    return all;
};
