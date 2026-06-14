import { getImageUrl } from '../config/api.js';
import { extractPageRows } from '../utils/pageable.js';
import { listAuthProjects, getAuthProject } from './catalogApi.js';
import { listPublicProjects, getPublicProject } from './publicApi.js';
import { isAuthenticated } from './authApi.js';

const normalizeSiteProjectImage = (img) => {
    if (!img) return null;
    if (typeof img === 'string') return getImageUrl(img);
    const directUrl = img.imageUrl || img.url;
    if (directUrl && /^https?:\/\//i.test(directUrl)) return directUrl;
    if (img.imagePath) return getImageUrl(img.imagePath);
    if (directUrl) return directUrl;
    return null;
};

/** images[] из SiteProjectDTO, по sortOrder. */
export const extractProjectImages = (item) => {
    if (!item || typeof item !== 'object') return [];
    const rows = Array.isArray(item.images) ? [...item.images] : [];
    rows.sort((a, b) => (Number(a?.sortOrder) || 0) - (Number(b?.sortOrder) || 0));
    const urls = rows.map(normalizeSiteProjectImage).filter(Boolean);
    if (urls.length) return urls;
    const fallback = normalizeSiteProjectImage(item.imagePath || item.image || item.coverImage);
    return fallback ? [fallback] : [];
};

const normalizeProjectParticipants = (item) => {
    const students = item?.students;
    if (!Array.isArray(students)) return [];
    return students
        .map((s) => {
            const id = s?.id;
            if (id == null) return null;
            const firstName = s.firstName || '';
            const lastName = s.lastName || '';
            return {
                id: String(id),
                firstName,
                lastName,
                name: `${firstName} ${lastName}`.trim() || 'Студент',
                speciality: s.speciality || '',
                course: s.course || '',
                imageUrl: s.imagePath ? getImageUrl(s.imagePath) : null,
            };
        })
        .filter(Boolean);
};

/** SiteProjectDTO → карточка витрины. */
export const normalizeProjectCard = (item, source = 'public') => {
    if (!item || typeof item !== 'object') return null;

    const id = item.id ?? item.projectId;
    const title = String(item.title || item.name || '').trim();
    const summary = String(item.summary || '').trim();
    const body = String(item.body || item.description || '').trim();
    const section = String(item.section || '').trim();
    const skills = Array.isArray(item.skills)
        ? item.skills.map((s) => (typeof s === 'string' ? s : s?.name)).filter(Boolean)
        : [];
    const participants = normalizeProjectParticipants(item);
    const firstParticipant = participants[0] || null;

    return {
        id,
        title: title || 'Проект',
        summary,
        body,
        section,
        skills,
        images: extractProjectImages(item),
        participants,
        studentId: firstParticipant?.id || null,
        studentName: firstParticipant?.name || '',
        source,
    };
};

const mapProjectRows = (raw, source) =>
    extractPageRows(raw)
        .map((item) => normalizeProjectCard(item, source))
        .filter((item) => item && item.id != null);

/**
 * GET /public/projects (аноним) или GET /projects (авторизованный).
 */
export const listStudentProjectCards = async (q = '') => {
    const query = q.trim() || undefined;

    if (isAuthenticated()) {
        try {
            const raw = await listAuthProjects(query);
            const rows = mapProjectRows(raw, 'auth');
            if (rows.length > 0) return rows;
        } catch (err) {
            if (err?.status !== 401 && err?.status !== 403) throw err;
        }
    }

    const raw = await listPublicProjects(query);
    return mapProjectRows(raw, 'public');
};

/** GET /projects/{id} или GET /public/projects/{id}. */
export const getStudentProject = async (id, source = 'auth') => {
    try {
        if (source === 'auth' && isAuthenticated()) {
            const data = await getAuthProject(id);
            return normalizeProjectCard(data, 'auth') || data;
        }
        const data = await getPublicProject(id);
        return normalizeProjectCard(data, 'public') || data;
    } catch (err) {
        if (isAuthenticated() && source !== 'public') {
            const data = await getPublicProject(id);
            return normalizeProjectCard(data, 'public') || data;
        }
        throw err;
    }
};
