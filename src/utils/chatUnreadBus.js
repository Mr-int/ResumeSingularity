const ACTIVE_CHAT_EVENT = 'resume:chat-active';
const UNREAD_TOTAL_EVENT = 'resume:chat-unread-total';

let activeChatId = null;
let unreadTotal = 0;

export const setActiveChatId = (chatId) => {
    activeChatId = chatId ? String(chatId) : null;
    window.dispatchEvent(
        new CustomEvent(ACTIVE_CHAT_EVENT, { detail: { chatId: activeChatId } }),
    );
};

export const getActiveChatId = () => activeChatId;

export const setChatUnreadTotal = (total) => {
    const next = Math.max(0, Number(total) || 0);
    if (next === unreadTotal) return;
    unreadTotal = next;
    window.dispatchEvent(
        new CustomEvent(UNREAD_TOTAL_EVENT, { detail: { total: unreadTotal } }),
    );
};

export const getChatUnreadTotal = () => unreadTotal;

export const subscribeActiveChatId = (handler) => {
    const listener = (event) => handler(event.detail?.chatId ?? null);
    window.addEventListener(ACTIVE_CHAT_EVENT, listener);
    handler(activeChatId);
    return () => window.removeEventListener(ACTIVE_CHAT_EVENT, listener);
};

export const subscribeChatUnreadTotal = (handler) => {
    const listener = (event) => handler(event.detail?.total ?? 0);
    window.addEventListener(UNREAD_TOTAL_EVENT, listener);
    handler(unreadTotal);
    return () => window.removeEventListener(UNREAD_TOTAL_EVENT, listener);
};
