import { apiClientJson } from '../utils/apiClient.js';

export const filterProjects = async () => {
    const data = await apiClientJson('projects/filter', {
        method: 'POST',
        body: JSON.stringify({}),
    });
    return Array.isArray(data) ? data : [];
};

export const getProject = (id) => apiClientJson(`projects/${id}`, { method: 'GET' });
