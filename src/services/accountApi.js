import { apiClientJson } from '../utils/apiClient.js';
import { API_BASE_URL } from '../config/api.js';

/** PATCH /student/me — согласие на витрину, hints */
export const patchStudentMe = (body) =>
    apiClientJson('student/me', {
        method: 'PATCH',
        body: JSON.stringify(body),
    });

/** PATCH /student/{id} — частичное обновление профиля студента */
export const patchStudent = (studentId, body) =>
    apiClientJson(`student/${studentId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
    });

/** PATCH /recruiter/{id} — частичное обновление профиля рекрутера */
export const patchRecruiter = (recruiterId, body) =>
    apiClientJson(`recruiter/${recruiterId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
    });

/**
 * POST /student/photo/{id} — multipart, поле avatarFile.
 * @returns {Promise<void>}
 */
export const uploadStudentPhoto = async (studentId, file) => {
    const formData = new FormData();
    formData.append('avatarFile', file);

    const url = `${API_BASE_URL}student/photo/${studentId}`;
    const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        body: formData,
    });

    if (response.status === 401) {
        const err = new Error('HTTP error! status: 401 - Unauthorized');
        err.status = 401;
        err.requiresAuth = true;
        throw err;
    }

    if (response.status === 403) {
        const err = new Error('HTTP error! status: 403 - Forbidden');
        err.status = 403;
        throw err;
    }

    if (!response.ok) {
        const text = await response.text();
        let msg = text;
        try {
            const j = JSON.parse(text);
            msg = j.message || text;
        } catch {
            /* empty */
        }
        const err = new Error(msg || `Ошибка ${response.status}`);
        err.status = response.status;
        throw err;
    }
};
