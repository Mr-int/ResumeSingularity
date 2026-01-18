import { apiClientJson } from '../utils/apiClient.js';

export const getAllStudents = async () => {
    try {
        const response = await apiClientJson('student/filter', {
            method: 'POST',
            body: JSON.stringify({
                page: 0,
                size: 100
            })
        });

        // Обрабатываем новый формат ответа с data
        if (response && response.data) {
            return response.data;
        } else if (response && response.content) {
            return response.content;
        } else if (Array.isArray(response)) {
            return response;
        }

        return [];
    } catch (error) {
        console.error('[API] Error fetching students:', error);
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
        console.error('Error fetching student by id:', error);
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

        // Обрабатываем новый формат с data
        if (data && data.data) {
            return data.data;
        } else if (data && data.content) {
            return data.content;
        } else if (Array.isArray(data)) {
            return data;
        }
        return [];
    } catch (error) {
        console.error('Error fetching portfolio:', error);
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
        console.error('Error fetching institution:', error);
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
            return data.data.filter(item => {
                return item.studentId === studentId ||
                    (item.student && item.student.id === studentId);
            });
        } else if (Array.isArray(data)) {
            return data.filter(item => {
                return item.studentId === studentId ||
                    (item.student && item.student.id === studentId);
            });
        }
        return [];
    } catch (error) {
        console.error('Error fetching institutions by student id:', error);
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
        console.error('Error fetching experience:', error);
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
        } else if (data && data.content) {
            return data.content;
        } else if (Array.isArray(data)) {
            return data;
        }
        return [];
    } catch (error) {
        console.error('Error fetching experience by student id:', error);
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
        console.error('Error fetching all education:', error);
        throw error;
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
            const filtered = data.data.filter(item => {
                return item.studentId === studentId ||
                    (item.student && item.student.id === studentId);
            });
            console.log('[getEducationByStudentId] Filtered data for', studentId, ':', filtered);
            return filtered;
        } else if (Array.isArray(data)) {
            const filtered = data.filter(item => {
                return item.studentId === studentId ||
                    (item.student && item.student.id === studentId);
            });
            console.log('[getEducationByStudentId] Filtered data for', studentId, ':', filtered);
            return filtered;
        }
        return [];
    } catch (error) {
        console.error('Error fetching education by student id:', error);
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
        console.error('Error fetching all experience:', error);
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
        console.error('Error fetching skill:', error);
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
        console.error('Error fetching skills by student id:', error);
        return [];
    }
};

export const sendStudentRequest = async (requestData) => {
    try {
        const data = await apiClientJson('request/create', {
            method: 'POST',
            body: JSON.stringify(requestData)
        });
        return data;
    } catch (error) {
        console.error('Error sending student request:', error);
        throw error;
    }
};

export const createRecruiterRequest = async (recruiterData) => {
    try {
        const data = await apiClientJson('recruiter/create', {
            method: 'POST',
            body: JSON.stringify(recruiterData)
        });
        return data;
    } catch (error) {
        console.error('Error creating recruiter request:', error);
        throw error;
    }
};

export const filterStudents = async (filterData = {}) => {
    try {
        const defaultFilter = {
            page: 0,
            size: 100,
            ...filterData
        };

        const data = await apiClientJson('student/filter', {
            method: 'POST',
            body: JSON.stringify(defaultFilter)
        });

        // Возвращаем data или весь объект с пагинацией
        if (data && data.data) {
            return data;
        }
        return data;
    } catch (error) {
        console.error('[API] Error filtering students:', error);
        throw error;
    }
};

export const getPortfolioById = async (id) => {
    try {
        const data = await apiClientJson(`portfolio/${id}`, {
            method: 'GET',
        });
        return data;
    } catch (error) {
        console.error('Error fetching portfolio by id:', error);
        throw error;
    }
};