import { apiClientJson } from '../utils/apiClient.js';
import { API_BASE_URL } from '../config/api.js';
import { hasRecruiterCatalogAccess } from './authApi.js';

/** API может вернуть массив или обёртку PageResponse. */
export function normalizeProjectsList(response) {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.content)) return response.content;
    if (Array.isArray(response?.items)) return response.items;
    return [];
}

/** Сначала новые проекты (по дате или id). */
export function sortProjectsNewestFirst(rows) {
    const list = [...rows];
    list.sort((a, b) => {
        const dateA = a.createdAt || a.updatedAt || a.publishedAt;
        const dateB = b.createdAt || b.updatedAt || b.publishedAt;
        if (dateA && dateB) {
            return new Date(dateB).getTime() - new Date(dateA).getTime();
        }
        const idA = Number(a.id);
        const idB = Number(b.id);
        if (Number.isFinite(idA) && Number.isFinite(idB)) {
            return idB - idA;
        }
        return 0;
    });
    return list;
}

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

export const getProjects = (q) =>
    apiClientJson(withSearchQuery('projects', q), {
        method: 'GET',
        skipSessionClearOn403: true,
    });

export const getProject = (id) =>
    apiClientJson(`projects/${id}`, { method: 'GET', skipSessionClearOn403: true });

async function fetchProjectsList(fetcher) {
    const raw = await fetcher();
    return sortProjectsNewestFirst(normalizeProjectsList(raw));
}

/** Список проектов: публичный каталог для гостей и аккаунтов без полного доступа. */
export async function getProjectsForViewer(q) {
    if (!hasRecruiterCatalogAccess()) {
        return fetchProjectsList(() => getPublicProjects(q));
    }
    try {
        return await fetchProjectsList(() => getProjects(q));
    } catch (error) {
        if (error.status === 401 || error.status === 403) {
            return fetchProjectsList(() => getPublicProjects(q));
        }
        throw error;
    }
}

/** Детальная карточка с учётом доступа. */
export async function getProjectForViewer(id) {
    if (!hasRecruiterCatalogAccess()) {
        return getPublicProject(id);
    }
    try {
        return await getProject(id);
    } catch (error) {
        if (error.status === 401 || error.status === 403) {
            return getPublicProject(id);
        }
        throw error;
    }
}
