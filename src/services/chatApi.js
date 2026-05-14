import { apiClientJson } from '../utils/apiClient.js';

const pageQuery = (page, size, sortFields = []) => {
    const p = new URLSearchParams();
    p.set('page', String(page));
    p.set('size', String(size));
    for (const s of sortFields) {
        p.append('sort', s);
    }
    return p.toString();
};

/**
 * GET /chat — список чатов (постранично, как в OpenAPI: pageable обязателен).
 */
export const getMyChats = (page = 0, size = 50) =>
    apiClientJson(`chat?${pageQuery(page, size, ['lastActivityAt,desc'])}`, { method: 'GET' });

/**
 * GET /chat/{chatId}/messages
 */
export const getChatMessages = (chatId, page = 0, size = 100) =>
    apiClientJson(`chat/${chatId}/messages?${pageQuery(page, size, ['createdAt,asc'])}`, {
        method: 'GET',
    });

/**
 * POST /chat/{chatId}/messages — текстовое сообщение.
 */
export const postChatTextMessage = (chatId, body) =>
    apiClientJson(`chat/${chatId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body: body ?? '' }),
    });

/**
 * POST /chat/{chatId}/read
 */
export const markChatRead = (chatId, messageId) =>
    apiClientJson(`chat/${chatId}/read`, {
        method: 'POST',
        body: JSON.stringify({ messageId }),
    });
