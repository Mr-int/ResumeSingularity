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

/** GET /public/registration/educations */
export const listRegistrationEducations = (page = 0, size = 20) =>
    fetchPaged('public/registration/educations', page, size);

/** GET /public/registration/companies */
export const listRegistrationCompanies = (page = 0, size = 20) =>
    fetchPaged('public/registration/companies', page, size);
