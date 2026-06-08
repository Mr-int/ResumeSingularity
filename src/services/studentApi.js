import { apiClientJson } from '../utils/apiClient.js';
import { getCompanyById } from './getApi.js';
import {
    filterStudentCardsPage as catalogFilterStudentCardsPage,
    getStudentCardById,
    extractPageRows,
} from './catalogApi.js';
import { hasRecruiterCatalogAccess, isStudentRole } from './authApi.js';
import { getStudentMe } from './getApi.js';
import { getRegistrationSpecialities, catalogRows } from './registrationCatalogApi.js';

/** @deprecated Используйте getFeaturedStudentCards или getSimilarStudentCards */
export const getAllStudents = async () => {
    return getFeaturedStudentCards(200);
};

/** Ограниченная выборка для слайдера/главной — один запрос вместо полного каталога. */
export const getFeaturedStudentCards = async (limit = 24) => {
    const result = await catalogFilterStudentCardsPage({}, { page: 0, size: limit });
    return Array.isArray(result?.data) ? result.data : [];
};

/** Похожие студенты по специальности — bounded-запрос для страницы резюме. */
export const getSimilarStudentCards = async (excludeStudentId, specialityId, limit = 6) => {
    const filterReq = {};
    const specId = Number(specialityId);
    if (Number.isFinite(specId)) {
        filterReq.specialitiesIds = [specId];
    }
    const result = await catalogFilterStudentCardsPage(filterReq, { page: 0, size: limit + 8 });
    const rows = Array.isArray(result?.data) ? result.data : [];
    return rows
        .filter((s) => String(s?.id) !== String(excludeStudentId))
        .slice(0, limit);
};

export const getStudentById = async (id) => {
    if (isStudentRole()) {
        try {
            const me = await getStudentMe();
            if (me?.id && String(me.id) === String(id)) {
                return me;
            }
        } catch (error) {
            if (error.status !== 404 && error.status !== 403) {
                throw error;
            }
        }
    }
    return getStudentCardById(id);
};

export const getPortfolioByStudentId = async (studentId) => {
    try {
        const data = await apiClientJson(`portfolio/filter`, {
            method: 'POST',
            body: JSON.stringify({
                studentId: studentId,
                page: 0,
                size: 100
            })
        });

        if (data && data.data) {
            return data.data;
        } else if (data && data.content) {
            return data.content;
        } else if (Array.isArray(data)) {
            return data;
        }
        return [];
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
        const data = await apiClientJson(`institution/filter`, {
            method: 'POST',
            body: JSON.stringify({
                studentId: studentId,
                page: 0,
                size: 100
            })
        });

        if (data && data.data) {
            return data.data;
        } else if (Array.isArray(data)) {
            return data;
        }
        return [];
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
        const data = await apiClientJson(`experience/filter`, {
            method: 'POST',
            body: JSON.stringify({
                studentId: studentId,
                page: 0,
                size: 100
            })
        });

        if (data && data.data) {
            return data.data;
        } else if (Array.isArray(data)) {
            return data;
        }
        return [];
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

export const getAllEducation = async () => {
    try {
        const data = await apiClientJson(`institution/filter`, {
            method: 'POST',
            body: JSON.stringify({
                page: 0,
                size: 1000
            })
        });

        if (data && data.data) {
            return data.data;
        } else if (Array.isArray(data)) {
            return data;
        }
        return [];
    } catch (error) {
        throw error;
    }
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
        const educationList = await apiClientJson(`institution/filter`, {
            method: 'POST',
            body: JSON.stringify({
                studentId: studentId,
                page: 0,
                size: 100
            })
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
        const data = await apiClientJson(`institution/filter`, {
            method: 'POST',
            body: JSON.stringify({
                studentId: studentId,
                page: 0,
                size: 100
            })
        });

        if (data && data.data) {
            return data.data;
        } else if (Array.isArray(data)) {
            return data;
        }
        return [];
    } catch (error) {
        return [];
    }
};

export const getAllExperience = async () => {
    try {
        const data = await apiClientJson(`experience/filter`, {
            method: 'POST',
            body: JSON.stringify({
                page: 0,
                size: 1000
            })
        });

        if (data && data.data) {
            return data.data;
        } else if (Array.isArray(data)) {
            return data;
        }
        return [];
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
        const data = await apiClientJson(`skill/filter`, {
            method: 'POST',
            body: JSON.stringify({
                studentId: studentId,
                page: 0,
                size: 100
            })
        });

        if (data && data.data) {
            return data.data;
        } else if (data && data.content) {
            return data.content;
        } else if (Array.isArray(data)) {
            return data;
        }
        return [];
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
 * Каталог карточек для UI (StudentsList, слайдер).
 * Публично → /public/students/cards; рекрутер/админ → /student/cardsFilter.
 */
export const filterStudentsPage = async (filterReq = {}, pageable = { page: 0, size: 100 }) =>
    catalogFilterStudentCardsPage(filterReq, pageable);

/**
 * POST /student/filter — полный StudentDTO (только RECRUITER / ADMIN).
 * Page в query; сортировка в JSON.
 */
export const filterStudentsFullPage = async (filterReq = {}, pageable = { page: 0, size: 100 }) => {
    if (!hasRecruiterCatalogAccess()) {
        const err = new Error('Полный каталог доступен только рекрутёрам и администраторам');
        err.status = 403;
        throw err;
    }
    const page = typeof pageable.page === 'number' ? pageable.page : 0;
    const size = typeof pageable.size === 'number' ? pageable.size : 100;
    const resp = await apiClientJson(`student/filter?page=${page}&size=${size}`, {
        method: 'POST',
        body: JSON.stringify(filterReq),
        skipSessionClearOn403: true,
    });
    return {
        data: extractPageRows(resp),
        page: typeof resp?.page === 'number' ? resp.page : page,
        size: typeof resp?.size === 'number' ? resp.size : size,
        totalElements: typeof resp?.totalElements === 'number' ? resp.totalElements : 0,
        totalPages: typeof resp?.totalPages === 'number' ? resp.totalPages : 0,
    };
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
export const filterStudentCardsPage = async (filterReq = {}, pageable = { page: 0, size: 100 }) =>
    catalogFilterStudentCardsPage(filterReq, pageable);

/**
 * Получение всех специальностей с пагинацией.
 * Пробуем стандартный pageable endpoint, затем fallback без пагинации.
 */
const getPublicSpecialities = async () => {
    const pageSize = 200;
    const maxPages = 50;
    const byId = new Map();

    const first = await getRegistrationSpecialities(0, pageSize);
    const firstData = catalogRows(first);
    const totalPages = typeof first?.totalPages === 'number' ? first.totalPages : 1;
    const pagesToFetch = Math.min(totalPages, maxPages);

    for (const s of firstData) {
        if (s?.id != null) byId.set(String(s.id), s);
    }

    for (let page = 1; page < pagesToFetch; page += 1) {
        const res = await getRegistrationSpecialities(page, pageSize);
        for (const s of catalogRows(res)) {
            if (s?.id != null) byId.set(String(s.id), s);
        }
    }

    return Array.from(byId.values());
};

export const getAllSpecialities = async () => {
    try {
        return await getPublicSpecialities();
    } catch {
        /* fallback to authenticated catalog below */
    }

    if (!hasRecruiterCatalogAccess()) {
        return [];
    }

    const pageSize = 200;
    const maxPages = 200;

    try {
        const byId = new Map();
        const first = await apiClientJson(`speciality/filter?page=0&size=${pageSize}`, {
            method: 'POST',
            body: JSON.stringify({}),
            skipSessionClearOn403: true,
        });

        const firstData = extractPageRows(first);
        const totalPages = typeof first?.totalPages === 'number' ? first.totalPages : 1;
        const pagesToFetch = Math.min(totalPages, maxPages);

        for (const s of firstData) {
            if (s?.id != null) byId.set(String(s.id), s);
        }

        for (let page = 1; page < pagesToFetch; page += 1) {
            const res = await apiClientJson(`speciality/filter?page=${page}&size=${pageSize}`, {
                method: 'POST',
                body: JSON.stringify({}),
                skipSessionClearOn403: true,
            });
            const pageData = extractPageRows(res);
            for (const s of pageData) {
                if (s?.id != null) byId.set(String(s.id), s);
            }
        }

        return Array.from(byId.values());
    } catch (error) {
        if (error.status === 403 || error.status === 401) {
            try {
                return await getPublicSpecialities();
            } catch {
                return [];
            }
        }
        try {
            return await getPublicSpecialities();
        } catch {
            return [];
        }
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