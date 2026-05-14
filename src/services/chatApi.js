/**
 * Заглушка под чаты. Заменить на:
 * - GET /chat?page=&size=
 * - GET /chat/{chatId}/messages?page=&size=
 * через apiClientJson из ../utils/apiClient.js
 */
import { MOCK_CHAT_SUMMARIES, MOCK_MESSAGES_BY_CHAT_ID } from '../data/mockChatsData.js';

const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

const asPage = (items, page, size) => {
    const totalElements = items.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / size));
    const start = page * size;
    const slice = items.slice(start, start + size);
    return {
        data: slice,
        content: slice,
        page,
        size,
        totalElements,
        totalPages,
    };
};

/**
 * @param {{ page?: number, size?: number }} pageable
 * @returns {Promise<{ data: typeof MOCK_CHAT_SUMMARIES, content: typeof MOCK_CHAT_SUMMARIES, page: number, size: number, totalElements: number, totalPages: number }>}
 */
export const fetchChatsPage = async (pageable = {}) => {
    const page = typeof pageable.page === 'number' ? pageable.page : 0;
    const size = typeof pageable.size === 'number' ? pageable.size : 20;
    await delay();
    return asPage([...MOCK_CHAT_SUMMARIES], page, size);
};

/**
 * @param {string} chatId
 * @param {{ page?: number, size?: number }} pageable
 */
export const fetchChatMessages = async (chatId, pageable = {}) => {
    const page = typeof pageable.page === 'number' ? pageable.page : 0;
    const size = typeof pageable.size === 'number' ? pageable.size : 50;
    await delay(80);
    const list = [...(MOCK_MESSAGES_BY_CHAT_ID[chatId] || [])];
    return asPage(list, page, size);
};
