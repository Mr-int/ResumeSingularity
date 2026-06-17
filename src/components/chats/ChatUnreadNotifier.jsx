import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    dedupeChatsByPeer,
    extractChatPageItems,
    getMyChats,
} from '../../services/chatApi.js';
import { getAuthMe, isAuthenticated } from '../../services/authApi.js';
import { subscribeUserInbox } from '../../services/chatWebSocket.js';
import { INBOX_REFRESH_TYPES } from '../../utils/tuPhase.js';
import {
    getActiveChatId,
    setChatUnreadTotal,
    subscribeActiveChatId,
} from '../../utils/chatUnreadBus.js';
import './chatUnreadNotifier.css';

const TOAST_MS = 8000;

const resolveRole = async () => {
    try {
        const me = await getAuthMe();
        return me?.role?.toLowerCase() || null;
    } catch {
        return null;
    }
};

const ChatUnreadNotifier = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [toast, setToast] = useState(null);
    const toastTimerRef = useRef(null);
    const aliasRef = useRef({});
    const chatsRef = useRef([]);
    const activeChatRef = useRef(getActiveChatId());

    const hideToast = useCallback(() => {
        if (toastTimerRef.current) {
            window.clearTimeout(toastTimerRef.current);
            toastTimerRef.current = null;
        }
        setToast(null);
    }, []);

    const showToast = useCallback((payload) => {
        setToast(payload);
        if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = window.setTimeout(() => {
            setToast(null);
            toastTimerRef.current = null;
        }, TOAST_MS);
    }, []);

    const syncUnreadTotal = useCallback((rows) => {
        const total = rows.reduce((sum, row) => sum + (Number(row.unreadCount) || 0), 0);
        setChatUnreadTotal(total);
    }, []);

    const loadChats = useCallback(async () => {
        if (!isAuthenticated()) {
            chatsRef.current = [];
            setChatUnreadTotal(0);
            return [];
        }
        try {
            const role = await resolveRole();
            const res = await getMyChats(0, 50);
            const raw = extractChatPageItems(res);
            const { chats, aliasToCanonical } = dedupeChatsByPeer(raw, role);
            aliasRef.current = aliasToCanonical;
            chatsRef.current = chats;
            syncUnreadTotal(chats);
            return chats;
        } catch {
            return chatsRef.current;
        }
    }, [syncUnreadTotal]);

    const resolveCanonicalChatId = (rawId) => {
        if (!rawId) return null;
        return aliasRef.current[String(rawId)] || String(rawId);
    };

    const findChatTitle = (chatId) => {
        const row = chatsRef.current.find((c) => String(c.id) === String(chatId));
        if (!row) return 'Новое сообщение';
        return (
            row.studentDisplayName ||
            row.recruiterDisplayName ||
            row.lastMessagePreview ||
            'Новое сообщение'
        );
    };

    const shouldNotify = (chatId) => {
        if (!chatId) return false;
        if (location.pathname !== '/chats') return true;
        const active = activeChatRef.current;
        return !active || String(active) !== String(chatId);
    };

    const handleInboxEvent = useCallback(
        async (event) => {
            const type = event?.type;
            if (!type || !INBOX_REFRESH_TYPES.has(type)) return;

            const chatId = resolveCanonicalChatId(event?.chatId ?? event?.appChatId);
            await loadChats();

            if (type !== 'CHAT_MESSAGE' || !shouldNotify(chatId)) return;

            const preview =
                event?.preview ||
                event?.body ||
                event?.messagePreview ||
                'Новое сообщение';

            showToast({
                chatId,
                title: findChatTitle(chatId),
                preview: String(preview).trim() || 'Новое сообщение',
            });
        },
        [loadChats, location.pathname, showToast],
    );

    useEffect(() => {
        if (!isAuthenticated()) return undefined;
        let cancelled = false;
        let unsubscribe = () => {};

        (async () => {
            await loadChats();
            if (cancelled) return;
            try {
                const session = await getAuthMe();
                if (!session?.id || cancelled) return;
                unsubscribe = subscribeUserInbox(session.id, handleInboxEvent);
            } catch {
                /* optional */
            }
        })();

        const poll = window.setInterval(() => {
            loadChats();
        }, 30_000);

        return () => {
            cancelled = true;
            unsubscribe();
            window.clearInterval(poll);
        };
    }, [loadChats, handleInboxEvent, location.pathname]);

    useEffect(() => {
        return subscribeActiveChatId((chatId) => {
            activeChatRef.current = chatId;
        });
    }, []);

    useEffect(() => () => hideToast(), [hideToast]);

    if (!toast) return null;

    return (
        <div className="chatUnreadToast" role="status" aria-live="polite">
            <button
                type="button"
                className="chatUnreadToast__body"
                onClick={() => {
                    hideToast();
                    if (toast.chatId) {
                        navigate(`/chats?chatId=${encodeURIComponent(toast.chatId)}`);
                    } else {
                        navigate('/chats');
                    }
                }}
            >
                <span className="chatUnreadToast__title">{toast.title}</span>
                <span className="chatUnreadToast__preview">{toast.preview}</span>
            </button>
            <button
                type="button"
                className="chatUnreadToast__close"
                onClick={hideToast}
                aria-label="Закрыть"
            >
                ×
            </button>
        </div>
    );
};

export default ChatUnreadNotifier;
