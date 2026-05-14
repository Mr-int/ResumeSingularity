import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './chatsModal.css';
import { getMyChats, getChatMessages, postChatTextMessage, markChatRead } from '../../services/chatApi.js';
import { getStudentById } from '../../services/studentApi.js';
import { getRecruiterById, getStudentMe, getRecruiterMe } from '../../services/getApi.js';
import { AUTH_USERNAME_KEY } from '../../services/authApi.js';

const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

const formatDayLabel = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const today = new Date();
    const start = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    if (start(d) === start(today)) return 'Сегодня';
    const y = new Date(today);
    y.setDate(y.getDate() - 1);
    if (start(d) === start(y)) return 'Вчера';
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
};

const initials = (name) => {
    const parts = String(name || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
};

async function resolveMe() {
    try {
        const profile = await getStudentMe();
        return { role: 'student', profile };
    } catch {
        /* empty */
    }
    try {
        const profile = await getRecruiterMe();
        return { role: 'recruiter', profile };
    } catch {
        /* empty */
    }
    return null;
}

async function resolveChatTitle(chat, me) {
    if (!me) return 'Диалог';
    try {
        if (me.role === 'recruiter') {
            const s = await getStudentById(chat.studentId);
            const n = `${s.firstName || ''} ${s.lastName || ''}`.trim();
            return n || 'Студент';
        }
        const r = await getRecruiterById(chat.recruiterId);
        const person = `${r.firstName || ''} ${r.lastName || ''}`.trim();
        const company = r.companyName || '';
        if (person && company) return `${person} · ${company}`;
        return company || person || 'Рекрутер';
    } catch {
        return 'Диалог';
    }
}

/** Полноэкранный UI чатов (без модального оверлея). */
const ChatsView = () => {
    const [loadingList, setLoadingList] = useState(false);
    const [listError, setListError] = useState('');
    const [chats, setChats] = useState([]);
    const [titles, setTitles] = useState({});
    const [me, setMe] = useState(null);
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sendError, setSendError] = useState('');
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const titleCache = useRef(new Map());

    const myUsername = useMemo(() => {
        try {
            return (localStorage.getItem(AUTH_USERNAME_KEY) || '').trim();
        } catch {
            return '';
        }
    }, []);

    const loadChats = useCallback(async () => {
        setLoadingList(true);
        setListError('');
        try {
            const party = await resolveMe();
            setMe(party);
            const res = await getMyChats(0, 50);
            const rows = Array.isArray(res?.data) ? res.data : [];
            setChats(rows);
            const nextTitles = {};
            await Promise.all(
                rows.map(async (c) => {
                    const key = c.id;
                    if (titleCache.current.has(key)) {
                        nextTitles[key] = titleCache.current.get(key);
                        return;
                    }
                    const t = await resolveChatTitle(c, party);
                    titleCache.current.set(key, t);
                    nextTitles[key] = t;
                }),
            );
            setTitles(nextTitles);
        } catch (e) {
            setListError(e.message || 'Не удалось загрузить чаты');
            setChats([]);
        } finally {
            setLoadingList(false);
        }
    }, []);

    const loadMessages = useCallback(async (chatId) => {
        if (!chatId) return;
        setLoadingMessages(true);
        setSendError('');
        try {
            const res = await getChatMessages(chatId, 0, 200);
            const rows = Array.isArray(res?.data) ? res.data : [];
            setMessages(rows);
            const last = rows[rows.length - 1];
            if (last?.id) {
                try {
                    await markChatRead(chatId, last.id);
                } catch {
                    /* не критично */
                }
            }
        } catch (e) {
            setSendError(e.message || 'Не удалось загрузить сообщения');
            setMessages([]);
        } finally {
            setLoadingMessages(false);
        }
    }, []);

    const selectedChat = useMemo(
        () => chats.find((c) => c.id === selectedId) || null,
        [chats, selectedId],
    );

    useEffect(() => {
        loadChats();
    }, [loadChats]);

    useEffect(() => {
        if (!selectedId) {
            return;
        }
        loadMessages(selectedId);
    }, [selectedId, loadMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const filteredChats = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return chats;
        return chats.filter((c) => {
            const title = (titles[c.id] || '').toLowerCase();
            const prev = (c.lastMessagePreview || '').toLowerCase();
            return title.includes(q) || prev.includes(q);
        });
    }, [chats, search, titles]);

    const handleSend = async (e) => {
        e.preventDefault();
        const text = draft.trim();
        if (!text || !selectedId || sending) return;
        setSending(true);
        setSendError('');
        try {
            const created = await postChatTextMessage(selectedId, text);
            setDraft('');
            setMessages((prev) => {
                const id = created?.id;
                const base = id ? prev.filter((m) => m.id !== id) : [...prev];
                const next = [...base, created].filter(Boolean);
                return next.sort((a, b) => {
                    const ta = new Date(a.createdAt || 0).getTime();
                    const tb = new Date(b.createdAt || 0).getTime();
                    return ta - tb;
                });
            });
            setChats((prev) => {
                const i = prev.findIndex((c) => c.id === selectedId);
                if (i < 0) return prev;
                const copy = [...prev];
                copy[i] = {
                    ...copy[i],
                    lastMessagePreview: text,
                    lastActivityAt: created?.createdAt || new Date().toISOString(),
                };
                return copy;
            });
        } catch (err) {
            setSendError(err.message || 'Не отправилось');
        } finally {
            setSending(false);
        }
    };

    const activeTitle = selectedId ? titles[selectedId] || '…' : 'Выберите чат';

    return (
        <div className="chatsModal__messenger chatsView" role="application" aria-label="Чаты">
            <aside className="chatsModal__sidebar">
                <div className="chatsModal__sidebarHeader">
                    <div className="chatsModal__userProfile">
                        <div className="chatsModal__avatar chatsModal__avatar--accent" aria-hidden>
                            {me?.role === 'student' ? 'С' : me?.role === 'recruiter' ? 'Р' : '…'}
                        </div>
                        <div className="chatsModal__userMeta">
                            <div className="chatsModal__userName">
                                {me?.role === 'student'
                                    ? 'Студент'
                                    : me?.role === 'recruiter'
                                      ? 'Рекрутер'
                                      : 'Аккаунт'}
                            </div>
                            <div className="chatsModal__userHint">Мои диалоги</div>
                        </div>
                    </div>
                </div>
                <div className="chatsModal__searchBar">
                    <input
                        type="search"
                        className="chatsModal__searchInput"
                        placeholder="Поиск по чатам…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoComplete="off"
                    />
                </div>
                <div className="chatsModal__chatsList">
                    {loadingList && <div className="chatsModal__muted">Загрузка…</div>}
                    {listError && <div className="chatsModal__error">{listError}</div>}
                    {!loadingList && !listError && filteredChats.length === 0 && (
                        <div className="chatsModal__muted">Пока нет диалогов</div>
                    )}
                    {filteredChats.map((c) => {
                        const active = c.id === selectedId;
                        const title = titles[c.id] || '…';
                        return (
                            <button
                                key={c.id}
                                type="button"
                                className={`chatsModal__chatItem${active ? ' chatsModal__chatItem--active' : ''}`}
                                onClick={() => setSelectedId(c.id)}
                            >
                                <div className="chatsModal__chatAvatar" aria-hidden>
                                    {initials(title)}
                                </div>
                                <div className="chatsModal__chatDetails">
                                    <div className="chatsModal__chatTitleRow">
                                        <span className="chatsModal__chatName">{title}</span>
                                        <span className="chatsModal__chatTime">{formatTime(c.lastActivityAt)}</span>
                                    </div>
                                    <div className="chatsModal__chatPreviewRow">
                                        <span className="chatsModal__chatPreview">{c.lastMessagePreview || ' '}</span>
                                        {c.unreadCount > 0 ? (
                                            <span className="chatsModal__unread">{c.unreadCount}</span>
                                        ) : null}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </aside>
            <main className="chatsModal__main">
                <header className="chatsModal__chatHeader">
                    <div className="chatsModal__chatHeaderInfo">
                        <div className="chatsModal__chatAvatar chatsModal__chatAvatar--sm" aria-hidden>
                            {initials(activeTitle)}
                        </div>
                        <div>
                            <div className="chatsModal__chatHeaderTitle">{activeTitle}</div>
                            <div className="chatsModal__chatHeaderSub">
                                {selectedChat ? 'Чат по заявке' : 'Выберите диалог слева'}
                            </div>
                        </div>
                    </div>
                </header>
                <div className="chatsModal__messages">
                    {!selectedId && (
                        <div className="chatsModal__emptyThread">Выберите чат, чтобы открыть переписку</div>
                    )}
                    {selectedId && loadingMessages && (
                        <div className="chatsModal__muted">Загрузка сообщений…</div>
                    )}
                    {selectedId &&
                        !loadingMessages &&
                        messages.map((m, idx) => {
                            const day = formatDayLabel(m.createdAt);
                            const prevDay = idx > 0 ? formatDayLabel(messages[idx - 1].createdAt) : null;
                            const showSep = day && day !== prevDay;
                            if (m.messageKind === 'SYSTEM') {
                                return (
                                    <React.Fragment key={m.id}>
                                        {showSep ? <div className="chatsModal__dateSep">{day}</div> : null}
                                        <div className="chatsModal__systemMsg">
                                            {m.body || m.systemEvent || 'Системное сообщение'}
                                        </div>
                                    </React.Fragment>
                                );
                            }
                            const mine =
                                myUsername &&
                                m.authorUsername &&
                                m.authorUsername === myUsername &&
                                m.messageKind === 'USER';
                            return (
                                <React.Fragment key={m.id}>
                                    {showSep ? <div className="chatsModal__dateSep">{day}</div> : null}
                                    <div
                                        className={`chatsModal__msgRow${mine ? ' chatsModal__msgRow--out' : ' chatsModal__msgRow--in'}`}
                                    >
                                        <div className="chatsModal__bubble">
                                            {!mine && m.authorUsername ? (
                                                <div className="chatsModal__msgAuthor">{m.authorUsername}</div>
                                            ) : null}
                                            <div className="chatsModal__msgBody">{m.body}</div>
                                            <div className="chatsModal__msgTime">{formatTime(m.createdAt)}</div>
                                        </div>
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    <div ref={messagesEndRef} />
                </div>
                <footer className="chatsModal__composer">
                    {sendError ? <div className="chatsModal__composerError">{sendError}</div> : null}
                    <form className="chatsModal__composerInner" onSubmit={handleSend}>
                        <input
                            type="text"
                            className="chatsModal__composerInput"
                            placeholder={selectedId ? 'Напишите сообщение…' : 'Сначала выберите чат'}
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            disabled={!selectedId || sending}
                            maxLength={16000}
                            autoComplete="off"
                        />
                        <button
                            type="submit"
                            className="chatsModal__sendBtn"
                            disabled={!selectedId || sending || !draft.trim()}
                            aria-label="Отправить"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                                <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                            </svg>
                        </button>
                    </form>
                </footer>
            </main>
        </div>
    );
};

export default ChatsView;
