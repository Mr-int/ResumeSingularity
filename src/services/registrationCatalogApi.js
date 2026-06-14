import { apiClientJson } from '../utils/apiClient.js';
import { buildPageQuery, normalizePageResponse } from '../utils/pageable.js';

const fetchPaged = async (endpoint, page = 0, size = 20) => {
    const { query } = buildPageQuery({ page, size });
    const resp = await apiClientJson(`${endpoint}?${query}`, { method: 'GET' });
    return normalizePageResponse(resp, page, size);
};

/** GET /public/registration/specialities */
export const listRegistrationSpecialities = (page = 0, size = 20) =>
    fetchPaged('public/registration/specialities', page, size);

/** GET /public/registration/skills */
export const listRegistrationSkills = (page = 0, size = 20) =>
    fetchPaged('public/registration/skills', page, size);

/** Все навыки из справочника регистрации (для выбора по имени). */
export const fetchAllRegistrationSkills = async () => {
    const pageSize = 200;
    const maxPages = 50;
    const byId = new Map();

    for (let page = 0; page < maxPages; page += 1) {
        const res = await listRegistrationSkills(page, pageSize);
        const items = Array.isArray(res?.data) ? res.data : [];
        for (const skill of items) {
            if (skill?.id != null) {
                byId.set(Number(skill.id), skill);
            }
        }
        const totalPages = typeof res?.totalPages === 'number' ? res.totalPages : 1;
        if (page + 1 >= totalPages || items.length === 0) {
            break;
        }
    }

    return Array.from(byId.values()).sort((a, b) =>
        String(a.name || a.title || '').localeCompare(String(b.name || b.title || ''), 'ru'),
    );
};

/** GET /public/registration/educations */
export const listRegistrationEducations = (page = 0, size = 20) =>
    fetchPaged('public/registration/educations', page, size);

/** GET /public/registration/companies */
export const listRegistrationCompanies = (page = 0, size = 20) =>
    fetchPaged('public/registration/companies', page, size);
