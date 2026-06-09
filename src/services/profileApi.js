import { apiClientJson } from '../utils/apiClient.js';

/** GET profile/communication-readiness */
export const getCommunicationReadiness = () =>
    apiClientJson('profile/communication-readiness', { method: 'GET' });
