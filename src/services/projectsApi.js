import { apiClientJson } from '../utils/apiClient.js';

import { API_BASE_URL } from '../config/api.js';

import { isAuthenticated } from './authApi.js';



function withSearchQuery(basePath, q) {

    if (!q || !String(q).trim()) return basePath;

    const params = new URLSearchParams({ q: String(q).trim() });

    return `${basePath}?${params.toString()}`;

}



export const getPublicProjects = async (q) => {

    const response = await fetch(`${API_BASE_URL}${withSearchQuery('public/projects', q)}`, {

        method: 'GET',

    });

    if (!response.ok) {

        throw new Error(`Не удалось загрузить проекты: ${response.status}`);

    }

    return response.json();

};



export const getPublicProject = async (id) => {

    const response = await fetch(`${API_BASE_URL}public/projects/${id}`, { method: 'GET' });

    if (!response.ok) {

        throw new Error(response.status === 404 ? 'Проект не найден' : `Ошибка: ${response.status}`);

    }

    return response.json();

};



export const getProjects = (q) => apiClientJson(withSearchQuery('projects', q), { method: 'GET' });



export const getProject = (id) => apiClientJson(`projects/${id}`, { method: 'GET' });



/** Список с учётом авторизации (авторизованные видят больше проектов). */

export async function getProjectsForViewer(q) {

    if (isAuthenticated()) {

        return getProjects(q);

    }

    return getPublicProjects(q);

}



/** Детальная карточка с учётом авторизации. */

export async function getProjectForViewer(id) {

    if (isAuthenticated()) {

        return getProject(id);

    }

    return getPublicProject(id);

}

