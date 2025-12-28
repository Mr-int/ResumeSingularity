import { API_BASE_URL } from '../config/api.js';
import { apiClientJson } from '../utils/apiClient.js';

/**
 * Получить список всех студентов
 * @returns {Promise<Array>} Массив студентов
 */
export const getAllStudents = async () => {
    try {
        const url = `student/getAll`;
        console.log('[API] Fetching students from:', url);

        const data = await apiClientJson(url, {
            method: 'GET',
        });

        console.log('[API] Students fetched successfully, count:', data?.length || 0);
        return data;
    } catch (error) {
        console.error('[API] Error fetching students:', error);
        // Если это ошибка авторизации, пробрасываем дальше
        if (error.requiresAuth) {
            throw error;
        }
        throw error;
    }
};

/**
 * Получить данные конкретного студента по ID
 * @param {string} id - ID студента
 * @returns {Promise<Object>} Данные студента
 */
export const getStudentById = async (id) => {
    try {
        const data = await apiClientJson(`student/getById/${id}`, {
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

/**
 * Получить все проекты портфолио студента
 * @param {string} studentId - ID студента
 * @returns {Promise<Array>} Массив проектов портфолио
 */
export const getPortfolioByStudentId = async (studentId) => {
    try {
        const data = await apiClientJson(`portfolio/getAllByStudentId/${studentId}`, {
            method: 'GET',
        });
        return data;
    } catch (error) {
        console.error('Error fetching portfolio:', error);
        if (error.requiresAuth) {
            throw error;
        }
        throw error;
    }
};

/**
 * Получить информацию об образовательном учреждении по ID
 * @param {string} id - ID образовательного учреждения
 * @returns {Promise<Object>} Данные образовательного учреждения
 */
export const getInstitutionById = async (id) => {
    try {
        const data = await apiClientJson(`institution/getById/${id}`, {
            method: 'GET',
        });
        return data;
    } catch (error) {
        console.error('Error fetching institution:', error);
        if (error.requiresAuth) {
            throw error;
        }
        throw error;
    }
};

/**
 * Получить все образовательные учреждения студента по его ID
 * @param {string} studentId - ID студента
 * @returns {Promise<Array>} Массив образовательных учреждений студента
 */
export const getInstitutionsByStudentId = async (studentId) => {
    try {
        const data = await apiClientJson(`institution/getByStudentId/${studentId}`, {
            method: 'GET',
        });
        return data;
    } catch (error) {
        console.error('Error fetching institutions by student id:', error);
        if (error.requiresAuth) {
            throw error;
        }
        throw error;
    }
};

/**
 * Получить информацию об опыте работы по ID
 * @param {string} id - ID опыта работы
 * @returns {Promise<Object>} Данные опыта работы
 */
export const getExperienceById = async (id) => {
    try {
        const data = await apiClientJson(`experience/getById/${id}`, {
            method: 'GET',
        });
        return data;
    } catch (error) {
        console.error('Error fetching experience:', error);
        if (error.requiresAuth) {
            throw error;
        }
        throw error;
    }
};

/**
 * Получить все записи об образовании
 * @returns {Promise<Array>} Массив всех образований
 */
export const getAllEducation = async () => {
    try {
        const data = await apiClientJson(`education/getAll`, {
            method: 'GET',
        });
        return data;
    } catch (error) {
        console.error('Error fetching all education:', error);
        if (error.requiresAuth) {
            throw error;
        }
        throw error;
    }
};

/**
 * Получить все записи об опыте работы
 * @returns {Promise<Array>} Массив всего опыта работы
 */
export const getAllExperience = async () => {
    try {
        const data = await apiClientJson(`experience/getAll`, {
            method: 'GET',
        });
        return data;
    } catch (error) {
        console.error('Error fetching all experience:', error);
        if (error.requiresAuth) {
            throw error;
        }
        throw error;
    }
};