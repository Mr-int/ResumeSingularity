import { apiClientJson } from '../utils/apiClient.js';
import { isResumeConstraintError } from '../utils/studentResumeValidation.js';

const ONBOARDING_CACHE_KEY = 'resumeOnboardingCache';

export const getCachedOnboardingStatus = (role) => {
    try {
        const raw = sessionStorage.getItem(ONBOARDING_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.[role] ?? null;
    } catch {
        return null;
    }
};

export const setCachedOnboardingStatus = (role, completed) => {
    try {
        const raw = sessionStorage.getItem(ONBOARDING_CACHE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        parsed[role] = { completed: Boolean(completed) };
        sessionStorage.setItem(ONBOARDING_CACHE_KEY, JSON.stringify(parsed));
    } catch {
        /* ignore */
    }
};

/** GET /student/onboarding/status */
export const getStudentOnboardingStatus = () =>
    apiClientJson('student/onboarding/status', { method: 'GET' });

/** GET /student/onboarding/resume */
export const getStudentResumeForEdit = () =>
    apiClientJson('student/onboarding/resume', { method: 'GET' });

/** POST /student/onboarding/resume */
export const completeStudentResume = (body) =>
    apiClientJson('student/onboarding/resume', {
        method: 'POST',
        body: JSON.stringify(body),
    });

/** PUT /student/onboarding/resume */
export const updateStudentResume = (body) =>
    apiClientJson('student/onboarding/resume', {
        method: 'PUT',
        body: JSON.stringify(body),
    });

/**
 * POST для первого сохранения, PUT для обновления.
 * При duplicate/constraint на POST автоматически пробует PUT.
 */
export const saveStudentResume = async (body, { hasStudentCard = false } = {}) => {
    if (hasStudentCard) {
        return updateStudentResume(body);
    }
    try {
        return await completeStudentResume(body);
    } catch (error) {
        if (isResumeConstraintError(error)) {
            return updateStudentResume(body);
        }
        throw error;
    }
};

/** GET /recruiter/onboarding/status */
export const getRecruiterOnboardingStatus = () =>
    apiClientJson('recruiter/onboarding/status', { method: 'GET' });

/** POST /recruiter/onboarding/vacancy */
export const createFirstRecruiterVacancy = (body) =>
    apiClientJson('recruiter/onboarding/vacancy', {
        method: 'POST',
        body: JSON.stringify(body),
    });
