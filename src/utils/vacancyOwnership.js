import { apiClientJson } from '../utils/apiClient.js';
import { getRecruiterMe } from '../services/getApi.js';
import { getVacancyById } from '../services/catalogApi.js';

const fetchMyVacancies = () => apiClientJson('vacancies/mine', { method: 'GET' });

export const extractVacancyRecruiterId = (vacancy) => {
    if (!vacancy || typeof vacancy !== 'object') return null;
    const raw =
        vacancy.recruiterId
        ?? vacancy.ownerRecruiterId
        ?? vacancy.createdByRecruiterId
        ?? vacancy.authorId;
    if (raw == null || raw === '') return null;
    return String(raw);
};

const readMineFlag = (vacancy) => {
    if (!vacancy || typeof vacancy !== 'object') return null;
    if (vacancy.isMine === true || vacancy.mine === true || vacancy.owned === true) return true;
    if (vacancy.isMine === false || vacancy.mine === false || vacancy.owned === false) return false;
    return null;
};

export const isVacancyOwnedByRecruiter = (vacancy, recruiterId) => {
    if (!vacancy || recruiterId == null) return false;
    const mineFlag = readMineFlag(vacancy);
    if (mineFlag === true) return true;
    if (mineFlag === false) return false;
    const ownerId = extractVacancyRecruiterId(vacancy);
    if (ownerId != null) {
        return ownerId === String(recruiterId);
    }
    return false;
};

let myVacancyIdsCache = { ids: null, at: 0 };
const MINE_CACHE_MS = 30_000;

export const invalidateMyVacancyIdsCache = () => {
    myVacancyIdsCache = { ids: null, at: 0 };
};

export const isVacancyInMyList = async (vacancyId, { force = false } = {}) => {
    const now = Date.now();
    if (!force && myVacancyIdsCache.ids && now - myVacancyIdsCache.at < MINE_CACHE_MS) {
        return myVacancyIdsCache.ids.has(String(vacancyId));
    }
    const data = await fetchMyVacancies();
    const rows = Array.isArray(data) ? data : [];
    const ids = new Set(rows.map((v) => String(v.id)));
    myVacancyIdsCache = { ids, at: now };
    return ids.has(String(vacancyId));
};

export const resolveMyRecruiterId = async () => {
    const profile = await getRecruiterMe();
    return profile?.id ?? null;
};

/**
 * Проверяет, что вакансия принадлежит текущему рекрутёру.
 * @throws {Error} status 403 при отказе
 */
export const assertVacancyOwnership = async (vacancyOrId, options = {}) => {
    const vacancy =
        typeof vacancyOrId === 'object' && vacancyOrId != null
            ? vacancyOrId
            : await getVacancyById(vacancyOrId);
    const vacancyId = vacancy?.id ?? vacancyOrId;

    const recruiterId = await resolveMyRecruiterId();
    if (!recruiterId) {
        const err = new Error('Только работодатель может управлять вакансиями');
        err.status = 403;
        throw err;
    }

    if (isVacancyOwnedByRecruiter(vacancy, recruiterId)) {
        return { vacancy, recruiterId };
    }

    if (await isVacancyInMyList(vacancyId, { force: options.forceMineList })) {
        return { vacancy, recruiterId };
    }

    const err = new Error('Вы можете редактировать только свои вакансии');
    err.status = 403;
    throw err;
};

export const checkVacancyOwnership = async (vacancyOrId) => {
    try {
        await assertVacancyOwnership(vacancyOrId);
        return true;
    } catch (e) {
        if (e.status === 403) return false;
        throw e;
    }
};
