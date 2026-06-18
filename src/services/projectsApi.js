import { getImageUrl } from '../config/api.js';
import { extractPageRows } from '../utils/pageable.js';
import { listAuthProjects, getAuthProject } from './catalogApi.js';
import { listPublicProjects, getPublicProject } from './publicApi.js';
import { getStudentById } from './studentApi.js';
import { hasApprovedCatalogAccess, isAuthenticated } from './authApi.js';

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

const participantFromStudent = (student) => {
    if (!student || student.id == null) return null;
    const firstName = student.firstName || '';
    const lastName = student.lastName || '';
    return {
        id: String(student.id),
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim() || 'Студент',
        speciality: student.speciality || student.profession || '',
        course: student.course || '',
        imageUrl: student.imagePath ? getImageUrl(student.imagePath) : null,
    };
};

const participantFromRef = (ref) => {
    if (ref == null) return null;
    if (typeof ref === 'number' || typeof ref === 'string') {
        const id = String(ref).trim();
        if (!id) return null;
        return { id, firstName: '', lastName: '', name: '' };
    }
    const id = ref.id ?? ref.studentId;
    if (id == null) return null;
    const firstName = ref.firstName || '';
    const lastName = ref.lastName || '';
    const name = `${firstName} ${lastName}`.trim();
    return {
        id: String(id),
        firstName,
        lastName,
        name: name || ref.name || '',
        speciality: ref.speciality || ref.profession || '',
        course: ref.course || '',
        imageUrl: ref.imagePath ? getImageUrl(ref.imagePath) : (ref.imageUrl || null),
    };
};

const collectStudentRefs = (item) => {
    const refs = [];
    if (Array.isArray(item?.students)) refs.push(...item.students);
    if (Array.isArray(item?.studentCards)) refs.push(...item.studentCards);
    if (Array.isArray(item?.participants)) refs.push(...item.participants);
    if (Array.isArray(item?.studentIds)) refs.push(...item.studentIds);
    if (item?.student) refs.push(item.student);
    if (item?.studentId != null && !refs.length) refs.push({ id: item.studentId });
    return refs;
};

const normalizeProjectParticipants = (item) => {
    const seen = new Set();
    return collectStudentRefs(item)
        .map(participantFromRef)
        .filter((participant) => {
            if (!participant?.id || seen.has(participant.id)) return false;
            seen.add(participant.id);
            return true;
        });
};

const participantsNeedLookup = (participants = []) =>
    participants.length === 0
    || participants.some((participant) => !String(participant.name || '').trim());

const resolveParticipantNames = async (participants = []) =>
    Promise.all(
        participants.map(async (participant) => {
            const name = String(participant.name || '').trim();
            if (name && name !== 'Студент') return participant;
            try {
                const student = await getStudentById(participant.id);
                return participantFromStudent(student) || participant;
            } catch {
                return {
                    ...participant,
                    name: name || 'Студент',
                };
            }
        }),
    );

const withParticipantMeta = (project, participants) => {
    const firstParticipant = participants[0] || null;
    return {
        ...project,
        participants,
        studentId: firstParticipant?.id || project.studentId || null,
        studentName: firstParticipant?.name || project.studentName || '',
    };
};

/** Для одобренных пользователей подтягиваем участников из детальной карточки и каталога студентов. */
export const enrichProjectCardsParticipants = async (projects = []) =>
    Promise.all(
        projects.map(async (project) => {
            if (project.source !== 'auth' || !hasApprovedCatalogAccess()) {
                return project;
            }

            let participants = project.participants || [];

            if (participantsNeedLookup(participants)) {
                try {
                    const detail = normalizeProjectCard(await getAuthProject(project.id), 'auth');
                    if (detail?.participants?.length) {
                        participants = detail.participants;
                    }
                } catch {
                    /* оставляем список как есть */
                }
            }

            if (participantsNeedLookup(participants)) {
                participants = await resolveParticipantNames(participants);
            }

            return withParticipantMeta(project, participants);
        }),
    );

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
 * GET /public/projects (аноним) или GET /projects (авторизованный каталог).
 * Одобренные пользователи (в т.ч. студенты) всегда идут через /projects с участниками.
 */
export const listStudentProjectCards = async (q = '') => {
    const query = q.trim() || undefined;
    const approved = hasApprovedCatalogAccess();

    if (approved) {
        const raw = await listAuthProjects(query);
        const rows = mapProjectRows(raw, 'auth');
        return enrichProjectCardsParticipants(rows);
    }

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
    const approved = hasApprovedCatalogAccess();

    try {
        if (approved || (source === 'auth' && isAuthenticated())) {
            const data = await getAuthProject(id);
            const card = normalizeProjectCard(data, 'auth') || data;
            if (approved && card?.id != null) {
                const [enriched] = await enrichProjectCardsParticipants([card]);
                return enriched || card;
            }
            return card;
        }
        const data = await getPublicProject(id);
        return normalizeProjectCard(data, 'public') || data;
    } catch (err) {
        if (!approved && isAuthenticated() && source !== 'public') {
            const data = await getPublicProject(id);
            return normalizeProjectCard(data, 'public') || data;
        }
        throw err;
    }
};
