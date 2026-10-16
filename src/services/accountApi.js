import { apiClientJson } from '../utils/apiClient.js';
import { API_BASE_URL } from '../config/api.js';
import { clearLocalAuth, refreshSession } from './authApi.js';
import { appPath } from '../utils/appBase.js';

/** PATCH /student/me — своя карточка после саморегистрации. */
export const patchStudentMe = (body) =>
    apiClientJson('student/me', {
        method: 'PATCH',
        body: JSON.stringify(body),
    });

/** PATCH /student/{id} — частичное обновление профиля студента (ADMIN). */
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

const postStudentPhotoOnce = (studentId, file) => {
    const formData = new FormData();
    formData.append('avatarFile', file);
    return fetch(`${API_BASE_URL}student/photo/${studentId}`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
    });
};

/**
 * POST /student/photo/{id} — multipart, поле avatarFile.
 * 401 → refresh + один retry (как apiClient). 403 не сбрасывает сессию.
 */
export const uploadStudentPhoto = async (studentId, file) => {
    let response = await postStudentPhotoOnce(studentId, file);

    if (response.status === 401) {
        try {
            await refreshSession();
            response = await postStudentPhotoOnce(studentId, file);
        } catch {
            clearLocalAuth();
            window.location.href = appPath('login');
            throw new Error('HTTP error! status: 401 - Unauthorized');
        }
    }

    if (response.status === 401) {
        clearLocalAuth();
        window.location.href = appPath('login');
        throw new Error('HTTP error! status: 401 - Unauthorized');
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
