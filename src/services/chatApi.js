import { API_BASE_URL } from '../config/api.js';
import { apiClientJson } from '../utils/apiClient.js';

/** Spring Page: data или content, иногда массив напрямую */
export const extractChatPageItems = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.content)) return res.content;
    return [];
};

const activityTime = (chat) => Date.parse(chat?.lastActivityAt || 0) || 0;

const pickNewerChat = (a, b) => (activityTime(b) > activityTime(a) ? b : a);

const mergeChatRow = (primary, secondary, mergedIds) => ({
    ...primary,
    unreadCount: (Number(primary.unreadCount) || 0) + (Number(secondary.unreadCount) || 0),
    _mergedCount: mergedIds.length,
    _mergedIds: mergedIds,
});

/**
 * Бэкенд создаёт отдельный chat на каждую заявку (request) — в списке один собеседник
 * может появиться несколько раз. Оставляем один диалог на пару рекрутер↔студент.
 *
 * @returns {{ chats: object[], aliasToCanonical: Record<string, string> }}
 */
export const dedupeChatsByPeer = (chats, role) => {
    const rows = Array.isArray(chats) ? chats : [];
    const groups = new Map();

    for (const chat of rows) {
        let key;
        if (role === 'recruiter' && chat.studentId) {
            key = `student:${chat.studentId}`;
        } else if (role === 'student' && chat.recruiterId) {
            key = `recruiter:${chat.recruiterId}`;
        } else {
            key = `chat:${chat.id}`;
        }

        const existing = groups.get(key);
        if (!existing) {
            groups.set(key, { ...chat, _mergedCount: 1, _mergedIds: [chat.id] });
            continue;
        }

        const primary = pickNewerChat(existing, chat);
        const secondary = primary.id === existing.id ? chat : existing;
        const mergedIds = [...new Set([...(existing._mergedIds || [existing.id]), chat.id])];
        groups.set(key, mergeChatRow(primary, secondary, mergedIds));
    }

    const deduped = [...groups.values()].sort((a, b) => activityTime(b) - activityTime(a));
    const aliasToCanonical = {};
    for (const row of deduped) {
        const canonicalId = row.id;
        for (const id of row._mergedIds || [canonicalId]) {
            aliasToCanonical[String(id)] = String(canonicalId);
        }
    }

    return { chats: deduped, aliasToCanonical };
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

/** ID всех чатов в объединённом диалоге (по заявкам). */
export const getChatIdList = (chatRow, fallbackId = null) => {
    const ids = Array.isArray(chatRow?._mergedIds) && chatRow._mergedIds.length
        ? chatRow._mergedIds
        : [chatRow?.id ?? fallbackId].filter(Boolean);
    return [...new Set(ids.map((id) => String(id)))];
};

/** Сообщения из всех связанных чатов одной пары собеседников. */
export const loadMergedChatMessages = async (chatRow, fallbackId, page = 0, size = 50) => {
    const ids = getChatIdList(chatRow, fallbackId);
    const batches = await Promise.all(
        ids.map((id) =>
            getChatMessages(id, page, size).catch(() => ({ data: [] })),
        ),
    );
    const byId = new Map();
    for (const res of batches) {
        for (const m of extractChatPageItems(res)) {
            if (m?.id) byId.set(String(m.id), m);
        }
    }
    return [...byId.values()].sort(
        (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
    );
};

/** Отправка в активный чат; при 403 пробуем остальные id из merge-группы. */
export const postChatTextMessageResilient = async (chatRow, fallbackId, body) => {
    const ids = getChatIdList(chatRow, fallbackId);
    const primary = chatRow?.id != null ? String(chatRow.id) : null;
    const ordered = [
        ...(primary ? [primary] : []),
        ...ids.filter((id) => id !== primary),
    ];
    const unique = [...new Set(ordered.length ? ordered : ids)];

    let lastErr = null;
    for (const id of unique) {
        try {
            return await postChatTextMessage(id, body);
        } catch (e) {
            lastErr = e;
            if (e.status !== 403 && e.status !== 404) throw e;
        }
    }
    throw lastErr || new Error('Не удалось отправить сообщение');
};

export const postChatAttachmentResilient = async (chatRow, fallbackId, file, body = '') => {
    const ids = getChatIdList(chatRow, fallbackId);
    const primary = chatRow?.id != null ? String(chatRow.id) : null;
    const ordered = [
        ...(primary ? [primary] : []),
        ...ids.filter((id) => id !== primary),
    ];
    const unique = [...new Set(ordered.length ? ordered : ids)];

    let lastErr = null;
    for (const id of unique) {
        try {
            return await postChatAttachment(id, file, body);
        } catch (e) {
            lastErr = e;
            if (e.status !== 403 && e.status !== 404) throw e;
        }
    }
    throw lastErr || new Error('Не удалось отправить файл');
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

/** Один объект чата / summary (не постраничный список). */
export const normalizeChatEntity = (res) => {
    if (!res || typeof res !== 'object') return null;
    if (res.id != null || res.unreadCount != null || res.lastMessagePreview != null) return res;
    if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) return res.data;
    return res;
};

const isActiveMessage = (m) => m && !m.deletedAt && !m.deletedByAdmin;

/**
 * Помечает прочитанным один чат — до последнего сообщения в ленте.
 */
export const markChatFullyRead = async (chatId, knownLastMessageId = null) => {
    if (!chatId) return false;
    let messageId = knownLastMessageId;
    if (!messageId) {
        const res = await getChatMessages(chatId, 0, 50);
        const rows = extractChatPageItems(res);
        const last = rows.filter(isActiveMessage).pop();
        messageId = last?.id;
    }
    if (!messageId) return false;
    await markChatRead(chatId, messageId);
    return true;
};

/**
 * У одного собеседника может быть несколько chatId (по заявкам).
 * Чтобы бейдж не залипал, читаем все связанные диалоги.
 */
export const markPeerChatsRead = async (chatRow, knownLastMessageId = null) => {
    const ids = Array.isArray(chatRow?._mergedIds) && chatRow._mergedIds.length
        ? chatRow._mergedIds
        : [chatRow?.id].filter(Boolean);
    const canonicalId = chatRow?.id != null ? String(chatRow.id) : null;
    await Promise.all(
        ids.map(async (id) => {
            const lastId =
                canonicalId && String(id) === canonicalId ? knownLastMessageId : null;
            try {
                await markChatFullyRead(id, lastId);
            } catch {
                /* отдельный чат мог быть недоступен */
            }
        }),
    );
};


/**
 * GET /chat/{chatId}/summary
 */
export const getChatSummary = async (chatId) => {
    const res = await apiClientJson(`chat/${chatId}/summary`, { method: 'GET' });
    return normalizeChatEntity(res);
};

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
