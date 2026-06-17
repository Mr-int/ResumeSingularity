import { getImageUrl } from '../config/api.js';
import { apiClientFormData, apiClientJson } from '../utils/apiClient.js';
import { isChatMessagesBlockedError } from '../utils/apiErrors.js';

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
    studentId: primary.studentId ?? secondary.studentId,
    recruiterId: primary.recruiterId ?? secondary.recruiterId,
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
export const getChatMessages = async (chatId, page = 0, size = 50, options = {}) => {
    const quiet = options.quiet === true;
    const withSort = `chat/${chatId}/messages?${pageQuery(page, size, ['createdAt,asc'])}`;
    const noSort = `chat/${chatId}/messages?${pageQuery(page, size, [])}`;
    try {
        return await apiClientJson(withSort, { method: 'GET', quiet });
    } catch (e) {
        if (isChatMessagesBlockedError(e)) {
            throw e;
        }
        if (e.status === 500) {
            return await apiClientJson(noSort, { method: 'GET', quiet });
        }
        if (e.status === 400) {
            return await apiClientJson(noSort, { method: 'GET', quiet });
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
            getChatMessages(id, page, size, { quiet: true }).catch((e) => {
                if (isChatMessagesBlockedError(e)) return { data: [] };
                return { data: [] };
            }),
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
        quiet: true,
    });

/** Один объект чата / summary (не постраничный список). */
export const normalizeChatEntity = (res) => {
    if (!res || typeof res !== 'object') return null;
    if (res.id != null || res.unreadCount != null || res.lastMessagePreview != null) return res;
    if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) return res.data;
    return res;
};

const isActiveMessage = (m) => m && !m.deletedAt && !m.deletedByAdmin;

const resolveMessageChatId = (message, chatRow, fallbackId = null) => {
    const mergeIds = new Set(getChatIdList(chatRow, fallbackId ?? chatRow?.id).map(String));
    if (message?.chatId != null && mergeIds.has(String(message.chatId))) {
        return String(message.chatId);
    }
    if (chatRow?.id != null) return String(chatRow.id);
    if (fallbackId != null) return String(fallbackId);
    return null;
};

/**
 * Помечает прочитанным один чат — messageId должен принадлежать этому chatId.
 */
export const markChatFullyRead = async (chatId, knownLastMessage = null) => {
    if (!chatId) return false;
    let messageId = null;
    if (knownLastMessage && typeof knownLastMessage === 'object') {
        messageId = knownLastMessage.id;
    } else if (knownLastMessage) {
        messageId = knownLastMessage;
    }
    if (!messageId) {
        const res = await getChatMessages(chatId, 0, 50, { quiet: true });
        const rows = extractChatPageItems(res);
        const last = rows.filter(isActiveMessage).pop();
        messageId = last?.id;
    }
    if (!messageId) return false;
    await markChatRead(chatId, messageId);
    return true;
};

/**
 * Для объединённого диалога (несколько chatId по заявкам) — read только в том чате,
 * куда реально попало сообщение (message.chatId).
 */
export const markMergedChatRead = async (chatRow, messagesOrMessage = null, fallbackId = null) => {
    const mergeIds = new Set(getChatIdList(chatRow, fallbackId ?? chatRow?.id).map(String));
    const rows = Array.isArray(messagesOrMessage)
        ? messagesOrMessage
        : messagesOrMessage
          ? [messagesOrMessage]
          : [];

    const lastByChat = new Map();
    for (const message of rows) {
        if (!isActiveMessage(message) || !message?.id) continue;
        const chatId = resolveMessageChatId(message, chatRow, fallbackId);
        if (!chatId || !mergeIds.has(chatId)) continue;
        const prev = lastByChat.get(chatId);
        if (!prev || new Date(message.createdAt || 0) > new Date(prev.createdAt || 0)) {
            lastByChat.set(chatId, message);
        }
    }

    if (lastByChat.size) {
        await Promise.all(
            [...lastByChat.values()].map(async (message) => {
                const chatId = resolveMessageChatId(message, chatRow, fallbackId);
                if (!chatId) return;
                try {
                    await markChatRead(chatId, message.id);
                } catch {
                    /* сообщение могло быть из другого чата merge-группы */
                }
            }),
        );
        return;
    }

    await Promise.all(
        [...mergeIds].map(async (id) => {
            try {
                await markChatFullyRead(id);
            } catch {
                /* отдельный чат мог быть недоступен */
            }
        }),
    );
};

/** @deprecated alias */
export const markPeerChatsRead = markMergedChatRead;


/**
 * GET /chat/{chatId}/summary
 */
export const getChatSummary = async (chatId, options = {}) => {
    const res = await apiClientJson(`chat/${chatId}/summary`, {
        method: 'GET',
        quiet: options.quiet === true,
    });
    return normalizeChatEntity(res);
};

/**
 * POST /chat/{chatId}/messages/attachment — multipart
 */
export const getChatAttachmentUrl = (storageName) => {
    if (!storageName) return null;
    const value = String(storageName).trim();
    if (!value) return null;
    if (value.startsWith('http://') || value.startsWith('https://')) return value;
    return getImageUrl(value);
};

const MAX_CHAT_ATTACHMENT_BYTES = 15 * 1024 * 1024;

export const postChatAttachment = async (chatId, file, body = '') => {
    if (!file) {
        throw new Error('Файл не выбран');
    }
    if (file.size > MAX_CHAT_ATTACHMENT_BYTES) {
        throw new Error('Файл слишком большой (максимум 15 МБ)');
    }

    const formData = new FormData();
    formData.append('file', file, file.name);
    if (body != null && String(body).trim()) {
        formData.append('body', String(body).trim());
    }

    return apiClientFormData(`chat/${chatId}/messages/attachment`, formData, {
        timeoutMs: 60_000,
    });
};

/**
 * PATCH /chat/{chatId}/messages/{messageId}
 */
export const patchChatMessage = (chatId, messageId, body) =>
    apiClientJson(`chat/${chatId}/messages/${messageId}`, {
        method: 'PATCH',
        body: JSON.stringify({ body: body ?? '' }),
    });

/** PATCH в чате, к которому привязано сообщение (важно для merge-диалогов). */
export const patchChatMessageResilient = async (chatRow, fallbackId, messageId, body, messageChatId = null) => {
    const ordered = [
        ...(messageChatId ? [String(messageChatId)] : []),
        ...getChatIdList(chatRow, fallbackId),
    ];
    const unique = [...new Set(ordered.filter(Boolean))];

    let lastErr = null;
    for (const id of unique) {
        try {
            return await patchChatMessage(id, messageId, body);
        } catch (e) {
            lastErr = e;
            if (e.status !== 403 && e.status !== 404 && e.status !== 400) throw e;
        }
    }
    throw lastErr || new Error('Не удалось изменить сообщение');
};
