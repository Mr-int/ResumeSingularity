import { apiClientJson } from '../utils/apiClient.js';

const pageQuery = (page, size) => `page=${page}&size=${size}`;

export const filterRecruitmentRequests = async ({ status, page = 0, size = 20 } = {}) => {
    const data = await apiClientJson(`recruitment-requests/filter?${pageQuery(page, size)}`, {
        method: 'POST',
        body: JSON.stringify(status ? { status } : {}),
    });
    return {
        data: Array.isArray(data?.data) ? data.data : [],
        page: data?.page ?? page,
        size: data?.size ?? size,
        totalElements: data?.totalElements ?? 0,
        totalPages: data?.totalPages ?? 0,
    };
};

export const getRecruitmentRequest = (id) =>
    apiClientJson(`recruitment-requests/${id}`, { method: 'GET' });

export const createRecruitmentRequest = (body) =>
    apiClientJson('recruitment-requests', {
        method: 'POST',
        body: JSON.stringify(body),
    });

export const updateRecruitmentRequest = (id, body) =>
    apiClientJson(`recruitment-requests/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
    });

export const closeRecruitmentRequest = (id) =>
    apiClientJson(`recruitment-requests/${id}/close`, { method: 'POST' });

export const archiveRecruitmentRequest = (id) =>
    apiClientJson(`recruitment-requests/${id}/archive`, { method: 'POST' });

export const listRecruitmentResponses = async (id) => {
    const data = await apiClientJson(`recruitment-requests/${id}/responses`, { method: 'GET' });
    return Array.isArray(data) ? data : [];
};

export const respondToRecruitment = (id) =>
    apiClientJson(`recruitment-requests/${id}/responses`, { method: 'POST' });

export const acceptRecruitmentResponse = (id, responseId) =>
    apiClientJson(`recruitment-requests/${id}/responses/${responseId}/accept`, { method: 'POST' });

export const rejectRecruitmentResponse = (id, responseId) =>
    apiClientJson(`recruitment-requests/${id}/responses/${responseId}/reject`, { method: 'POST' });

export const listCatalogCities = async () => {
    const all = [];
    for (let page = 0; page < 20; page += 1) {
        const res = await apiClientJson(`city/filter?page=${page}&size=200`, {
            method: 'POST',
            body: JSON.stringify({}),
        });
        const rows = Array.isArray(res?.data) ? res.data : [];
        all.push(...rows);
        const totalPages = res?.totalPages ?? 1;
        if (!rows.length || page + 1 >= totalPages) break;
    }
    return all;
};
