import { getImageUrl } from '../config/api.js';
import { apiClientJson } from '../utils/apiClient.js';
import { extractPageRows, normalizePageResponse } from '../utils/pageable.js';
import { listAuthProjects, getAuthProject } from './catalogApi.js';
import { listPublicProjects, getPublicProject } from './publicApi.js';
import { getPortfolioById } from './getApi.js';
import { hasApprovedCatalogAccess, isAuthenticated } from './authApi.js';

const toImageUrl = (value) => {
    if (!value) return null;
    const raw = typeof value === 'string' ? value : value?.imagePath || value?.path || value?.url;
    return raw ? getImageUrl(raw) : null;
};

export const extractProjectImages = (item) => {
    if (!item || typeof item !== 'object') return [];
    const buckets = [
        item.images,
        item.imagePaths,
        item.photos,
        item.screenshots,
        item.gallery,
    ];
    const paths = [];
    for (const bucket of buckets) {
        if (!Array.isArray(bucket)) continue;
        for (const entry of bucket) {
            const url = toImageUrl(entry);
            if (url) paths.push(url);
        }
    }
    const single = toImageUrl(item.imagePath || item.image || item.coverImage || item.photo);
    if (single && !paths.includes(single)) paths.unshift(single);
    return paths;
};

export const normalizeProjectCard = (item, source = 'catalog') => {
    if (!item || typeof item !== 'object') return null;

    const id = item.id ?? item.portfolioId ?? item.projectId;
    const title = (item.title || item.name || '').toString().trim();
    const description = (item.description || item.additionalInfo || item.summary || '').toString().trim();
    const link = (item.link || item.url || item.website || '').toString().trim();
    const studentId = item.studentId ?? item.student?.id ?? null;
    let studentName = (item.studentName || item.authorName || '').toString().trim();
    if (!studentName && item.student) {
        studentName = `${item.student.firstName || ''} ${item.student.lastName || ''}`.trim();
    }

    return {
        id,
        title: title || 'Проект',
        description,
        link,
        images: extractProjectImages(item),
        studentId: studentId != null ? String(studentId) : null,
        studentName,
        source,
    };
};

export const filterPortfoliosPage = async (filterReq = {}, page = 0, size = 50) => {
    const resp = await apiClientJson('portfolio/filter', {
        method: 'POST',
        body: JSON.stringify({ ...filterReq, page, size }),
    });
    return normalizePageResponse(resp, page, size);
};

const fetchCatalogProjects = async (q) => {
    const query = q?.trim() || undefined;
    if (isAuthenticated()) {
        return listAuthProjects(query);
    }
    return listPublicProjects(query);
};

/** Каталог проектов студентов: /projects, при пустом ответе — portfolio/filter. */
export const listStudentProjectCards = async (q = '') => {
    const query = q.trim() || undefined;

    try {
        const raw = await fetchCatalogProjects(query);
        const rows = extractPageRows(raw)
            .map((item) => normalizeProjectCard(item, 'catalog'))
            .filter((item) => item && item.id != null);
        if (rows.length > 0) return rows;
    } catch {
        /* fallback ниже */
    }

    const pageRes = await filterPortfoliosPage(query ? { name: query } : {}, 0, 200);
    return pageRes.data
        .map((item) => normalizeProjectCard(item, 'portfolio'))
        .filter((item) => item && item.id != null);
};

export const getStudentProject = async (id, source = 'catalog') => {
    if (source === 'portfolio') {
        return getPortfolioById(id);
    }
    try {
        if (isAuthenticated() && hasApprovedCatalogAccess()) {
            return getAuthProject(id);
        }
        if (isAuthenticated()) {
            return getAuthProject(id);
        }
        return getPublicProject(id);
    } catch {
        return getPortfolioById(id);
    }
};
