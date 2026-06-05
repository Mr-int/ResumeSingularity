import { apiClientJson } from '../utils/apiClient.js';

const STUDENT_ONBOARDING_CACHE_KEY = 'resumeOnboardingStudent';
const RECRUITER_ONBOARDING_CACHE_KEY = 'resumeOnboardingRecruiter';

export function getCachedOnboardingStatus(role) {
    const key = role === 'student' ? STUDENT_ONBOARDING_CACHE_KEY : RECRUITER_ONBOARDING_CACHE_KEY;
    const value = sessionStorage.getItem(key);
    if (value === 'completed') return { completed: true };
    if (value === 'incomplete') return { completed: false };
    return null;
}

export function setCachedOnboardingStatus(role, completed) {
    const key = role === 'student' ? STUDENT_ONBOARDING_CACHE_KEY : RECRUITER_ONBOARDING_CACHE_KEY;
    sessionStorage.setItem(key, completed ? 'completed' : 'incomplete');
}

export function clearOnboardingCache() {
    sessionStorage.removeItem(STUDENT_ONBOARDING_CACHE_KEY);
    sessionStorage.removeItem(RECRUITER_ONBOARDING_CACHE_KEY);
}

export const getStudentOnboardingStatus = () =>
    apiClientJson('student/onboarding/status', { method: 'GET', skipSessionClearOn403: true });

export const completeStudentResumeOnboarding = (body) =>
    apiClientJson('student/onboarding/resume', {
        method: 'POST',
        body: JSON.stringify(body),
    });

export const getStudentResumeEdit = () =>
    apiClientJson('student/onboarding/resume', { method: 'GET', skipSessionClearOn403: true });

export const updateStudentResume = (body) =>
    apiClientJson('student/onboarding/resume', {
        method: 'PUT',
        body: JSON.stringify(body),
    });

export const getRecruiterOnboardingStatus = () =>
    apiClientJson('recruiter/onboarding/status', { method: 'GET', skipSessionClearOn403: true });

export const createRecruiterFirstVacancy = (body) =>
    apiClientJson('recruiter/onboarding/vacancy', {
        method: 'POST',
        body: JSON.stringify(body),
    });
