import { API_BASE_URL } from '../config/api.js';

const pageQuery = (page, size) => {
    const p = new URLSearchParams();
    p.set('page', String(page));
    p.set('size', String(size));
    return p.toString();
};

const fetchCatalog = async (path, page = 0, size = 50) => {
    const response = await fetch(`${API_BASE_URL}public/registration/${path}?${pageQuery(page, size)}`);
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Ошибка ${response.status}`);
    }
    return response.json();
};

export const getRegistrationSpecialities = (page = 0, size = 50) =>
    fetchCatalog('specialities', page, size);

export const getRegistrationSkills = (page = 0, size = 50) =>
    fetchCatalog('skills', page, size);

export const getRegistrationCompanies = (page = 0, size = 50) =>
    fetchCatalog('companies', page, size);

export const getRegistrationEducations = (page = 0, size = 50) =>
    fetchCatalog('educations', page, size);

export const catalogRows = (res) => {
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.content)) return res.content;
    return [];
};

/** Загружает все страницы справочника (лимит страницы задаётся на бэкенде). */
export async function loadAllRegistrationCatalog(fetchPage, pageSize = 50) {
    const rows = [];
    let page = 0;
    let totalPages = 1;
    while (page < totalPages) {
        const res = await fetchPage(page, pageSize);
        rows.push(...catalogRows(res));
        totalPages = typeof res?.totalPages === 'number' ? res.totalPages : page + 1;
        page += 1;
    }
    return rows;
}

export const loadAllRegistrationSkills = (pageSize = 50) =>
    loadAllRegistrationCatalog(getRegistrationSkills, pageSize);

export const loadAllRegistrationSpecialities = (pageSize = 50) =>
    loadAllRegistrationCatalog(getRegistrationSpecialities, pageSize);
