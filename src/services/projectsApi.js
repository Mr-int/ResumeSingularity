import { apiClientJson } from '../utils/apiClient.js';
import { hasApprovedCatalogAccess, requestLogin } from './authApi.js';

/** API может вернуть массив или обёртку PageResponse / { value, Count }. */
export function normalizeProjectsList(response) {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.value)) return response.value;
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

const requireCatalogAccess = () => {
    if (!hasApprovedCatalogAccess()) {
        requestLogin();
        const err = new Error('Требуется вход и одобрение аккаунта');
        err.status = 401;
        throw err;
    }
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

/** Список проектов — только для одобренных пользователей. */
export async function getProjectsForViewer(q) {
    requireCatalogAccess();
    return fetchProjectsList(() => getProjects(q));
}

/** Детальная карточка с учётом доступа. */
export async function getProjectForViewer(id) {
    requireCatalogAccess();
    return getProject(id);
}
