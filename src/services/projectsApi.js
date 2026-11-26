import { apiClientJson } from '../utils/apiClient.js';

const normalizeList = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.content)) return data.content;
    return [];
};

export const filterProjects = async (options = {}) => {
    const data = await apiClientJson('projects/filter', {
        method: 'POST',
        body: JSON.stringify({}),
        signal: options.signal,
    });
    return normalizeList(data);
};

export const getProject = (id, options = {}) => {
    if (id == null || id === '') return Promise.reject(new Error('Не указан ID проекта'));
    return apiClientJson(`projects/${encodeURIComponent(String(id))}`, {
        method: 'GET',
        signal: options.signal,
    });
};
