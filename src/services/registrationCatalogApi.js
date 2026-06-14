import { apiClientJson } from '../utils/apiClient.js';
import { buildPageQuery, normalizePageResponse } from '../utils/pageable.js';

/** Размер страницы публичного справочника (ограничен конфигом бэкенда). */
const REGISTRATION_PAGE_SIZE = 20;

const fetchPaged = async (endpoint, page = 0, size = REGISTRATION_PAGE_SIZE) => {
    const { query } = buildPageQuery({ page, size });
    const resp = await apiClientJson(`${endpoint}?${query}`, {
        method: 'GET',
        credentials: 'omit',
    });
    return normalizePageResponse(resp, page, size);
};

const fetchAllPaged = async (listFn) => {
    const pageSize = REGISTRATION_PAGE_SIZE;
    const maxPages = 100;
    const byId = new Map();

    for (let page = 0; page < maxPages; page += 1) {
        try {
            const res = await listFn(page, pageSize);
            const items = Array.isArray(res?.data) ? res.data : [];
            for (const item of items) {
                if (item?.id != null) {
                    byId.set(Number(item.id), item);
                }
            }
            const totalPages = typeof res?.totalPages === 'number' ? res.totalPages : 1;
            if (page + 1 >= totalPages || items.length === 0) {
                break;
            }
        } catch (e) {
            if (page === 0) throw e;
            break;
        }
    }

    return Array.from(byId.values());
};

/** GET /public/registration/specialities */
export const listRegistrationSpecialities = (page = 0, size = 20) =>
    fetchPaged('public/registration/specialities', page, size);

/** Все специальности из справочника регистрации (для выбора по имени). */
export const fetchAllRegistrationSpecialities = async () => {
    const items = await fetchAllPaged(listRegistrationSpecialities);
    return items.sort((a, b) =>
        String(a.name || a.specialityName || a.title || '').localeCompare(
            String(b.name || b.specialityName || b.title || ''),
            'ru',
        ),
    );
};

/** GET /public/registration/skills */
export const listRegistrationSkills = (page = 0, size = 20) =>
    fetchPaged('public/registration/skills', page, size);

/** Все навыки из справочника регистрации (для выбора по имени). */
export const fetchAllRegistrationSkills = async () => {
    const items = await fetchAllPaged(listRegistrationSkills);
    return items.sort((a, b) =>
        String(a.name || a.title || '').localeCompare(String(b.name || b.title || ''), 'ru'),
    );
};

/** GET /public/registration/educations */
export const listRegistrationEducations = (page = 0, size = 20) =>
    fetchPaged('public/registration/educations', page, size);

/** GET /public/registration/companies */
export const listRegistrationCompanies = (page = 0, size = 20) =>
    fetchPaged('public/registration/companies', page, size);
