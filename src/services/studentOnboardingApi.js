import { fetchAuthMe, EMAIL_CONFIRMATION_PENDING_KEY, EMAIL_CONFIRMATION_EMAIL_KEY } from './authApi.js';
import { getStudentMe } from './getApi.js';
import { getCommunicationReadiness } from './accountApi.js';
import {
    pathForStudentStage,
    resolveStudentStage,
    STUDENT_STAGE,
} from '../utils/studentOnboarding.js';

/**
 * Определяет этап и путь для текущего студента.
 * Для не-студентов возвращает null.
 */
export const resolveStudentOnboarding = async () => {
    const authMe = await fetchAuthMe();
    const role = String(authMe?.role || '').toUpperCase();
    if (role !== 'STUDENT') {
        return { authMe, stage: null, path: null, studentMe: null, readiness: null };
    }

    if (authMe?.emailVerified === false) {
        sessionStorage.setItem(EMAIL_CONFIRMATION_PENDING_KEY, '1');
        if (authMe?.username) {
            sessionStorage.setItem(EMAIL_CONFIRMATION_EMAIL_KEY, '');
        }
    }

    let studentMe = null;
    try {
        studentMe = await getStudentMe();
    } catch (err) {
        if (err?.status !== 404) throw err;
    }

    let readiness = null;
    const status = String(authMe?.accountStatus || '').toUpperCase();
    if (
        authMe?.emailVerified === true
        && status === 'PENDING_APPROVAL'
        && studentMe
    ) {
        try {
            readiness = await getCommunicationReadiness({ skipAuthRedirect: true });
        } catch {
            readiness = null;
        }
    }

    const stage = resolveStudentStage(authMe, studentMe, readiness);
    return {
        authMe,
        studentMe,
        readiness,
        stage,
        path: pathForStudentStage(stage),
    };
};

export { STUDENT_STAGE };
