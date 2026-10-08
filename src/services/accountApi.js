    import { apiClientJson } from '../utils/apiClient.js';
    import { API_BASE_URL } from '../config/api.js';
    import { appPath } from '../utils/appBase.js';

    /** PATCH /student/me — своя карточка после саморегистрации, без сброса сессии. */
    export const patchStudentMe = async (body) => {
        const url = `${API_BASE_URL}student/me`;
        const response = await fetch(url, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const text = await response.text();
            let msg = text;
            try {
                msg = JSON.parse(text).message || text;
            } catch {
                /* empty */
            }
            const err = new Error(msg || `Ошибка ${response.status}`);
            err.status = response.status;
            throw err;
        }
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
            return response.json();
        }
        return {};
    };

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
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('isAuthenticated_time');
            window.location.href = appPath('login');
            throw new Error('HTTP error! status: 401 - Unauthorized');
        }

        if (response.status === 403) {
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('isAuthenticated_time');
            sessionStorage.setItem('showLoginAfter403', 'true');
            window.dispatchEvent(new CustomEvent('resume:auth-required'));
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
