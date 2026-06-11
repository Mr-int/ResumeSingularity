/** @typedef {{ page?: number, size?: number, sort?: string[] }} Pageable */

export const buildPageQuery = (pageable = {}) => {
    const page = typeof pageable.page === 'number' ? pageable.page : 0;
    const size = typeof pageable.size === 'number' ? pageable.size : 20;
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('size', String(size));
    for (const s of pageable.sort || []) {
        params.append('sort', s);
    }
    return { page, size, query: params.toString() };
};

export const extractPageRows = (resp) => {
    if (Array.isArray(resp)) return resp;
    if (Array.isArray(resp?.data)) return resp.data;
    if (Array.isArray(resp?.content)) return resp.content;
    return [];
};

export const normalizePageResponse = (resp, page, size) => ({
    data: extractPageRows(resp),
    page: typeof resp?.page === 'number' ? resp.page : page,
    size: typeof resp?.size === 'number' ? resp.size : size,
    totalElements: typeof resp?.totalElements === 'number' ? resp.totalElements : 0,
    totalPages: typeof resp?.totalPages === 'number' ? resp.totalPages : 0,
});
