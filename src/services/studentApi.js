import { apiClientJson } from '../utils/apiClient.js';
import { getCompanyById } from './getApi.js';

const withPageQuery = (endpoint, pageable = { page: 0, size: 100 }) => {
    const page = typeof pageable.page === 'number' ? pageable.page : 0;
    const size = typeof pageable.size === 'number' ? pageable.size : 100;
    return `${endpoint}?page=${page}&size=${size}`;
};

const pageItems = (resp) => {
    if (Array.isArray(resp?.data)) return resp.data;
    if (Array.isArray(resp?.content)) return resp.content;
    if (Array.isArray(resp)) return resp;
    return [];
};

export const getAllStudents = async () => {
    try {
        const pageSize = 200;
        const maxPages = 200;
        const byId = new Map();

        const first = await filterStudentCardsPage({}, { page: 0, size: pageSize });
        const totalPages = typeof first.totalPages === 'number' ? first.totalPages : 0;
        const pagesToFetch = Math.min(totalPages, maxPages);

        for (const s of first.data) {
            const key = s?.id != null ? String(s.id) : JSON.stringify(s);
            if (!byId.has(key)) byId.set(key, s);
        }

        for (let page = 1; page < pagesToFetch; page += 1) {
            const res = await filterStudentCardsPage({}, { page, size: pageSize });
            for (const s of res.data) {
                const key = s?.id != null ? String(s.id) : JSON.stringify(s);
                if (!byId.has(key)) byId.set(key, s);
            }
        }

        return Array.from(byId.values());
    } catch (error) {
        if (error.requiresAuth) {
            throw error;
        }
        throw error;
    }
};

export const getStudentById = async (id) => {
    try {
        const data = await apiClientJson(`student/${id}`, {
            method: 'GET',
        });
        return data;
    } catch (error) {
        if (error.requiresAuth) {
            throw error;
        }
        throw error;
    }
};

export const getPortfolioByStudentId = async (studentId) => {
    try {
        const data = await apiClientJson(withPageQuery('portfolio/filter'), {
            method: 'POST',
            body: JSON.stringify({ studentId }),
        });
        return pageItems(data);
    } catch (error) {
        return [];
    }
};

export const getInstitutionById = async (id) => {
    try {
        const data = await apiClientJson(`institution/${id}`, {
            method: 'GET',
        });
        return data;
    } catch (error) {
        throw error;
    }
};

export const getInstitutionsByStudentId = async (studentId) => {
    try {
        const data = await apiClientJson(withPageQuery('institution/filter'), {
            method: 'POST',
            body: JSON.stringify({ studentId }),
        });
        return pageItems(data);
    } catch (error) {
        return [];
    }
};

export const getExperienceById = async (id) => {
    try {
        const data = await apiClientJson(`experience/${id}`, {
            method: 'GET',
        });
        return data;
    } catch (error) {
        throw error;
    }
};

export const getExperienceByStudentId = async (studentId) => {
    try {
        const data = await apiClientJson(withPageQuery('experience/filter'), {
            method: 'POST',
            body: JSON.stringify({ studentId }),
        });
        return pageItems(data);
    } catch (error) {
        return [];
    }
};

const resolveCompanyNames = async (experienceList) => {
    const companyIds = [
        ...new Set(
            experienceList
                .map((item) => item?.companyId)
                .filter((id) => id != null && id !== 0)
        ),
    ];

    const companyNameById = new Map();

    await Promise.all(
        companyIds.map(async (companyId) => {
            try {
                const company = await getCompanyById(companyId);
                companyNameById.set(companyId, (company?.name || '').toString().trim());
            } catch {
                companyNameById.set(companyId, '');
            }
        })
    );

    return companyNameById;
};

export const getExperienceDetailsByStudentId = async (studentId) => {
    try {
        const experienceList = await getExperienceByStudentId(studentId);
        if (!Array.isArray(experienceList) || experienceList.length === 0) {
            return [];
        }

        const companyNameById = await resolveCompanyNames(experienceList);

        return experienceList
            .map((item, index) => {
                if (!item || typeof item !== 'object') {
                    return null;
                }

                const experience = item.experience || {};
                const companyId = item.companyId;
                const endDateRaw = experience.endDate ?? item.endDate ?? '';
                const endDate = endDateRaw
                    ? String(endDateRaw)
                    : (experience.current || item.current ? 'по настоящее время' : '');
                const companyFromMap = companyId != null && companyId !== 0
                    ? (companyNameById.get(companyId) || '')
                    : '';

                return {
                    id: experience.id || item.experienceId || `exp-${index}`,
                    companyId,
                    position: (experience.position || item.position || '').toString().trim(),
                    company: companyFromMap,
                    description: (experience.additionalInfo || item.additionalInfo || '').toString().trim(),
                    startDate: experience.startDate || item.startDate || '',
                    endDate,
                    current: Boolean(experience.current || item.current || !endDateRaw),
                };
            })
            .filter((item) => item !== null);
    } catch {
        return [];
    }
};

const toPageResponse = (resp, pageable) => {
    const page = typeof pageable?.page === 'number' ? pageable.page : 0;
    const size = typeof pageable?.size === 'number' ? pageable.size : 100;
    return {
        data: pageItems(resp),
        page: typeof resp?.page === 'number' ? resp.page : page,
        size: typeof resp?.size === 'number' ? resp.size : size,
        totalElements: typeof resp?.totalElements === 'number' ? resp.totalElements : 0,
        totalPages: typeof resp?.totalPages === 'number' ? resp.totalPages : 0,
    };
};

/** POST /education/filter — справочник вузов. Тело FilterEducationReq, pageable в query. */
export const filterEducation = async (filterReq = {}, pageable = { page: 0, size: 100 }) => {
    const resp = await apiClientJson(withPageQuery('education/filter', pageable), {
        method: 'POST',
        body: JSON.stringify(filterReq),
    });
    return toPageResponse(resp, pageable);
};

export const getAllEducation = async () => {
    const pageRes = await filterEducation({}, { page: 0, size: 1000 });
    return pageRes.data;
};

export const createEducation = (body) =>
    apiClientJson('education', {
        method: 'POST',
        body: JSON.stringify(body),
        skipSessionClearOn403: true,
    });

const pickEducationId = (items, name) => {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed || !Array.isArray(items)) return null;
    const exact = items.find(
        (item) => (item?.institution || '').trim().toLowerCase() === trimmed,
    );
    if (exact?.id != null) {
        const id = Number(exact.id);
        return Number.isFinite(id) && id > 0 ? id : null;
    }
    const partial = items.find((item) => {
        const label = (item?.institution || '').trim().toLowerCase();
        return label.includes(trimmed) || trimmed.includes(label);
    });
    if (partial?.id != null) {
        const id = Number(partial.id);
        return Number.isFinite(id) && id > 0 ? id : null;
    }
    return null;
};

/** Найти id образовательной организации в справочнике. */
export const findEducationIdByName = async (name) => {
    const trimmed = name?.trim();
    if (!trimmed) return null;
    try {
        const pageRes = await filterEducation({ institution: trimmed }, { page: 0, size: 50 });
        const items = Array.isArray(pageRes?.data) ? pageRes.data : [];
        return pickEducationId(items, trimmed);
    } catch {
        return null;
    }
};

/**
 * Нужен educationId > 0 (иначе бэкенд ищет id 0 → NOT_FOUND).
 * Справочник education студенту создавать нельзя (403).
 */
export const resolveEducationId = async (institutionName, existingId, localCatalog = []) => {
    const fromEntry = Number(existingId);
    if (Number.isFinite(fromEntry) && fromEntry > 0) return fromEntry;

    const trimmed = institutionName?.trim() || '';
    if (!trimmed) {
        const err = new Error('Укажите образовательную организацию');
        err.status = 400;
        throw err;
    }

    const fromLocal = pickEducationId(localCatalog, trimmed);
    if (fromLocal) return fromLocal;

    const found = await findEducationIdByName(trimmed);
    if (found) return found;

    try {
        const created = await createEducation({
            institution: trimmed,
            additionalInfo: 'Добавлено студентом',
            webUrl: 'https://',
        });
        const id = Number(created?.id);
        if (Number.isFinite(id) && id > 0) return id;
    } catch (e) {
        if (e?.status === 403) {
            const err = new Error(
                'Организация не найдена в справочнике. Выберите её из подсказок или попросите администратора добавить.',
            );
            err.status = 403;
            throw err;
        }
        throw e;
    }

    const err = new Error(
        'Не удалось определить организацию. Выберите её из списка.',
    );
    err.status = 400;
    throw err;
};

export const getEducationById = async (id) => {
    try {
        const data = await apiClientJson(`education/${id}`, {
            method: 'GET',
        });
        return data;
    } catch (error) {
        throw error;
    }
};

export const getEducationDetailsByStudentId = async (studentId) => {
    try {
        const educationList = await apiClientJson(withPageQuery('institution/filter'), {
            method: 'POST',
            body: JSON.stringify({ studentId }),
        });

        let educationArray = [];
        if (educationList && educationList.data && Array.isArray(educationList.data)) {
            educationArray = educationList.data;
        } else if (Array.isArray(educationList)) {
            educationArray = educationList;
        }

        const educationDetails = await Promise.all(
            educationArray.map(async (edu) => {
                try {
                    if (edu.educationId) {
                        const details = await getEducationById(edu.educationId);
                        return {
                            ...details,
                            id: edu.educationId,
                            institutionId: edu.institution?.id,
                            startYear: edu.institution?.startYear,
                            endYear: edu.institution?.endYear
                        };
                    }
                    return null;
                } catch (err) {
                    return null;
                }
            })
        );

        return educationDetails.filter(item => item !== null);
    } catch (error) {
        return [];
    }
};

export const getEducationByStudentId = async (studentId) => {
    try {
        const data = await apiClientJson(withPageQuery('institution/filter'), {
            method: 'POST',
            body: JSON.stringify({ studentId }),
        });
        return pageItems(data);
    } catch (error) {
        return [];
    }
};

export const getAllExperience = async () => {
    try {
        const data = await apiClientJson(withPageQuery('experience/filter', { page: 0, size: 1000 }), {
            method: 'POST',
            body: JSON.stringify({}),
        });
        return pageItems(data);
    } catch (error) {
        throw error;
    }
};

export const getSkillById = async (id) => {
    try {
        const data = await apiClientJson(`skill/${id}`, {
            method: 'GET',
        });
        return data;
    } catch (error) {
        throw error;
    }
};

export const getSkillsByStudentId = async (studentId) => {
    try {
        const data = await apiClientJson(`student/${studentId}`, { method: 'GET' });
        return Array.isArray(data?.skills) ? data.skills : [];
    } catch (error) {
        return [];
    }
};

export const sendStudentRequest = async (requestData) => {
    try {
        const data = await apiClientJson('request', {
            method: 'POST',
            body: JSON.stringify(requestData)
        });
        return data;
    } catch (error) {
        throw error;
    }
};

export const createRecruiterRequest = async (recruiterData) => {
    try {
        const data = await apiClientJson('recruiter', {
            method: 'POST',
            body: JSON.stringify(recruiterData)
        });
        return data;
    } catch (error) {
        throw error;
    }
};

/**
 * POST /student/filter
 * В API pageable обязателен в query: ?page=0&size=200
 * Ответ: PageResponseStudentDTO { data, page, size, totalElements, totalPages }
 */
export const filterStudentsPage = async (filterReq = {}, pageable = { page: 0, size: 100 }) => {
    try {
        const page = typeof pageable.page === 'number' ? pageable.page : 0;
        const size = typeof pageable.size === 'number' ? pageable.size : 100;

        const resp = await apiClientJson(`student/filter?page=${page}&size=${size}`, {
            method: 'POST',
            body: JSON.stringify(filterReq)
        });

        return {
            data: Array.isArray(resp?.data) ? resp.data : [],
            page: typeof resp?.page === 'number' ? resp.page : page,
            size: typeof resp?.size === 'number' ? resp.size : size,
            totalElements: typeof resp?.totalElements === 'number' ? resp.totalElements : 0,
            totalPages: typeof resp?.totalPages === 'number' ? resp.totalPages : 0,
        };
    } catch (error) {
        if (error.requiresAuth) {
            throw error;
        }
        throw error;
    }
};

/**
 * Back-compat: раньше filterStudents() возвращал просто массив.
 * Оставляем, но теперь использует правильный pageable в query.
 */
export const filterStudents = async (filterReq = {}) => {
    const pageRes = await filterStudentsPage(filterReq, { page: 0, size: 100 });
    return pageRes.data;
};

/**
 * POST /student/cardsFilter
 * Ответ: PageResponseStudentCardDTO { data, page, size, totalElements, totalPages }
 */
export const filterStudentCardsPage = async (filterReq = {}, pageable = { page: 0, size: 100 }) => {
    const page = typeof pageable.page === 'number' ? pageable.page : 0;
    const size = typeof pageable.size === 'number' ? pageable.size : 100;
    const resp = await apiClientJson(`student/cardsFilter?page=${page}&size=${size}`, {
        method: 'POST',
        body: JSON.stringify(filterReq),
    });

    return {
        data: Array.isArray(resp?.data) ? resp.data : [],
        page: typeof resp?.page === 'number' ? resp.page : page,
        size: typeof resp?.size === 'number' ? resp.size : size,
        totalElements: typeof resp?.totalElements === 'number' ? resp.totalElements : 0,
        totalPages: typeof resp?.totalPages === 'number' ? resp.totalPages : 0,
    };
};

/**
 * Получение всех специальностей с пагинацией.
 * Пробуем стандартный pageable endpoint, затем fallback без пагинации.
 */
export const getAllSpecialities = async () => {
    const pageSize = 200;
    const maxPages = 200;

    try {
        const byId = new Map();
        const first = await apiClientJson(`speciality/filter?page=0&size=${pageSize}`, {
            method: 'POST',
            body: JSON.stringify({})
        });

        const firstData = Array.isArray(first?.data) ? first.data : [];
        const totalPages = typeof first?.totalPages === 'number' ? first.totalPages : 1;
        const pagesToFetch = Math.min(totalPages, maxPages);

        for (const s of firstData) {
            if (s?.id != null) byId.set(String(s.id), s);
        }

        for (let page = 1; page < pagesToFetch; page += 1) {
            const res = await apiClientJson(`speciality/filter?page=${page}&size=${pageSize}`, {
                method: 'POST',
                body: JSON.stringify({})
            });
            const pageData = Array.isArray(res?.data) ? res.data : [];
            for (const s of pageData) {
                if (s?.id != null) byId.set(String(s.id), s);
            }
        }

        return Array.from(byId.values());
    } catch (_) {
        const fallback = await apiClientJson('speciality', { method: 'GET' });
        if (Array.isArray(fallback)) return fallback;
        if (Array.isArray(fallback?.data)) return fallback.data;
        return [];
    }
};

export const getPortfolioById = async (id) => {
    try {
        const data = await apiClientJson(`portfolio/${id}`, {
            method: 'GET',
        });
        return data;
    } catch (error) {
        throw error;
    }
};

/** POST /skill/filter — справочник навыков. FilterSkillReq: { name }. */
export const filterSkills = async (filterReq = {}, pageable = { page: 0, size: 200 }) => {
    const resp = await apiClientJson(withPageQuery('skill/filter', pageable), {
        method: 'POST',
        body: JSON.stringify(filterReq),
    });
    return toPageResponse(resp, pageable);
};

export const createCompany = (body) =>
    apiClientJson('company', {
        method: 'POST',
        body: JSON.stringify(body),
        skipSessionClearOn403: true,
    });

/** POST /company/filter — поиск компаний по имени. */
export const filterCompanies = async (filterReq = {}, pageable = { page: 0, size: 20 }) => {
    const resp = await apiClientJson(withPageQuery('company/filter', pageable), {
        method: 'POST',
        body: JSON.stringify(filterReq),
        skipSessionClearOn403: true,
    });
    return pageItems(resp);
};

export const getAllCompanies = async () => {
    try {
        return await filterCompanies({}, { page: 0, size: 500 });
    } catch {
        return [];
    }
};

/** Найти id компании по точному имени (без учёта регистра). */
export const findCompanyIdByName = async (name) => {
    const trimmed = name?.trim();
    if (!trimmed) return null;
    try {
        const items = await filterCompanies({ name: trimmed }, { page: 0, size: 30 });
        const exact = items.find(
            (item) => (item?.name || '').trim().toLowerCase() === trimmed.toLowerCase(),
        );
        const id = exact?.id != null ? Number(exact.id) : NaN;
        return Number.isFinite(id) && id > 0 ? id : null;
    } catch {
        return null;
    }
};

/**
 * Нужен companyId > 0 (бэкенд: @Positive — «должно быть больше 0»).
 * Ищем в справочнике, иначе пробуем создать.
 */
export const resolveCompanyId = async (companyName, existingId) => {
    const fromEntry = Number(existingId);
    if (Number.isFinite(fromEntry) && fromEntry > 0) return fromEntry;

    const trimmed = companyName?.trim() || '';
    if (!trimmed) {
        const err = new Error('Укажите компанию');
        err.status = 400;
        throw err;
    }

    const found = await findCompanyIdByName(trimmed);
    if (found) return found;

    try {
        const created = await createCompany({ name: trimmed });
        const id = Number(created?.id);
        if (Number.isFinite(id) && id > 0) return id;
    } catch (e) {
        if (e?.status === 403) {
            const err = new Error(
                'Компания не найдена в справочнике. Выберите компанию из подсказок или попросите администратора добавить её.',
            );
            err.status = 403;
            throw err;
        }
        throw e;
    }

    const err = new Error('Не удалось определить компанию. Выберите её из списка.');
    err.status = 400;
    throw err;
};

export const createExperience = (body) =>
    apiClientJson('experience', {
        method: 'POST',
        body: JSON.stringify(body),
    });

export const updateExperience = (id, body) =>
    apiClientJson(`experience/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
    });

export const deleteExperience = (id) =>
    apiClientJson(`experience/${id}`, { method: 'DELETE' });

export const createInstitution = (body) =>
    apiClientJson('institution', {
        method: 'POST',
        body: JSON.stringify(body),
    });

export const updateInstitution = (id, body) =>
    apiClientJson(`institution/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
    });

export const deleteInstitution = (id) =>
    apiClientJson(`institution/${id}`, { method: 'DELETE' });