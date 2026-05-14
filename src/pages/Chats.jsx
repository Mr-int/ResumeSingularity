import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '../components/header/Header.jsx';
import Footer from '../components/footer/Footer.jsx';
import { fetchChatMessages, fetchChatsPage } from '../services/chatApi.js';
import '../components/chats/chats.css';

const newLocalMessageId = () =>
    typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const formatTime = (iso) => {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        return d.toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch {
        return '';
    }
};

const Chats = () => {
    const [chats, setChats] = useState([]);
    const [chatsLoading, setChatsLoading] = useState(true);
    const [selectedId, setSelectedId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [draft, setDraft] = useState('');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setChatsLoading(true);
            try {
                const page = await fetchChatsPage({ page: 0, size: 20 });
                const list = page.data ?? page.content ?? [];
                if (!cancelled) {
                    setChats(list);
                    if (list.length > 0) {
                        setSelectedId((prev) => prev ?? list[0].chatId);
                    }
                }
            } catch {
                if (!cancelled) setChats([]);
            } finally {
                if (!cancelled) setChatsLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!selectedId) {
            setMessages([]);
            return;
        }
        let cancelled = false;
        (async () => {
            setMessagesLoading(true);
            try {
                const page = await fetchChatMessages(selectedId, { page: 0, size: 50 });
                const list = page.data ?? page.content ?? [];
                if (!cancelled) setMessages(list.map((m) => ({ ...m })));
            } catch {
                if (!cancelled) setMessages([]);
            } finally {
                if (!cancelled) setMessagesLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [selectedId]);

    const selectedChat = useMemo(
        () => chats.find((c) => c.chatId === selectedId) || null,
        [chats, selectedId]
    );

    const sendLocal = useCallback(() => {
        const text = draft.trim();
        if (!text || !selectedId) return;
        const msg = {
            messageId: newLocalMessageId(),
            body: text,
            sentAt: new Date().toISOString(),
            outgoing: true,
        };
        setMessages((prev) => [...prev, msg]);
        setDraft('');
        setChats((prev) =>
            prev.map((c) =>
                c.chatId === selectedId
                    ? { ...c, lastMessagePreview: text, unreadCount: 0, updatedAt: msg.sentAt }
                    : c
            )
        );
    }, [draft, selectedId]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendLocal();
        }
    };

    return (
        <div className="chatsPage">
            <Header />
            <main className="chatsPage__main">
                <h1 className="chatsPage__title">Чаты</h1>
                <p className="chatsPage__subtitle">Демо-данные. Позже здесь будет API GET /chat и история сообщений.</p>

                {chatsLoading ? (
                    <div className="chatsPage__loading">Загрузка…</div>
                ) : chats.length === 0 ? (
                    <div className="chatsPage__empty">Нет чатов</div>
                ) : (
                    <div className="chatsPage__layout">
                        <aside className="chatsPage__list" aria-label="Список чатов">
                            <div className="chatsPage__listHeader">Все чаты</div>
                            <div className="chatsPage__listScroll">
                                {chats.map((c) => (
                                    <button
                                        key={c.chatId}
                                        type="button"
                                        className={`chatsPage__chatRow ${c.chatId === selectedId ? 'chatsPage__chatRow--active' : ''}`}
                                        onClick={() => setSelectedId(c.chatId)}
                                    >
                                        <div className="chatsPage__chatRowTop">
                                            <span className="chatsPage__peerName">{c.peerName}</span>
                                            <span
                                                className={`chatsPage__badge ${c.unreadCount > 0 ? '' : 'chatsPage__badge--hidden'}`}
                                                aria-hidden={c.unreadCount === 0}
                                            >
                                                {c.unreadCount > 0 ? c.unreadCount : '0'}
                                            </span>
                                        </div>
                                        <div className="chatsPage__preview">{c.lastMessagePreview}</div>
                                    </button>
                                ))}
                            </div>
                        </aside>

                        <section className="chatsPage__thread" aria-label="Переписка">
                            <div className="chatsPage__threadHeader">
                                {selectedChat ? selectedChat.peerName : 'Чат'}
                            </div>
                            {messagesLoading ? (
                                <div className="chatsPage__loading">Загрузка сообщений…</div>
                            ) : (
                                <div className="chatsPage__messages">
                                    {messages.map((m) => (
                                        <div
                                            key={m.messageId}
                                            className={`chatsPage__bubble ${m.outgoing ? 'chatsPage__bubble--out' : 'chatsPage__bubble--in'}`}
                                        >
                                            {m.body}
                                            <span className="chatsPage__bubbleMeta">{formatTime(m.sentAt)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="chatsPage__composer">
                                <input
                                    type="text"
                                    className="chatsPage__input"
                                    placeholder="Написать сообщение…"
                                    value={draft}
                                    onChange={(e) => setDraft(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={!selectedId}
                                    autoComplete="off"
                                />
                                <button type="button" className="chatsPage__send" onClick={sendLocal} disabled={!draft.trim() || !selectedId}>
                                    Отправить
                                </button>
                            </div>
                        </section>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default Chats;
