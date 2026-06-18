import { apiClientJson } from '../utils/apiClient.js';
import { buildPageQuery, normalizePageResponse } from '../utils/pageable.js';
import { getAllSkills, getAllSpecialities } from './studentApi.js';

/** Размер страницы публичного справочника (ограничен конфигом бэкенда). */
const REGISTRATION_PAGE_SIZE = 20;
const CATALOG_FETCH_TIMEOUT_MS = 12_000;

const catalogCache = {
    skills: null,
    specialities: null,
};
const catalogInflight = {
    skills: null,
    specialities: null,
};

export const invalidateRegistrationCatalogCache = () => {
    catalogCache.skills = null;
    catalogCache.specialities = null;
};

const fetchPaged = async (endpoint, page = 0, size = REGISTRATION_PAGE_SIZE) => {
    const { query } = buildPageQuery({ page, size });
    const resp = await apiClientJson(`${endpoint}?${query}`, {
        method: 'GET',
        credentials: 'omit',
        timeoutMs: CATALOG_FETCH_TIMEOUT_MS,
        quiet: true,
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

const loadCatalog = async (key, listFn, sortFn, { force = false } = {}) => {
    if (!force && catalogCache[key]) {
        return catalogCache[key];
    }
    if (!force && catalogInflight[key]) {
        return catalogInflight[key];
    }

    const task = (async () => {
        const items = await fetchAllPaged(listFn);
        const sorted = sortFn(items);
        catalogCache[key] = sorted;
        return sorted;
    })();

    catalogInflight[key] = task;
    try {
        return await task;
    } finally {
        if (catalogInflight[key] === task) {
            catalogInflight[key] = null;
        }
    }
};

/** GET /public/registration/specialities */
export const listRegistrationSpecialities = (page = 0, size = 20) =>
    fetchPaged('public/registration/specialities', page, size);

/** Все специальности из справочника регистрации (для выбора по имени). */
export const fetchAllRegistrationSpecialities = (options = {}) =>
    loadCatalog(
        'specialities',
        listRegistrationSpecialities,
        (items) =>
            items.sort((a, b) =>
                String(a.name || a.specialityName || a.title || '').localeCompare(
                    String(b.name || b.specialityName || b.title || ''),
                    'ru',
                ),
            ),
        options,
    );

/** GET /public/registration/skills */
export const listRegistrationSkills = (page = 0, size = 20) =>
    fetchPaged('public/registration/skills', page, size);

/** Все навыки из справочника регистрации (для выбора по имени). */
export const fetchAllRegistrationSkills = (options = {}) =>
    loadCatalog(
        'skills',
        listRegistrationSkills,
        (items) =>
            items.sort((a, b) =>
                String(a.name || a.title || '').localeCompare(String(b.name || b.title || ''), 'ru'),
            ),
        options,
    );

/** GET /public/registration/educations */
export const listRegistrationEducations = (page = 0, size = 20) =>
    fetchPaged('public/registration/educations', page, size);

/** GET /public/registration/companies */
export const listRegistrationCompanies = (page = 0, size = 20) =>
    fetchPaged('public/registration/companies', page, size);

const sortSpecialities = (items) =>
    items.sort((a, b) =>
        String(a.name || a.specialityName || a.title || '').localeCompare(
            String(b.name || b.specialityName || b.title || ''),
            'ru',
        ),
    );

const sortSkills = (items) =>
    items.sort((a, b) =>
        String(a.name || a.title || '').localeCompare(String(b.name || b.title || ''), 'ru'),
    );

/**
 * Справочник специальностей для резюме: основной API (FK бэкенда), затем публичный регистрационный.
 */
export const fetchResumeSpecialities = async (options = {}) => {
    try {
        const main = await getAllSpecialities();
        if (main.length) return sortSpecialities([...main]);
    } catch {
        /* fallback */
    }
    try {
        const reg = await fetchAllRegistrationSpecialities(options);
        if (reg.length) return reg;
    } catch {
        /* ignore */
    }
    return [];
};

/**
 * Справочник навыков для резюме: основной API (FK бэкенда), затем публичный регистрационный.
 */
export const fetchResumeSkills = async (options = {}) => {
    try {
        const main = await getAllSkills();
        if (main.length) return sortSkills([...main]);
    } catch {
        /* fallback */
    }
    try {
        const reg = await fetchAllRegistrationSkills(options);
        if (reg.length) return reg;
    } catch {
        /* ignore */
    }
    return [];
};
