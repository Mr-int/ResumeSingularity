import { apiClientJson } from '../utils/apiClient.js';
import { getCompanyById } from './getApi.js';
import { hasApprovedCatalogAccess, isAuthenticated } from './authApi.js';
import { filterPublicStudentCards, getPublicStudentCard, getPublicHomeVitrinaStudents } from './publicApi.js';

/**
 * Студенты для слайдера на главной:
 * - одобренные пользователи — полный каталог;
 * - гости — GET /public/vitrina/home;
 * - остальные авторизованные — getAllStudents (может быть пусто до одобрения).
 */
export const getHomeSliderStudents = async () => {
    if (hasApprovedCatalogAccess()) {
        return getAllStudents();
    }
    if (!isAuthenticated()) {
        try {
            return await getPublicHomeVitrinaStudents();
        } catch {
            return [];
        }
    }
    return getAllStudents();
};

export const getAllStudents = async () => {
    try {
        if (!hasApprovedCatalogAccess()) {
            if (!isAuthenticated()) {
                const pageRes = await filterPublicStudentCards({}, 0, 200);
                return Array.isArray(pageRes.data) ? pageRes.data : [];
            }
            return [];
        }

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
        if (error.status === 403 && !hasApprovedCatalogAccess()) {
            try {
                const pageRes = await filterPublicStudentCards({}, 0, 200);
                return Array.isArray(pageRes.data) ? pageRes.data : [];
            } catch {
                return [];
            }
        }
        if (error.requiresAuth) {
            throw error;
        }
        throw error;
    }
};

export const fetchStudentForView = async (id) => {
    if (hasApprovedCatalogAccess()) {
        try {
            const data = await apiClientJson(`student/${id}`, { method: 'GET' });
            if (data?.id) return data;
        } catch (e) {
            if (e.status !== 403 && e.status !== 404) throw e;
        }
    }

    try {
        return await getPublicStudentCard(id);
    } catch (e) {
        if (e.status === 404) {
            const err = new Error('Студент не найден');
            err.status = 404;
            throw err;
        }
        throw e;
    }
};

export const getStudentById = async (id) => {
    try {
        const data = await fetchStudentForView(id);
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

/** Навыки приходят в DTO студента (`student.skills`); отдельный filter по studentId в API нет. */
export const getSkillsByStudentId = async () => [];

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