import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './chatsView.css';
import {
    getMyChats,
    getChatMessages,
    getChatSummary,
    postChatTextMessage,
    postChatAttachment,
    markPeerChatsRead,
    patchChatMessage,
    extractChatPageItems,
    dedupeChatsByPeer,
} from '../../services/chatApi.js';
import { getStudentById } from '../../services/studentApi.js';
import { getRecruiterById, getStudentMe, getRecruiterMe } from '../../services/getApi.js';
import { AUTH_USERNAME_KEY } from '../../services/authApi.js';
import { getImageUrl } from '../../config/api.js';
import { disconnectChatWebSocket, subscribeChatTopic } from '../../services/chatWebSocket.js';
import {
    extractPeerReadMessageId,
    getOutgoingReadStatus,
    readStatusLabel,
} from '../../utils/chatReadStatus.js';
import { useMediaQuery } from '../../utils/useMediaQuery.js';

const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

const formatListTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const today = new Date();
    const start = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    if (start(d) === start(today)) return formatTime(iso);
    const y = new Date(today);
    y.setDate(y.getDate() - 1);
    if (start(d) === start(y)) return 'Вчера';
    const diffDays = Math.floor((start(today) - start(d)) / 86400000);
    if (diffDays < 7) return `${diffDays} дн. назад`;
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
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

const avatarTone = (index) => `chatsView__avatar--tone${index % 3}`;

const peerImagePath = (entity) =>
    entity?.imagePath || entity?.image || entity?.photo || entity?.avatar || null;

const ChatAvatar = ({ title, imageUrl, toneClass, size = 'md' }) => {
    const [broken, setBroken] = useState(false);

    useEffect(() => {
        setBroken(false);
    }, [imageUrl]);

    const sizeClass = size === 'sm' ? ' chatsView__avatar--sm' : size === 'lg' ? ' chatsView__avatar--lg' : '';
    if (imageUrl && !broken) {
        return (
            <div className={`chatsView__avatar chatsView__avatar--photo${sizeClass}`} aria-hidden>
                <img src={imageUrl} alt="" loading="lazy" decoding="async" onError={() => setBroken(true)} />
            </div>
        );
    }
    return (
        <div className={`chatsView__avatar ${toneClass}${sizeClass}`} aria-hidden>
            {initials(title)}
        </div>
    );
};

const isMessageDeleted = (m) => Boolean(m.deletedAt || m.deletedByAdmin);

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

const ChatsView = () => {
    const [searchParams] = useSearchParams();
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [loadingList, setLoadingList] = useState(false);
    const [listError, setListError] = useState('');
    const [chats, setChats] = useState([]);
    const [titles, setTitles] = useState({});
    const [subtitles, setSubtitles] = useState({});
    const [avatars, setAvatars] = useState({});
    const [me, setMe] = useState(null);
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sendError, setSendError] = useState('');
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editDraft, setEditDraft] = useState('');
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const titleCache = useRef(new Map());
    const subtitleCache = useRef(new Map());
    const avatarCache = useRef(new Map());
    const deepLinkApplied = useRef(false);
    const messagesLoadGen = useRef(0);
    const chatAliasRef = useRef({});
    const studentCacheRef = useRef(new Map());
    const recruiterCacheRef = useRef(new Map());
    const chatsRef = useRef([]);
    const selectedIdRef = useRef(null);
    const readChatRowsRef = useRef(new Set());

    useEffect(() => {
        chatsRef.current = chats;
    }, [chats]);

    useEffect(() => {
        selectedIdRef.current = selectedId;
    }, [selectedId]);

    const clearChatUnread = useCallback((chatId) => {
        const key = String(chatId);
        readChatRowsRef.current.add(key);
        setChats((prev) =>
            prev.map((c) => (String(c.id) === key ? { ...c, unreadCount: 0 } : c)),
        );
    }, []);

    const myUsername = useMemo(() => {
        try {
            return (localStorage.getItem(AUTH_USERNAME_KEY) || '').trim();
        } catch {
            return '';
        }
    }, []);

    const isMine = useCallback(
        (m) => {
            if (m.messageKind !== 'USER') return false;
            if (myUsername && m.authorUsername && m.authorUsername === myUsername) return true;
            const myUserId = me?.profile?.userId || me?.profile?.id;
            if (myUserId && m.authorUserId && String(m.authorUserId) === String(myUserId)) return true;
            return false;
        },
        [myUsername, me],
    );

    const mergeMessage = (created) => {
        setMessages((prev) => {
            const id = created?.id;
            const base = id ? prev.filter((m) => m.id !== id) : [...prev];
            const next = [...base, created].filter(Boolean);
            return next.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        });
    };

    const updateChatPreview = (chatId, text, at) => {
        setChats((prev) => {
            const i = prev.findIndex((c) => String(c.id) === String(chatId));
            if (i < 0) return prev;
            const copy = [...prev];
            copy[i] = {
                ...copy[i],
                lastMessagePreview: text,
                lastActivityAt: at || new Date().toISOString(),
                unreadCount: 0,
            };
            return copy;
        });
    };

    const refreshSummary = useCallback(async (chatId) => {
        if (!chatId) return;
        try {
            const summary = await getChatSummary(chatId);
            if (!summary || (summary.id == null && summary.unreadCount == null)) return;
            setChats((prev) => {
                const i = prev.findIndex((c) => String(c.id) === String(chatId));
                if (i < 0) return prev;
                const prevRow = prev[i];
                const merged = { ...prevRow, ...summary };
                const key = String(chatId);
                const isOpen = String(selectedIdRef.current) === key;
                const wasRead = readChatRowsRef.current.has(key);
                if (isOpen || wasRead) {
                    if (!isOpen && Number(summary.unreadCount) > 0) {
                        readChatRowsRef.current.delete(key);
                    } else {
                        merged.unreadCount = 0;
                    }
                }
                const same =
                    prevRow.unreadCount === merged.unreadCount &&
                    prevRow.lastMessagePreview === merged.lastMessagePreview &&
                    prevRow.lastActivityAt === merged.lastActivityAt;
                if (same) return prev;
                const copy = [...prev];
                copy[i] = merged;
                return copy;
            });
        } catch {
            /* не критично */
        }
    }, []);

    const enrichChatMeta = useCallback(async (chat, party) => {
        const key = chat.id;
        if (titleCache.current.has(key)) {
            return {
                title: titleCache.current.get(key),
                subtitle: subtitleCache.current.get(key) || '',
                avatarUrl: avatarCache.current.get(key) || null,
            };
        }
        let title = 'Диалог';
        let subtitle = '';
        let avatarUrl = null;
        try {
            if (party?.role === 'recruiter' && chat.studentId) {
                let s = studentCacheRef.current.get(chat.studentId);
                if (!s) {
                    s = await getStudentById(chat.studentId);
                    studentCacheRef.current.set(chat.studentId, s);
                }
                title = `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Студент';
                subtitle = s.speciality || s.profession || '';
                avatarUrl = getImageUrl(peerImagePath(s));
            } else if (party?.role === 'student' && chat.recruiterId) {
                let r = recruiterCacheRef.current.get(chat.recruiterId);
                if (!r) {
                    r = await getRecruiterById(chat.recruiterId);
                    recruiterCacheRef.current.set(chat.recruiterId, r);
                }
                const person = `${r.firstName || ''} ${r.lastName || ''}`.trim();
                title = r.companyName || person || 'Рекрутер';
                subtitle = person && r.companyName ? person : '';
                avatarUrl = getImageUrl(peerImagePath(r));
            }
        } catch {
            title = 'Диалог';
        }
        titleCache.current.set(key, title);
        subtitleCache.current.set(key, subtitle);
        avatarCache.current.set(key, avatarUrl);
        return { title, subtitle, avatarUrl };
    }, []);

    const loadChats = useCallback(async () => {
        setLoadingList(true);
        setListError('');
        titleCache.current.clear();
        subtitleCache.current.clear();
        avatarCache.current.clear();
        studentCacheRef.current.clear();
        recruiterCacheRef.current.clear();
        try {
            const party = await resolveMe();
            setMe(party);
            const res = await getMyChats(0, 50);
            const rows = extractChatPageItems(res);
            const role = party?.role || null;
            const { chats: deduped, aliasToCanonical } = dedupeChatsByPeer(rows, role);
            chatAliasRef.current = aliasToCanonical;
            setChats(deduped);
            const nextTitles = {};
            const nextSubtitles = {};
            const nextAvatars = {};
            await Promise.all(
                deduped.map(async (c) => {
                    const { title, subtitle, avatarUrl } = await enrichChatMeta(c, party);
                    nextTitles[c.id] = title;
                    nextSubtitles[c.id] = subtitle;
                    if (avatarUrl) nextAvatars[c.id] = avatarUrl;
                }),
            );
            setTitles(nextTitles);
            setSubtitles(nextSubtitles);
            setAvatars(nextAvatars);
        } catch (e) {
            setListError(e.message || 'Не удалось загрузить чаты');
            setChats([]);
        } finally {
            setLoadingList(false);
        }
    }, [enrichChatMeta]);

    const loadMessages = useCallback(
        async (chatId) => {
            if (!chatId) return;
            setLoadingMessages(true);
            setSendError('');
            try {
                const res = await getChatMessages(chatId, 0, 50);
                const rows = extractChatPageItems(res);
                setMessages(rows);
                const last = rows.filter((m) => !isMessageDeleted(m)).pop();
                if (last?.id) {
                    try {
                        const chatRow =
                            chatsRef.current.find((c) => String(c.id) === String(chatId)) ||
                            { id: chatId };
                        await markPeerChatsRead(chatRow, last.id);
                        clearChatUnread(chatId);
                        await refreshSummary(chatId);
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
        },
        [refreshSummary, clearChatUnread],
    );

    const selectedChat = useMemo(
        () => chats.find((c) => String(c.id) === String(selectedId)) || null,
        [chats, selectedId],
    );

    const peerReadMessageId = useMemo(
        () => extractPeerReadMessageId(selectedChat, me?.role),
        [selectedChat, me?.role],
    );

    useEffect(() => {
        loadChats();
    }, [loadChats]);

    useEffect(() => {
        const rawChatId = searchParams.get('chatId');
        if (!rawChatId || deepLinkApplied.current || chats.length === 0) return;
        const chatId = chatAliasRef.current[rawChatId] || rawChatId;
        if (chats.some((c) => String(c.id) === String(chatId))) {
            setSelectedId(chatId);
            deepLinkApplied.current = true;
        }
    }, [searchParams, chats]);

    useEffect(() => {
        if (!selectedId) {
            setMessages([]);
            return;
        }
        const gen = ++messagesLoadGen.current;
        loadMessages(selectedId).then(() => {
            if (messagesLoadGen.current !== gen) return;
            refreshSummary(selectedId);
        });
    }, [selectedId, loadMessages, refreshSummary]);

    useEffect(() => {
        if (!selectedId) return undefined;
        const poll = window.setInterval(() => {
            refreshSummary(selectedId);
        }, 8000);
        return () => window.clearInterval(poll);
    }, [selectedId, refreshSummary]);

    useEffect(() => {
        if (!selectedId) return undefined;

        const unsub = subscribeChatTopic(selectedId, (message) => {
            if (!message?.id) return;
            mergeMessage(message);
            const preview = message.body || message.attachmentStorageName || '';
            updateChatPreview(selectedId, preview, message.createdAt);
            if (!isMine(message) && message.id) {
                const chatRow =
                    chatsRef.current.find((c) => String(c.id) === String(selectedId)) ||
                    { id: selectedId };
                markPeerChatsRead(chatRow, message.id).catch(() => {});
                clearChatUnread(selectedId);
                refreshSummary(selectedId);
            }
        });

        return unsub;
    }, [selectedId, isMine, refreshSummary, clearChatUnread]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => () => disconnectChatWebSocket(), []);

    const filteredChats = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return chats;
        return chats.filter((c) => {
            const title = (titles[c.id] || '').toLowerCase();
            const sub = (subtitles[c.id] || '').toLowerCase();
            const prev = (c.lastMessagePreview || '').toLowerCase();
            return title.includes(q) || sub.includes(q) || prev.includes(q);
        });
    }, [chats, search, titles, subtitles]);

    const handleSend = async (e) => {
        e.preventDefault();
        const text = draft.trim();
        if (!text || !selectedId || sending) return;
        setSending(true);
        setSendError('');
        try {
            const created = await postChatTextMessage(selectedId, text);
            const message = created?.id ? created : created?.data ?? created;
            setDraft('');
            if (message?.id) mergeMessage(message);
            else await loadMessages(selectedId);
            updateChatPreview(selectedId, text, created?.createdAt);
        } catch (err) {
            setSendError(err.message || 'Не отправилось');
        } finally {
            setSending(false);
        }
    };

    const startEditMessage = (message) => {
        setEditingMessageId(message.id);
        setEditDraft(message.body || '');
    };

    const cancelEditMessage = () => {
        setEditingMessageId(null);
        setEditDraft('');
    };

    const saveEditMessage = async () => {
        if (!selectedId || !editingMessageId || sending) return;
        const text = editDraft.trim();
        if (!text) return;
        setSending(true);
        setSendError('');
        try {
            const updated = await patchChatMessage(selectedId, editingMessageId, text);
            const message = updated?.id ? updated : updated?.data ?? updated;
            if (message?.id) mergeMessage(message);
            else await loadMessages(selectedId);
            cancelEditMessage();
        } catch (err) {
            setSendError(err.message || 'Не удалось изменить сообщение');
        } finally {
            setSending(false);
        }
    };

    const handleAttachment = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file || !selectedId || sending) return;
        setSending(true);
        setSendError('');
        try {
            const created = await postChatAttachment(selectedId, file, draft.trim());
            const message = created?.id ? created : created?.data ?? created;
            setDraft('');
            if (message?.id) mergeMessage(message);
            else await loadMessages(selectedId);
            const preview = (message?.body || created?.body) || file.name || 'Вложение';
            updateChatPreview(selectedId, preview, created?.createdAt);
        } catch (err) {
            setSendError(err.message || 'Не удалось отправить файл');
        } finally {
            setSending(false);
        }
    };

    const activeTitle = selectedId ? titles[selectedId] || '…' : 'Выберите чат';
    const activeSubtitle = selectedId ? subtitles[selectedId] : '';

    const showResumeBtn =
        me?.role === 'recruiter' && selectedChat?.studentId != null && selectedChat.studentId !== '';

    const activeAvatarUrl = selectedId ? avatars[selectedId] : null;
    const isChatOpen = isMobile && Boolean(selectedId);

    return (
        <div
            className={`chatsView__container${isChatOpen ? ' chatsView__container--chatOpen' : ''}`}
            role="application"
            aria-label="Чаты"
        >
            <aside className="chatsView__dialogs">
                <div className="chatsView__dialogsHeader">
                    <nav className="chatsView__pageNav" aria-label="Навигация">
                        <Link to="/students" className="chatsView__glassBtn">
                            ← Назад
                        </Link>
                        <span className="chatsView__pageNavTitle">Чаты</span>
                        <Link to="/settings" className="chatsView__glassBtn">
                            Профиль
                        </Link>
                    </nav>
                    <input
                        type="search"
                        className="chatsView__searchInput"
                        placeholder="Поиск по диалогам"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoComplete="off"
                    />
                </div>
                <div className="chatsView__dialogsList">
                    {loadingList && <div className="chatsView__muted">Загрузка…</div>}
                    {listError && <div className="chatsView__error">{listError}</div>}
                    {!loadingList && !listError && filteredChats.length === 0 && (
                        <div className="chatsView__empty">Пока нет диалогов</div>
                    )}
                    {filteredChats.map((c, index) => {
                        const active = String(c.id) === String(selectedId);
                        const title = titles[c.id] || '…';
                        const subtitle = subtitles[c.id] || '';
                        const preview = c.lastMessagePreview || '';
                        const hasUnread = c.unreadCount > 0;
                        let meta = hasUnread && preview ? preview : subtitle || preview;
                        if (c._mergedCount > 1) {
                            const suffix = ` · ${c._mergedCount} заявки`;
                            meta = meta ? `${meta}${suffix}` : suffix.trim();
                        }
                        return (
                            <button
                                key={c.id}
                                type="button"
                                className={`chatsView__dialogItem${active ? ' chatsView__dialogItem--active' : ''}${hasUnread ? ' chatsView__dialogItem--unread' : ''}`}
                                onClick={() => setSelectedId(c.id)}
                            >
                                <div className="chatsView__avatarWrap">
                                    <ChatAvatar
                                        title={title}
                                        imageUrl={avatars[c.id]}
                                        toneClass={avatarTone(index)}
                                    />
                                </div>
                                <div className="chatsView__dialogInfo">
                                    <div className="chatsView__dialogNameRow">
                                        <span className="chatsView__dialogName">{title}</span>
                                        <span className="chatsView__dialogTime">
                                            {formatListTime(c.lastActivityAt)}
                                        </span>
                                    </div>
                                    <div className="chatsView__dialogMetaRow">
                                        <span className="chatsView__dialogMeta">{meta}</span>
                                        {hasUnread ? (
                                            <span className="chatsView__unread">{c.unreadCount}</span>
                                        ) : null}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </aside>

            <main className="chatsView__main">
                <header className="chatsView__chatHeader">
                    {isMobile && selectedId ? (
                        <button
                            type="button"
                            className="chatsView__backBtn"
                            onClick={() => setSelectedId(null)}
                        >
                            ← Чаты
                        </button>
                    ) : null}
                    <div className="chatsView__headerUser">
                        <div className="chatsView__headerUserRow">
                            {selectedId ? (
                                <ChatAvatar
                                    title={activeTitle}
                                    imageUrl={activeAvatarUrl}
                                    toneClass={avatarTone(0)}
                                    size="sm"
                                />
                            ) : null}
                            <div>
                                <h3>{activeTitle}</h3>
                                {activeSubtitle ? (
                                    <div className="chatsView__headerStatus">{activeSubtitle}</div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                    {showResumeBtn ? (
                        <Link
                            to={`/studentsResume/${selectedChat.studentId}`}
                            className="chatsView__resumeBtn"
                        >
                            Резюме
                        </Link>
                    ) : null}
                </header>

                <div className="chatsView__messages">
                    {!selectedId && (
                        <div className="chatsView__empty">Выберите чат, чтобы открыть переписку</div>
                    )}
                    {selectedId && loadingMessages && (
                        <div className="chatsView__muted">Загрузка сообщений…</div>
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
                                        {showSep ? <div className="chatsView__dateSep">{day}</div> : null}
                                        <div className="chatsView__systemMsg">
                                            {m.body || m.systemEvent || 'Системное сообщение'}
                                        </div>
                                    </React.Fragment>
                                );
                            }
                            const mine = isMine(m);
                            const readStatus = getOutgoingReadStatus(
                                m,
                                messages,
                                peerReadMessageId,
                                isMine,
                            );
                            const attachUrl = !isMessageDeleted(m)
                                ? getImageUrl(m.attachmentStorageName)
                                : null;
                            const isEditing = editingMessageId === m.id;
                            return (
                                <React.Fragment key={m.id}>
                                    {showSep ? <div className="chatsView__dateSep">{day}</div> : null}
                                    <div
                                        className={`chatsView__messageRow${mine ? ' chatsView__messageRow--out' : ' chatsView__messageRow--in'}`}
                                    >
                                        {!mine ? (
                                            <div className="chatsView__msgAvatarWrap">
                                                <ChatAvatar
                                                    title={activeTitle}
                                                    imageUrl={activeAvatarUrl}
                                                    toneClass={avatarTone(0)}
                                                    size="sm"
                                                />
                                            </div>
                                        ) : null}
                                        <div className="chatsView__messageStack">
                                            <div
                                                className={`chatsView__bubble${isMessageDeleted(m) ? ' chatsView__bubble--deleted' : ''}${attachUrl && !m.body ? ' chatsView__bubble--file' : ''}`}
                                            >
                                                {isMessageDeleted(m) ? (
                                                    'Сообщение удалено'
                                                ) : isEditing ? (
                                                    <div className="chatsView__editBox">
                                                        <textarea
                                                            className="chatsView__editInput"
                                                            value={editDraft}
                                                            onChange={(e) => setEditDraft(e.target.value)}
                                                            rows={3}
                                                        />
                                                        <div className="chatsView__editActions">
                                                            <button type="button" onClick={saveEditMessage} disabled={sending}>
                                                                Сохранить
                                                            </button>
                                                            <button type="button" onClick={cancelEditMessage}>
                                                                Отмена
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {m.body}
                                                        {attachUrl ? (
                                                            <a
                                                                href={attachUrl}
                                                                className="chatsView__attachment"
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                {m.attachmentStorageName || 'Вложение'}
                                                            </a>
                                                        ) : null}
                                                    </>
                                                )}
                                            </div>
                                            {!isMessageDeleted(m) && !isEditing ? (
                                                <div className="chatsView__messageStatus">
                                                    <span className="chatsView__messageTime">
                                                        {formatTime(m.createdAt)}
                                                    </span>
                                                    {mine && readStatus ? (
                                                        <span
                                                            className={`chatsView__readStatus chatsView__readStatus--${readStatus}`}
                                                            title={readStatusLabel(readStatus)}
                                                            aria-label={readStatusLabel(readStatus)}
                                                        >
                                                            {readStatus === 'read' ? '✓✓' : '✓'}
                                                        </span>
                                                    ) : null}
                                                    {m.editedAt ? (
                                                        <span className="chatsView__editedTag">изменено</span>
                                                    ) : null}
                                                    {mine && m.messageKind === 'USER' ? (
                                                        <button
                                                            type="button"
                                                            className="chatsView__editBtn"
                                                            onClick={() => startEditMessage(m)}
                                                        >
                                                            Изменить
                                                        </button>
                                                    ) : null}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    <div ref={messagesEndRef} />
                </div>

                <footer className="chatsView__composer">
                    {sendError ? <div className="chatsView__composerError">{sendError}</div> : null}
                    <form className="chatsView__inputPanel" onSubmit={handleSend}>
                        <input
                            ref={fileInputRef}
                            type="file"
                            hidden
                            onChange={handleAttachment}
                        />
                        <div className="chatsView__inputWrapper">
                            <button
                                type="button"
                                className="chatsView__attachBtn"
                                disabled={!selectedId || sending}
                                aria-label="Прикрепить файл"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                ＋
                            </button>
                            <input
                                type="text"
                                className="chatsView__textInput"
                                placeholder={selectedId ? 'Напишите сообщение...' : 'Сначала выберите чат'}
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                disabled={!selectedId || sending}
                                maxLength={16000}
                                autoComplete="off"
                            />
                        </div>
                        <button
                            type="submit"
                            className="chatsView__sendBtn"
                            disabled={!selectedId || sending || !draft.trim()}
                            aria-label="Отправить"
                        >
                            ↑
                        </button>
                    </form>
                </footer>
            </main>
        </div>
    );
};

export default ChatsView;
