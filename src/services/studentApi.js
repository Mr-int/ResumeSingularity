import { API_BASE_URL } from '../config/api.js';

/**
 * Получить список всех студентов
 * @returns {Promise<Array>} Массив студентов
 */
export const getAllStudents = async () => {
    try {
        const url = `${API_BASE_URL}student/getAll`;
        console.log('[API] Fetching students from:', url);
        console.log('[API] Current cookies:', document.cookie);
        
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include', // Важно для передачи cookies
        });
        
        console.log('[API] Response status:', response.status);
        console.log('[API] Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[API] Error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('[API] Students fetched successfully, count:', data?.length || 0);
        return data;
    } catch (error) {
        console.error('[API] Error fetching students:', error);
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
        const response = await fetch(`${API_BASE_URL}student/getById/${id}`, {
            method: 'GET',
            credentials: 'include', // Важно для передачи cookies
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching student by id:', error);
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
        const response = await fetch(`${API_BASE_URL}portfolio/getAllByStudentId/${studentId}`, {
            method: 'GET',
            credentials: 'include', // Важно для передачи cookies
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching portfolio:', error);
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
        const response = await fetch(`${API_BASE_URL}institution/getById/${id}`, {
            method: 'GET',
            credentials: 'include', // Важно для передачи cookies
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching institution:', error);
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
        const response = await fetch(`${API_BASE_URL}experience/getById/${id}`, {
            method: 'GET',
            credentials: 'include', // Важно для передачи cookies
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching experience:', error);
        throw error;
    }
};

