import { apiClientJson } from '../utils/apiClient.js';

export const getCommunicationReadiness = () =>
    apiClientJson('profile/communication-readiness', { method: 'GET', skipSessionClearOn403: true });
