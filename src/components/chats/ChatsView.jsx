import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './chatsView.css';
import {
    getMyChats,
    getChatMessages,
    getChatSummary,
    postChatTextMessage,
    postChatAttachment,
    markChatRead,
    extractChatPageItems,
    dedupeChatsByPeer,
} from '../../services/chatApi.js';
import { getStudentById } from '../../services/studentApi.js';
import { getRecruiterById, getStudentMe, getRecruiterMe } from '../../services/getApi.js';
import { AUTH_USERNAME_KEY, getAuthRole } from '../../services/authApi.js';
import { getImageUrl } from '../../config/api.js';
import { filterMyRequests, postStudentDecision, postTuDecision } from '../../services/requestApi.js';
import {
    disconnectChatWebSocket,
    ensureChatWebSocket,
    subscribeChatTopic,
} from '../../services/chatWebSocket.js';

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

const MESSAGING_ALLOWED = new Set(['STUDENT_CONFIRMED', 'SUCCESS', 'RECRUITER_CONFIRMED']);
const TU_PHASE = new Set(['STUDENT_CONFIRMED', 'RECRUITER_CONFIRMED']);
const canStudentDecide = (result) =>
    result === 'WAITING' || result === 'EXPECTATION' || result === 'CREATION';

const POLL_FALLBACK_MS = 60000;

const SYSTEM_EVENTS_REFRESH_REQUEST = new Set([
    'REQUEST_SENT',
    'STUDENT_ACCEPTED',
    'STUDENT_REJECTED',
    'TU_CONFIRMED',
    'TU_REJECTED',
    'VACANCY_APPLICATION_ACCEPTED',
]);

const messageSignature = (m) =>
    `${m.id}|${m.body}|${m.createdAt}|${m.messageKind}|${m.deletedAt || ''}`;

const mergeMessages = (prev, rows) => {
    const byId = new Map((prev || []).map((m) => [m.id, m]));
    let changed = false;
    for (const m of rows || []) {
        if (!m?.id) continue;
        const existing = byId.get(m.id);
        if (!existing || messageSignature(existing) !== messageSignature(m)) {
            byId.set(m.id, m);
            changed = true;
        }
    }
    if (!changed) return prev;
    return [...byId.values()].sort(
        (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
    );
};

const chatsEqual = (a, b) => {
    if (a === b) return true;
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((chat, i) => {
        const other = b[i];
        return (
            String(chat.id) === String(other.id) &&
            chat.lastMessagePreview === other.lastMessagePreview &&
            chat.unreadCount === other.unreadCount &&
            chat.lastActivityAt === other.lastActivityAt
        );
    });
};

const requestEqual = (a, b) =>
    a === b ||
    (a &&
        b &&
        a.id === b.id &&
        a.result === b.result &&
        String(a.appChatId) === String(b.appChatId));

/** Заявка по chatId, объединённым id или паре рекрутер↔студент. */
const pickChatRequest = (rows, chatRow, chatId) => {
    if (!Array.isArray(rows) || rows.length === 0) return null;
    const chatIds = new Set(
        [chatId, ...(chatRow?._mergedIds || [])].filter(Boolean).map(String),
    );
    const matches = rows.filter((r) => {
        if (chatIds.has(String(r.appChatId))) return true;
        if (chatRow?.studentId && chatRow?.recruiterId) {
            return (
                String(r.studentId) === String(chatRow.studentId) &&
                String(r.recruiterId) === String(chatRow.recruiterId)
            );
        }
        return false;
    });
    if (!matches.length) return null;
    const accepted = matches.find((r) => MESSAGING_ALLOWED.has(r.result));
    if (accepted) return accepted;
    return matches.sort((a, b) => (b.id || 0) - (a.id || 0))[0];
};

const TU_REASON_OPTIONS = [
    { value: 'NOT_A_FIT', label: 'Не подходит' },
    { value: 'NO_RESPONSE', label: 'Нет ответа' },
    { value: 'CANDIDATE_DECLINED', label: 'Кандидат отказался' },
    { value: 'EMPLOYER_DECLINED', label: 'Работодатель отказался' },
    { value: 'OTHER', label: 'Другое' },
];

const isMessageDeleted = (m) => Boolean(m.deletedAt || m.deletedByAdmin);

async function resolveMe() {
    const authRole = getAuthRole();
    if (authRole === 'STUDENT') {
        try {
            const profile = await getStudentMe();
            return { role: 'student', profile };
        } catch {
            /* empty */
        }
    } else if (authRole === 'RECRUITER' || authRole === 'USER') {
        try {
            const profile = await getRecruiterMe();
            return { role: 'recruiter', profile };
        } catch {
            /* empty */
        }
    }
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
    const [loadingList, setLoadingList] = useState(true);
    const [listError, setListError] = useState('');
    const [chats, setChats] = useState([]);
    const [titles, setTitles] = useState({});
    const [subtitles, setSubtitles] = useState({});
    const [me, setMe] = useState(null);
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sendError, setSendError] = useState('');
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const [chatRequest, setChatRequest] = useState(null);
    const [requestBusy, setRequestBusy] = useState(false);
    const [decisionComment, setDecisionComment] = useState('');
    const [tuReason, setTuReason] = useState('NOT_A_FIT');
    const [tuComment, setTuComment] = useState('');
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const titleCache = useRef(new Map());
    const subtitleCache = useRef(new Map());
    const deepLinkApplied = useRef(false);
    const messagesLoadGen = useRef(0);
    const chatAliasRef = useRef({});
    const studentCacheRef = useRef(new Map());
    const recruiterCacheRef = useRef(new Map());
    const chatsRef = useRef([]);
    const selectedIdRef = useRef(null);
    const meRef = useRef(null);
    const lastScrolledMessageIdRef = useRef(null);
    const pollInFlightRef = useRef(false);
    const wsConnectedRef = useRef(false);

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
            if (!summary?.id) return;
            setChats((prev) => {
                const i = prev.findIndex((c) => String(c.id) === String(chatId));
                if (i < 0) return prev;
                const prevRow = prev[i];
                const merged = { ...prevRow, ...summary };
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
            };
        }
        let title = 'Диалог';
        let subtitle = '';
        try {
            if (party?.role === 'recruiter' && chat.studentId) {
                let s = studentCacheRef.current.get(chat.studentId);
                if (!s) {
                    s = await getStudentById(chat.studentId);
                    studentCacheRef.current.set(chat.studentId, s);
                }
                title = `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Студент';
                subtitle = s.speciality || s.profession || '';
            } else if (party?.role === 'student' && chat.recruiterId) {
                let r = recruiterCacheRef.current.get(chat.recruiterId);
                if (!r) {
                    r = await getRecruiterById(chat.recruiterId);
                    recruiterCacheRef.current.set(chat.recruiterId, r);
                }
                const person = `${r.firstName || ''} ${r.lastName || ''}`.trim();
                title = r.companyName || person || 'Рекрутер';
                subtitle = person && r.companyName ? person : '';
            }
        } catch {
            title = 'Диалог';
        }
        titleCache.current.set(key, title);
        subtitleCache.current.set(key, subtitle);
        return { title, subtitle };
    }, []);

    const loadChats = useCallback(async ({ quiet = false } = {}) => {
        if (!quiet) {
            setLoadingList(true);
            setListError('');
            titleCache.current.clear();
            subtitleCache.current.clear();
            studentCacheRef.current.clear();
            recruiterCacheRef.current.clear();
        }
        try {
            const party = quiet
                ? meRef.current ?? (await resolveMe())
                : await resolveMe();
            if (party) {
                meRef.current = party;
                if (!quiet) setMe(party);
            }
            const res = await getMyChats(0, 50);
            const rows = extractChatPageItems(res);
            const role = party?.role || null;
            const { chats: deduped, aliasToCanonical } = dedupeChatsByPeer(rows, role);
            chatAliasRef.current = aliasToCanonical;
            setChats((prev) => (chatsEqual(prev, deduped) ? prev : deduped));
            if (!quiet) setLoadingList(false);

            void Promise.all(
                deduped.map(async (c) => {
                    if (quiet && titleCache.current.has(c.id)) return;
                    const { title, subtitle } = await enrichChatMeta(c, party);
                    setTitles((prev) =>
                        prev[c.id] === title ? prev : { ...prev, [c.id]: title },
                    );
                    setSubtitles((prev) =>
                        prev[c.id] === subtitle ? prev : { ...prev, [c.id]: subtitle },
                    );
                }),
            );
        } catch (e) {
            if (!quiet) {
                setListError(e.message || 'Не удалось загрузить чаты');
                setChats([]);
                setLoadingList(false);
            }
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
                        await markChatRead(chatId, last.id);
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
        [refreshSummary],
    );

    const selectedChat = useMemo(
        () => chats.find((c) => String(c.id) === String(selectedId)) || null,
        [chats, selectedId],
    );

    useEffect(() => {
        chatsRef.current = chats;
    }, [chats]);

    useEffect(() => {
        selectedIdRef.current = selectedId;
    }, [selectedId]);

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

    const loadChatRequest = useCallback(async (chatId, chatRow = null) => {
        if (!chatId) {
            setChatRequest(null);
            return null;
        }
        try {
            const res = await filterMyRequests({}, 0, 50);
            const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res?.content) ? res.content : [];
            const match = pickChatRequest(rows, chatRow, chatId);
            setChatRequest((prev) => (requestEqual(prev, match) ? prev : match || null));
            return match || null;
        } catch {
            setChatRequest(null);
            return null;
        }
    }, []);

    const refreshMessagesQuiet = useCallback(async (chatId) => {
        if (!chatId) return;
        try {
            const res = await getChatMessages(chatId, 0, 50);
            const rows = extractChatPageItems(res);
            setMessages((prev) => mergeMessages(prev, rows));
        } catch {
            /* фоновое обновление */
        }
    }, []);

    const refreshActiveChat = useCallback(async () => {
        const chatId = selectedIdRef.current;
        if (!chatId || pollInFlightRef.current) return;
        if (document.visibilityState !== 'visible') return;

        pollInFlightRef.current = true;
        const chatRow =
            chatsRef.current.find((c) => String(c.id) === String(chatId)) || null;
        try {
            await Promise.all([
                refreshMessagesQuiet(chatId),
                loadChatRequest(chatId, chatRow),
                refreshSummary(chatId),
            ]);
        } finally {
            pollInFlightRef.current = false;
        }
    }, [refreshMessagesQuiet, loadChatRequest, refreshSummary]);

    useEffect(() => {
        if (!selectedId) {
            setMessages([]);
            setChatRequest(null);
            lastScrolledMessageIdRef.current = null;
            return;
        }
        const gen = ++messagesLoadGen.current;
        const chatRow = chatsRef.current.find((c) => String(c.id) === String(selectedId)) || null;
        loadMessages(selectedId).then(() => {
            if (messagesLoadGen.current !== gen) return;
            refreshSummary(selectedId);
        });
        loadChatRequest(selectedId, chatRow);
        setDecisionComment('');
        setTuComment('');
    }, [selectedId, loadMessages, refreshSummary, loadChatRequest]);

    useEffect(() => {
        ensureChatWebSocket((online) => {
            wsConnectedRef.current = online;
        });
        return () => disconnectChatWebSocket();
    }, []);

    useEffect(() => {
        if (!selectedId) return undefined;

        const chatRow =
            chatsRef.current.find((c) => String(c.id) === String(selectedId)) || null;
        const chatIds = [
            ...new Set([selectedId, ...(chatRow?._mergedIds || [])].filter(Boolean).map(String)),
        ];

        const handleWsMessage = (msg) => {
            if (!msg?.id) return;
            setMessages((prev) => mergeMessages(prev, [msg]));
            const preview = msg.body || msg.systemEvent || '';
            const previewChatId = msg.chatId || selectedIdRef.current;
            if (preview && previewChatId) {
                updateChatPreview(previewChatId, preview, msg.createdAt);
            }
            if (
                msg.messageKind === 'SYSTEM' &&
                SYSTEM_EVENTS_REFRESH_REQUEST.has(msg.systemEvent)
            ) {
                const row =
                    chatsRef.current.find(
                        (c) => String(c.id) === String(selectedIdRef.current),
                    ) || null;
                void loadChatRequest(selectedIdRef.current, row);
            }
            if (msg.chatId) {
                void refreshSummary(msg.chatId);
            }
        };

        const unsubs = chatIds.map((id) => subscribeChatTopic(id, handleWsMessage));

        return () => {
            unsubs.forEach((unsub) => unsub());
        };
    }, [selectedId, loadChatRequest, refreshSummary]);

    useEffect(() => {
        if (!selectedId) return undefined;

        const onVisible = () => {
            if (document.visibilityState === 'visible') {
                void refreshActiveChat();
            }
        };

        const fallbackTimer = window.setInterval(() => {
            if (!wsConnectedRef.current && document.visibilityState === 'visible') {
                void refreshActiveChat();
            }
        }, POLL_FALLBACK_MS);

        document.addEventListener('visibilitychange', onVisible);

        return () => {
            window.clearInterval(fallbackTimer);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [selectedId, refreshActiveChat]);

    const messagingAllowed = Boolean(
        chatRequest && MESSAGING_ALLOWED.has(chatRequest.result),
    );
    const showStudentDecision =
        me?.role === 'student' && chatRequest && canStudentDecide(chatRequest.result);
    const showTuPanel = chatRequest && TU_PHASE.has(chatRequest.result);

    const handleStudentDecision = async (accept) => {
        if (!chatRequest?.id) return;
        setRequestBusy(true);
        setSendError('');
        try {
            await postStudentDecision(chatRequest.id, {
                accept,
                comment: decisionComment.trim() || undefined,
            });
            const chatRow = chats.find((c) => String(c.id) === String(selectedId)) || null;
            await loadChatRequest(selectedId, chatRow);
            await loadMessages(selectedId);
        } catch (err) {
            setSendError(err.message || 'Не удалось отправить ответ');
        } finally {
            setRequestBusy(false);
        }
    };

    const handleTuDecision = async (accept) => {
        if (!chatRequest?.id) return;
        setRequestBusy(true);
        setSendError('');
        try {
            await postTuDecision(chatRequest.id, {
                accept,
                reasonCode: accept ? undefined : tuReason,
                comment: accept ? undefined : tuComment.trim() || undefined,
            });
            const chatRow = chats.find((c) => String(c.id) === String(selectedId)) || null;
            await loadChatRequest(selectedId, chatRow);
            await loadMessages(selectedId);
        } catch (err) {
            setSendError(err.message || 'Не удалось отправить решение по ТУ');
        } finally {
            setRequestBusy(false);
        }
    };

    useEffect(() => {
        const visible = messages.filter((m) => !isMessageDeleted(m));
        const last = visible[visible.length - 1];
        if (!last?.id || last.id === lastScrolledMessageIdRef.current) return;
        lastScrolledMessageIdRef.current = last.id;
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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

    return (
        <div className="chatsView__container" role="application" aria-label="Чаты">
            <aside className="chatsView__dialogs">
                <div className="chatsView__dialogsHeader">
                    <nav className="chatsView__pageNav" aria-label="Навигация">
                        <Link to="/students" className="chatsView__pageNavLink">
                            ← Каталог
                        </Link>
                        <span className="chatsView__pageNavTitle">Чаты</span>
                        <Link to="/settings" className="chatsView__pageNavLink">
                            Настройки
                        </Link>
                    </nav>
                    <input
                        type="search"
                        className="chatsView__searchInput"
                        placeholder="Поиск диалогов..."
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
                        let meta = subtitles[c.id] || c.lastMessagePreview || '';
                        if (c._mergedCount > 1) {
                            const suffix = ` · ${c._mergedCount} заявки`;
                            meta = meta ? `${meta}${suffix}` : suffix.trim();
                        }
                        return (
                            <button
                                key={c.id}
                                type="button"
                                className={`chatsView__dialogItem${active ? ' chatsView__dialogItem--active' : ''}`}
                                onClick={() => setSelectedId(c.id)}
                            >
                                <div className="chatsView__avatarWrap">
                                    <div className={`chatsView__avatar ${avatarTone(index)}`} aria-hidden>
                                        {initials(title)}
                                    </div>
                                </div>
                                <div className="chatsView__dialogInfo">
                                    <div className="chatsView__dialogNameRow">
                                        <span className="chatsView__dialogName">{title}</span>
                                        <span className="chatsView__dialogTime">
                                            {formatListTime(c.lastActivityAt)}
                                            {c.unreadCount > 0 ? (
                                                <span className="chatsView__unread">{c.unreadCount}</span>
                                            ) : null}
                                        </span>
                                    </div>
                                    <div className="chatsView__dialogMeta">{meta}</div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </aside>

            <main className="chatsView__main">
                <header className="chatsView__chatHeader">
                    <div className="chatsView__headerUser">
                        <h3>{activeTitle}</h3>
                        {activeSubtitle ? (
                            <div className="chatsView__headerStatus">{activeSubtitle}</div>
                        ) : null}
                    </div>
                    {showResumeBtn ? (
                        <Link
                            to={`/studentsResume/${selectedChat.studentId}`}
                            className="chatsView__resumeBtn"
                        >
                            Смотреть резюме
                        </Link>
                    ) : null}
                </header>

                <div className="chatsView__messages">
                    {selectedId && showStudentDecision ? (
                        <div className="chatsView__actionPanel" role="region" aria-label="Решение по заявке">
                            <p className="chatsView__actionTitle">Заявка ожидает вашего ответа</p>
                            <textarea
                                className="chatsView__actionInput"
                                rows={2}
                                placeholder="Комментарий (необязательно)"
                                value={decisionComment}
                                onChange={(e) => setDecisionComment(e.target.value)}
                            />
                            <div className="chatsView__actionBtns">
                                <button
                                    type="button"
                                    className="chatsView__actionBtn chatsView__actionBtn--ok"
                                    disabled={requestBusy}
                                    onClick={() => handleStudentDecision(true)}
                                >
                                    Принять
                                </button>
                                <button
                                    type="button"
                                    className="chatsView__actionBtn"
                                    disabled={requestBusy}
                                    onClick={() => handleStudentDecision(false)}
                                >
                                    Отклонить
                                </button>
                            </div>
                        </div>
                    ) : null}
                    {selectedId && showTuPanel ? (
                        <div className="chatsView__actionPanel" role="region" aria-label="Подтверждение ТУ">
                            <p className="chatsView__actionTitle">Подтвердите участие (ТУ) по заявке</p>
                            <div className="chatsView__actionBtns">
                                <button
                                    type="button"
                                    className="chatsView__actionBtn chatsView__actionBtn--ok"
                                    disabled={requestBusy}
                                    onClick={() => handleTuDecision(true)}
                                >
                                    Подтвердить ТУ
                                </button>
                            </div>
                            <label className="chatsView__actionLabel">
                                Причина отказа
                                <select
                                    value={tuReason}
                                    onChange={(e) => setTuReason(e.target.value)}
                                    className="chatsView__actionSelect"
                                >
                                    {TU_REASON_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <textarea
                                className="chatsView__actionInput"
                                rows={2}
                                placeholder="Комментарий к отказу"
                                value={tuComment}
                                onChange={(e) => setTuComment(e.target.value)}
                            />
                            <button
                                type="button"
                                className="chatsView__actionBtn"
                                disabled={requestBusy}
                                onClick={() => handleTuDecision(false)}
                            >
                                Отклонить ТУ
                            </button>
                        </div>
                    ) : null}
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
                            const attachUrl = !isMessageDeleted(m)
                                ? getImageUrl(m.attachmentStorageName)
                                : null;
                            return (
                                <React.Fragment key={m.id}>
                                    {showSep ? <div className="chatsView__dateSep">{day}</div> : null}
                                    <div
                                        className={`chatsView__message${mine ? ' chatsView__message--out' : ' chatsView__message--in'}`}
                                    >
                                        <div
                                            className={`chatsView__bubble${isMessageDeleted(m) ? ' chatsView__bubble--deleted' : ''}`}
                                        >
                                            {isMessageDeleted(m) ? (
                                                'Сообщение удалено'
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
                                        <span className="chatsView__msgTime">
                                            {formatTime(m.createdAt)}
                                            {m.editedAt && !isMessageDeleted(m) ? ' · изм.' : ''}
                                        </span>
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    <div ref={messagesEndRef} />
                </div>

                <footer className="chatsView__composer">
                    {sendError ? <div className="chatsView__composerError">{sendError}</div> : null}
                    {selectedId && chatRequest && !messagingAllowed ? (
                        <p className="chatsView__composerHint">
                            {canStudentDecide(chatRequest.result)
                                ? 'Ожидается решение студента по заявке.'
                                : 'Переписка откроется после принятия заявки и подтверждения этапов.'}
                        </p>
                    ) : null}
                    <form className="chatsView__inputWrap" onSubmit={handleSend}>
                        <input
                            ref={fileInputRef}
                            type="file"
                            hidden
                            onChange={handleAttachment}
                        />
                        <button
                            type="button"
                            className="chatsView__attachBtn"
                            disabled={!selectedId || sending || !messagingAllowed}
                            aria-label="Прикрепить файл"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            📎
                        </button>
                        <input
                            type="text"
                            className="chatsView__textInput"
                            placeholder={
                                !selectedId
                                    ? 'Сначала выберите чат'
                                    : messagingAllowed
                                      ? 'Написать сообщение...'
                                      : 'Переписка пока недоступна'
                            }
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            disabled={!selectedId || sending || !messagingAllowed}
                            maxLength={16000}
                            autoComplete="off"
                        />
                        <button
                            type="submit"
                            className="chatsView__sendBtn"
                            disabled={!selectedId || sending || !draft.trim() || !messagingAllowed}
                            aria-label="Отправить"
                        >
                            ➔
                        </button>
                    </form>
                </footer>
            </main>
        </div>
    );
};

export default ChatsView;
