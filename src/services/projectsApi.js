import { getImageUrl } from '../config/api.js';
import { extractPageRows } from '../utils/pageable.js';
import { listAuthProjects, getAuthProject } from './catalogApi.js';
import { listPublicProjects, getPublicProject } from './publicApi.js';
import { filterStudentCardsPage, getStudentById } from './studentApi.js';
import {
    getAccountStatus,
    hasApprovedCatalogAccess,
    isAccountApproved,
    isAuthenticated,
    isStudentRole,
    syncAuthSession,
} from './authApi.js';

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
    const combined = `${firstName} ${lastName}`.trim();
    const name = combined || student.fullName || student.displayName || student.name || '';
    return {
        id: String(student.id),
        firstName,
        lastName,
        name: name || 'Студент',
        speciality:
            student.speciality
            || student.profession
            || student.specialityName
            || '',
        course: student.course || '',
        imageUrl: student.imagePath ? getImageUrl(student.imagePath) : (student.imageUrl || null),
    };
};

const participantFromRef = (ref) => {
    if (ref == null) return null;
    if (typeof ref === 'number' || typeof ref === 'string') {
        const id = String(ref).trim();
        if (!id) return null;
        return { id, firstName: '', lastName: '', name: '' };
    }
    if (ref.student && typeof ref.student === 'object') {
        return participantFromRef(ref.student);
    }
    const id = ref.id ?? ref.studentId;
    if (id == null) return null;
    const firstName = ref.firstName || '';
    const lastName = ref.lastName || '';
    const combined = `${firstName} ${lastName}`.trim();
    const name = combined || ref.fullName || ref.displayName || ref.name || '';
    return {
        id: String(id),
        firstName,
        lastName,
        name,
        speciality: ref.speciality || ref.profession || ref.specialityName || '',
        course: ref.course || '',
        imageUrl: ref.imagePath ? getImageUrl(ref.imagePath) : (ref.imageUrl || null),
    };
};

const collectStudentRefs = (item) => {
    const refs = [];
    if (Array.isArray(item?.students)) {
        for (const entry of item.students) {
            if (entry?.student) refs.push(entry.student);
            else refs.push(entry);
        }
    }
    if (Array.isArray(item?.studentCards)) refs.push(...item.studentCards);
    if (Array.isArray(item?.participants)) refs.push(...item.participants);
    if (Array.isArray(item?.studentIds)) refs.push(...item.studentIds);
    if (Array.isArray(item?.linkedStudents)) refs.push(...item.linkedStudents);
    if (Array.isArray(item?.authors)) refs.push(...item.authors);
    if (Array.isArray(item?.members)) refs.push(...item.members);
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

const canLoadAuthProjectParticipants = () => {
    if (!isAuthenticated()) return false;
    if (hasApprovedCatalogAccess()) return true;
    return isStudentRole() && isAccountApproved(getAccountStatus());
};

const buildStudentCatalogMap = async () => {
    const map = new Map();
    if (!canLoadAuthProjectParticipants()) return map;

    try {
        const pageSize = 200;
        const first = await filterStudentCardsPage({}, { page: 0, size: pageSize });
        const totalPages = typeof first.totalPages === 'number' ? first.totalPages : 1;

        for (const student of first.data || []) {
            if (student?.id != null) map.set(String(student.id), student);
        }

        for (let page = 1; page < totalPages; page += 1) {
            const res = await filterStudentCardsPage({}, { page, size: pageSize });
            for (const student of res.data || []) {
                if (student?.id != null) map.set(String(student.id), student);
            }
        }
    } catch {
        /* каталог опционален для обогащения */
    }

    return map;
};

const applyCatalogToParticipants = (participants = [], catalogMap = new Map()) =>
    participants.map((participant) => {
        const fromCatalog = catalogMap.get(String(participant.id));
        if (fromCatalog) return participantFromStudent(fromCatalog) || participant;
        const name = String(participant.name || '').trim();
        if (name && name !== 'Студент') return participant;
        return participant;
    });

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
export const enrichProjectCardsParticipants = async (projects = []) => {
    if (!canLoadAuthProjectParticipants()) return projects;

    const catalogMap = await buildStudentCatalogMap();

    return Promise.all(
        projects.map(async (project) => {
            let participants = project.participants || [];

            try {
                const detail = normalizeProjectCard(await getAuthProject(project.id), 'auth');
                if (detail?.participants?.length) {
                    participants = detail.participants;
                }
            } catch {
                /* оставляем участников из списка */
            }

            participants = applyCatalogToParticipants(participants, catalogMap);

            if (participantsNeedLookup(participants)) {
                participants = await resolveParticipantNames(participants);
            }

            return withParticipantMeta(project, participants);
        }),
    );
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
 * GET /public/projects (аноним) или GET /projects (авторизованный каталог).
 * Одобренные студенты всегда получают участников через /projects + каталог.
 */
export const listStudentProjectCards = async (q = '') => {
    const query = q.trim() || undefined;

    try {
        await syncAuthSession();
    } catch {
        /* продолжаем с локальной сессией */
    }

    const useAuthCatalog = canLoadAuthProjectParticipants();

    if (useAuthCatalog) {
        const raw = await listAuthProjects(query);
        const rows = mapProjectRows(raw, 'auth');
        return enrichProjectCardsParticipants(rows);
    }

    if (isAuthenticated()) {
        try {
            const raw = await listAuthProjects(query);
            const rows = mapProjectRows(raw, 'auth');
            if (rows.length > 0) {
                return enrichProjectCardsParticipants(rows);
            }
        } catch (err) {
            if (isStudentRole()) throw err;
            if (err?.status !== 401 && err?.status !== 403) throw err;
        }
    }

    if (isStudentRole() && isAuthenticated()) {
        const err = new Error('Каталог проектов доступен после одобрения аккаунта');
        err.status = 403;
        throw err;
    }

    const raw = await listPublicProjects(query);
    return mapProjectRows(raw, 'public');
};

/** GET /projects/{id} или GET /public/projects/{id}. */
export const getStudentProject = async (id, source = 'auth') => {
    try {
        await syncAuthSession();
    } catch {
        /* ignore */
    }

    const useAuthCatalog = canLoadAuthProjectParticipants();

    try {
        if (useAuthCatalog || (source === 'auth' && isAuthenticated())) {
            const data = await getAuthProject(id);
            const card = normalizeProjectCard(data, 'auth') || data;
            if (useAuthCatalog && card?.id != null) {
                const [enriched] = await enrichProjectCardsParticipants([card]);
                return enriched || card;
            }
            return card;
        }
        const data = await getPublicProject(id);
        return normalizeProjectCard(data, 'public') || data;
    } catch (err) {
        if (!useAuthCatalog && isAuthenticated() && source !== 'public') {
            const data = await getPublicProject(id);
            return normalizeProjectCard(data, 'public') || data;
        }
        throw err;
    }
};
