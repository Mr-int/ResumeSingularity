import { API_BASE_URL } from '../config/api.js';

/**
 * Публичная витрина главной страницы: резюме + проекты (без вакансий).
 * @returns {Promise<{ students: Array, projects: Array }>}
 */
export async function fetchHomeVitrina() {
    const response = await fetch(`${API_BASE_URL}public/vitrina/home`, {
        method: 'GET',
        credentials: 'omit',
    });
    if (!response.ok) {
        const text = await response.text();
        let msg = text;
        try {
            msg = JSON.parse(text).message || text;
        } catch {
            /* empty */
        }
        const err = new Error(msg || `Ошибка загрузки витрины: ${response.status}`);
        err.status = response.status;
        throw err;
    }
    const data = await response.json();
    return {
        students: Array.isArray(data?.students) ? data.students : [],
        projects: Array.isArray(data?.projects) ? data.projects : [],
    };
}
