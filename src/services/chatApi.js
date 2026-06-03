import { API_BASE_URL } from '../config/api.js';
import { apiClientJson } from '../utils/apiClient.js';

/** Spring Page: data или content, иногда массив напрямую */
export const extractChatPageItems = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.content)) return res.content;
    return [];
};

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
 * При 500 на бэкенде пробуем без sort (известная несовместимость pageable).
 */
export const getChatMessages = async (chatId, page = 0, size = 50) => {
    const withSort = `chat/${chatId}/messages?${pageQuery(page, size, ['createdAt,asc'])}`;
    const noSort = `chat/${chatId}/messages?${pageQuery(page, size, [])}`;
    try {
        return await apiClientJson(withSort, { method: 'GET' });
    } catch (e) {
        if (e.status === 500 || e.status === 400) {
            return await apiClientJson(noSort, { method: 'GET' });
        }
        throw e;
    }
};

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

/**
 * GET /chat/{chatId}/summary
 */
export const getChatSummary = (chatId) =>
    apiClientJson(`chat/${chatId}/summary`, { method: 'GET' });

/**
 * POST /chat/{chatId}/messages/attachment — multipart
 */
export const postChatAttachment = async (chatId, file, body = '') => {
    const formData = new FormData();
    formData.append('file', file);
    if (body != null && String(body).trim()) {
        formData.append('body', String(body).trim());
    }

    const url = `${API_BASE_URL}chat/${chatId}/messages/attachment`;
    const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        let msg = errorText;
        try {
            const j = JSON.parse(errorText);
            msg = j.message || errorText;
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
    const text = await response.text();
    return text ? JSON.parse(text) : {};
};

/**
 * PATCH /chat/{chatId}/messages/{messageId}
 */
export const patchChatMessage = (chatId, messageId, body) =>
    apiClientJson(`chat/${chatId}/messages/${messageId}`, {
        method: 'PATCH',
        body: JSON.stringify({ body: body ?? '' }),
    });
