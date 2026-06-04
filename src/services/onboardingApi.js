import { apiClientJson } from '../utils/apiClient.js';

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
