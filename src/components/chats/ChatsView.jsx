import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './chatsView.css';
import {
    getMyChats,
    getChatSummary,
    postChatTextMessageResilient,
    postChatAttachmentResilient,
    loadMergedChatMessages,
    getChatIdList,
    markPeerChatsRead,
    patchChatMessage,
    extractChatPageItems,
    dedupeChatsByPeer,
} from '../../services/chatApi.js';
import { filterMyRequests, postStudentDecision, buildStudentDecisionBody, extractRequestRows, resolveRequestId, postRequestTuDecision } from '../../services/requestApi.js';
import {
    canStudentDecideRequest,
    canTuDecideRequest,
    buildTuDecisionBody,
    matchRequestToChat,
    TU_REASON_CODES,
} from '../../utils/requestFlow.js';
import { formatApiUserMessage } from '../../utils/apiErrors.js';
import { getStudentById } from '../../services/studentApi.js';
import { fetchRecruiterForView, getStudentMe, getRecruiterMe } from '../../services/getApi.js';
import {
    derivePeerMetaFromMessages,
    formatRecruiterPeerMeta,
    formatStudentPeerMeta,
    isGenericPeerTitle,
    resolveRecruiterIdForChat,
    resolveStudentIdForChat,
} from '../../utils/chatPeerMeta.js';
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

const tuCongratsStorageKey = (requestId) => `resume:tu-congrats:${requestId}`;

const hasSeenTuCongrats = (requestId) => {
    try {
        return sessionStorage.getItem(tuCongratsStorageKey(requestId)) === '1';
    } catch {
        return false;
    }
};

const markTuCongratsSeen = (requestId) => {
    try {
        sessionStorage.setItem(tuCongratsStorageKey(requestId), '1');
    } catch {
        /* empty */
    }
};

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
    const [pendingRequest, setPendingRequest] = useState(null);
    const [pendingMode, setPendingMode] = useState(null);
    const [pendingBusy, setPendingBusy] = useState(false);
    const [pendingComment, setPendingComment] = useState('');
    const [tuReasonCode, setTuReasonCode] = useState('NOT_A_FIT');
    const [tuCongrats, setTuCongrats] = useState(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const draftInputRef = useRef(null);
    const messagesScrollRef = useRef(null);
    const requestPanelRef = useRef(null);
    const [requestPanelOffScreen, setRequestPanelOffScreen] = useState(false);
    const titleCache = useRef(new Map());
    const subtitleCache = useRef(new Map());
    const avatarCache = useRef(new Map());
    const deepLinkApplied = useRef(false);
    const messagesLoadGen = useRef(0);
    const chatAliasRef = useRef({});
    const studentCacheRef = useRef(new Map());
    const recruiterCacheRef = useRef(new Map());
    const myRequestsRef = useRef([]);
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

    const focusDraftInput = useCallback(() => {
        requestAnimationFrame(() => {
            const input = draftInputRef.current;
            if (!input || input.disabled) return;
            try {
                input.focus({ preventScroll: true });
            } catch {
                input.focus();
            }
        });
    }, []);

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

    const enrichChatMeta = useCallback(async (chat, party, requests = []) => {
        const key = chat.id;
        const cachedTitle = titleCache.current.get(key);
        if (cachedTitle && !isGenericPeerTitle(cachedTitle)) {
            return {
                title: cachedTitle,
                subtitle: subtitleCache.current.get(key) || '',
                avatarUrl: avatarCache.current.get(key) || null,
            };
        }

        const chatIds = new Set(getChatIdList(chat, chat.id).map(String));
        let title = '';
        let subtitle = '';
        let avatarUrl = null;

        const tryStudent = async (studentId) => {
            const resolvedId = studentId || resolveStudentIdForChat(chat, chatIds, requests);
            if (!resolvedId) return false;
            let student = studentCacheRef.current.get(resolvedId);
            if (!student) {
                student = await getStudentById(resolvedId);
                if (student) studentCacheRef.current.set(resolvedId, student);
            }
            const meta = formatStudentPeerMeta(student);
            if (!meta) return false;
            title = meta.title;
            subtitle = meta.subtitle;
            avatarUrl = getImageUrl(peerImagePath(student));
            return true;
        };

        const tryRecruiter = async (recruiterId) => {
            const resolvedId = recruiterId || resolveRecruiterIdForChat(chat, chatIds, requests);
            if (!resolvedId) return false;
            let recruiter = recruiterCacheRef.current.get(resolvedId);
            if (!recruiter) {
                recruiter = await fetchRecruiterForView(resolvedId);
                if (recruiter) recruiterCacheRef.current.set(resolvedId, recruiter);
            }
            const meta = formatRecruiterPeerMeta(recruiter);
            if (!meta) return false;
            title = meta.title;
            subtitle = meta.subtitle;
            avatarUrl = getImageUrl(peerImagePath(recruiter));
            return true;
        };

        try {
            if (party?.role === 'recruiter') {
                await tryStudent(chat.studentId);
            } else if (party?.role === 'student') {
                await tryRecruiter(chat.recruiterId);
            } else {
                if (!(await tryStudent(chat.studentId))) {
                    await tryRecruiter(chat.recruiterId);
                }
            }
        } catch {
            /* пробуем запасной вариант ниже */
        }

        if (!title) {
            if (party?.role === 'student') title = 'Работодатель';
            else if (party?.role === 'recruiter') title = 'Студент';
            else title = chat.studentId ? 'Студент' : chat.recruiterId ? 'Работодатель' : 'Собеседник';
        }

        if (!isGenericPeerTitle(title)) {
            titleCache.current.set(key, title);
            subtitleCache.current.set(key, subtitle);
            avatarCache.current.set(key, avatarUrl);
        }
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
            const role = party?.role || null;

            let myRequests = [];
            try {
                const reqRes = await filterMyRequests({}, 0, 100);
                myRequests = extractRequestRows(reqRes);
                myRequestsRef.current = myRequests;
                if (role === 'student') {
                    const recruiterIds = [
                        ...new Set(myRequests.map((r) => r.recruiterId).filter(Boolean)),
                    ];
                    await Promise.all(
                        recruiterIds.map(async (recruiterId) => {
                            if (recruiterCacheRef.current.has(recruiterId)) return;
                            const recruiter = await fetchRecruiterForView(recruiterId);
                            if (recruiter) recruiterCacheRef.current.set(recruiterId, recruiter);
                        }),
                    );
                }
            } catch {
                myRequestsRef.current = [];
            }

            const res = await getMyChats(0, 50);
            const rows = extractChatPageItems(res);
            const { chats: deduped, aliasToCanonical } = dedupeChatsByPeer(rows, role);
            chatAliasRef.current = aliasToCanonical;
            setChats(deduped);
            const nextTitles = {};
            const nextSubtitles = {};
            const nextAvatars = {};
            await Promise.all(
                deduped.map(async (c) => {
                    const { title, subtitle, avatarUrl } = await enrichChatMeta(
                        c,
                        party,
                        myRequests,
                    );
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

    const applyPeerMetaFromMessages = useCallback(
        (chatId, rows) => {
            if (!chatId || !rows?.length || me?.role !== 'student') return;
            const currentTitle = titleCache.current.get(chatId) || titles[chatId];
            if (!isGenericPeerTitle(currentTitle)) return;
            const derived = derivePeerMetaFromMessages(rows, isMine);
            if (!derived?.title) return;
            titleCache.current.set(chatId, derived.title);
            subtitleCache.current.set(chatId, derived.subtitle || '');
            setTitles((prev) => ({ ...prev, [chatId]: derived.title }));
            setSubtitles((prev) => ({ ...prev, [chatId]: derived.subtitle || '' }));
        },
        [isMine, me?.role, titles],
    );

    const loadMessages = useCallback(
        async (chatRow, fallbackId) => {
            const chatId = chatRow?.id ?? fallbackId;
            if (!chatId) return;
            setLoadingMessages(true);
            setSendError('');
            try {
                const rows = await loadMergedChatMessages(chatRow, fallbackId, 0, 50);
                setMessages(rows);
                applyPeerMetaFromMessages(chatId, rows);
                const last = rows.filter((m) => !isMessageDeleted(m)).pop();
                if (last?.id) {
                    try {
                        const row = chatRow?.id ? chatRow : { id: chatId };
                        await markPeerChatsRead(row, last.id);
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
        [refreshSummary, clearChatUnread, applyPeerMetaFromMessages],
    );

    const selectedChat = useMemo(
        () => chats.find((c) => String(c.id) === String(selectedId)) || null,
        [chats, selectedId],
    );

    const loadPendingRequest = useCallback(async () => {
        if (!selectedId || !me?.role) {
            setPendingRequest(null);
            setPendingMode(null);
            return null;
        }
        const chatRow =
            chatsRef.current.find((c) => String(c.id) === String(selectedId)) ||
            selectedChat ||
            { id: selectedId };
        const chatIds = new Set(getChatIdList(chatRow, selectedId).map(String));
        const peerRecruiterId = chatRow?.recruiterId ?? selectedChat?.recruiterId;
        const peerStudentId = chatRow?.studentId ?? selectedChat?.studentId;
        const res = await filterMyRequests({}, 0, 100);
        const items = extractRequestRows(res);
        const matched = items.filter((r) =>
            matchRequestToChat(r, chatRow, chatIds, peerRecruiterId, peerStudentId),
        );
        const studentAction =
            me.role === 'student'
                ? matched.find((r) => canStudentDecideRequest(r.result) && resolveRequestId(r))
                : null;
        const tuAction = matched.find(
            (r) => canTuDecideRequest(r.result, me.role) && resolveRequestId(r),
        );
        let request = null;
        let mode = null;
        if (studentAction) {
            request = studentAction;
            mode = 'student_decision';
        } else if (tuAction) {
            request = tuAction;
            mode = 'tu_decision';
        } else if (matched[0]) {
            request = matched[0];
        }
        const resolvedId = request ? resolveRequestId(request) : null;
        setPendingRequest(resolvedId ? request : null);
        setPendingMode(mode);
        if (!mode) {
            setPendingComment('');
            setTuReasonCode('NOT_A_FIT');
        }
        if (resolvedId && request?.result === 'SUCCESS' && !hasSeenTuCongrats(resolvedId)) {
            markTuCongratsSeen(resolvedId);
            setTuCongrats({ variant: 'success', requestId: resolvedId });
        }
        return { request: resolvedId ? request : null, mode };
    }, [selectedId, selectedChat, me?.role]);

    const closeTuCongrats = () => {
        if (tuCongrats?.requestId) {
            markTuCongratsSeen(tuCongrats.requestId);
        }
        setTuCongrats(null);
    };

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
            setPendingRequest(null);
            setPendingMode(null);
            return;
        }
        const gen = ++messagesLoadGen.current;
        const chatRow =
            chatsRef.current.find((c) => String(c.id) === String(selectedId)) ||
            { id: selectedId };
        (async () => {
            let skipMessages = false;
            try {
                const { mode } = await loadPendingRequest();
                skipMessages = mode === 'student_decision' && me?.role === 'student';
            } catch {
                /* панель заявки не критична для загрузки ленты */
            }
            if (messagesLoadGen.current !== gen) return;
            if (skipMessages) {
                setMessages([]);
                setSendError('');
                setLoadingMessages(false);
                refreshSummary(selectedId);
                return;
            }
            await loadMessages(chatRow, selectedId);
            if (messagesLoadGen.current !== gen) return;
            refreshSummary(selectedId);
        })();
    }, [selectedId, loadMessages, loadPendingRequest, refreshSummary, me?.role]);

    useEffect(() => {
        if (!selectedId) {
            setPendingRequest(null);
            setPendingMode(null);
            setPendingComment('');
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                await loadPendingRequest();
            } catch {
                if (!cancelled) {
                    setPendingRequest(null);
                    setPendingMode(null);
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [selectedId, loadPendingRequest]);

    useEffect(() => {
        if (!selectedId) return undefined;
        const poll = window.setInterval(() => {
            refreshSummary(selectedId);
            loadPendingRequest().catch(() => {});
        }, 4000);
        return () => window.clearInterval(poll);
    }, [selectedId, refreshSummary, loadPendingRequest]);

    useEffect(() => {
        const ids = new Set();
        for (const c of chatsRef.current) {
            for (const id of getChatIdList(c, c.id)) ids.add(String(id));
        }
        if (!ids.size) return undefined;

        const handleWsMessage = (chatId, message) => {
            if (!message?.id) return;
            const canonical = chatAliasRef.current[String(chatId)] || String(chatId);
            const isOpen = String(selectedIdRef.current) === String(canonical);
            const preview = message.body || message.attachmentStorageName || 'Вложение';

            if (isOpen) {
                mergeMessage(message);
                updateChatPreview(canonical, preview, message.createdAt);
                if (!isMine(message) && message.id) {
                    const chatRow =
                        chatsRef.current.find((c) => String(c.id) === String(canonical)) ||
                        { id: canonical };
                    markPeerChatsRead(chatRow, message.id).catch(() => {});
                    clearChatUnread(canonical);
                    refreshSummary(canonical);
                }
            } else {
                updateChatPreview(canonical, preview, message.createdAt);
                if (!isMine(message)) {
                    setChats((prev) =>
                        prev.map((c) => {
                            if (String(c.id) !== String(canonical)) return c;
                            const key = String(canonical);
                            if (readChatRowsRef.current.has(key)) return c;
                            return {
                                ...c,
                                unreadCount: (Number(c.unreadCount) || 0) + 1,
                                lastMessagePreview: preview,
                                lastActivityAt: message.createdAt || c.lastActivityAt,
                            };
                        }),
                    );
                }
            }
        };

        const unsubscribes = [...ids].map((chatId) =>
            subscribeChatTopic(chatId, (message) => handleWsMessage(chatId, message)),
        );
        return () => unsubscribes.forEach((fn) => fn?.());
    }, [chats, isMine, refreshSummary, clearChatUnread]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const panel = requestPanelRef.current;
        const root = messagesScrollRef.current;
        if (!panel || !root || !pendingMode) {
            setRequestPanelOffScreen(false);
            return undefined;
        }

        const observer = new IntersectionObserver(
            ([entry]) => setRequestPanelOffScreen(!entry.isIntersecting),
            { root, threshold: 0.15, rootMargin: '0px' },
        );
        observer.observe(panel);
        return () => {
            observer.disconnect();
            setRequestPanelOffScreen(false);
        };
    }, [selectedId, pendingMode, pendingRequest?.id, messages.length, loadingMessages]);

    const scrollToRequestPanel = useCallback(() => {
        requestPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

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
            const chatRow = selectedChat || { id: selectedId };
            const created = await postChatTextMessageResilient(chatRow, selectedId, text);
            const message = created?.id ? created : created?.data ?? created;
            setDraft('');
            if (message?.id) mergeMessage(message);
            else await loadMessages(chatRow, selectedId);
            updateChatPreview(selectedId, text, created?.createdAt);
        } catch (err) {
            setSendError(err.message || 'Не отправилось');
        } finally {
            setSending(false);
            focusDraftInput();
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
            else {
                const chatRow = selectedChat || { id: selectedId };
                await loadMessages(chatRow, selectedId);
            }
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
            const chatRow = selectedChat || { id: selectedId };
            const created = await postChatAttachmentResilient(chatRow, selectedId, file, draft.trim());
            const message = created?.id ? created : created?.data ?? created;
            setDraft('');
            if (message?.id) mergeMessage(message);
            else await loadMessages(chatRow, selectedId);
            const preview = (message?.body || created?.body) || file.name || 'Вложение';
            updateChatPreview(selectedId, preview, created?.createdAt);
        } catch (err) {
            setSendError(err.message || 'Не удалось отправить файл');
        } finally {
            setSending(false);
            focusDraftInput();
        }
    };

    const handleRequestDecision = async (accepted) => {
        const requestId = resolveRequestId(pendingRequest);
        if (requestId == null || pendingBusy || pendingMode !== 'student_decision') return;
        setPendingBusy(true);
        setSendError('');
        try {
            await postStudentDecision(
                requestId,
                buildStudentDecisionBody(accepted, pendingComment),
            );
            setPendingRequest(null);
            setPendingMode(null);
            setPendingComment('');
            const chatRow = selectedChat || { id: selectedId };
            await loadMessages(chatRow, selectedId);
            await loadChats();
        } catch (err) {
            setSendError(formatApiUserMessage(err) || 'Не удалось обработать заявку');
        } finally {
            setPendingBusy(false);
        }
    };

    const handleTuDecision = async (accepted) => {
        const requestId = resolveRequestId(pendingRequest);
        if (requestId == null || pendingBusy || pendingMode !== 'tu_decision') return;
        setPendingBusy(true);
        setSendError('');
        try {
            await postRequestTuDecision(
                requestId,
                buildTuDecisionBody(accepted, tuReasonCode, pendingComment),
            );
            setPendingComment('');
            setTuReasonCode('NOT_A_FIT');
            const chatRow = selectedChat || { id: selectedId };
            await loadMessages(chatRow, selectedId);
            await loadChats();
            if (accepted) {
                const res = await filterMyRequests({}, 0, 100);
                const items = extractRequestRows(res);
                const updated = items.find((r) => resolveRequestId(r) === requestId);
                const variant = updated?.result === 'SUCCESS' ? 'success' : 'confirmed';
                setTuCongrats({ variant, requestId });
                if (variant === 'success') {
                    markTuCongratsSeen(requestId);
                }
            }
            await loadPendingRequest();
        } catch (err) {
            setSendError(formatApiUserMessage(err) || 'Не удалось обработать решение по ТУ');
        } finally {
            setPendingBusy(false);
        }
    };

    const composerLocked =
        Boolean(pendingMode === 'student_decision' && me?.role === 'student');
    const requestPanelJumpLabel =
        pendingMode === 'tu_decision' ? '↑ К решению по ТУ' : '↑ К заявке';

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

                <div className="chatsView__messages" ref={messagesScrollRef}>
                    {!selectedId && (
                        <div className="chatsView__empty">Выберите чат, чтобы открыть переписку</div>
                    )}
                    {selectedId && pendingMode && requestPanelOffScreen ? (
                        <button
                            type="button"
                            className="chatsView__requestPanelJump"
                            onClick={scrollToRequestPanel}
                            aria-label={requestPanelJumpLabel}
                        >
                            {requestPanelJumpLabel}
                        </button>
                    ) : null}
                    {selectedId && pendingRequest && pendingMode === 'student_decision' && me?.role === 'student' ? (
                        <div
                            ref={requestPanelRef}
                            className="chatsView__requestPanel"
                            role="region"
                            aria-label="Входящая заявка"
                        >
                            <p className="chatsView__requestPanelTitle">Работодатель отправил заявку</p>
                            <p className="chatsView__requestPanelHint">
                                Примите заявку, чтобы начать переписку. Отклонение закроет этот диалог.
                            </p>
                            <textarea
                                className="chatsView__requestPanelComment"
                                rows={2}
                                placeholder="Комментарий (необязательно)"
                                value={pendingComment}
                                onChange={(e) => setPendingComment(e.target.value)}
                                disabled={pendingBusy}
                            />
                            <div className="chatsView__requestPanelActions">
                                <button
                                    type="button"
                                    className="chatsView__requestPanelBtn chatsView__requestPanelBtn--accept"
                                    disabled={pendingBusy}
                                    onClick={() => handleRequestDecision(true)}
                                >
                                    Принять
                                </button>
                                <button
                                    type="button"
                                    className="chatsView__requestPanelBtn chatsView__requestPanelBtn--reject"
                                    disabled={pendingBusy}
                                    onClick={() => handleRequestDecision(false)}
                                >
                                    Отклонить
                                </button>
                            </div>
                        </div>
                    ) : null}
                    {selectedId && pendingRequest && pendingMode === 'tu_decision' ? (
                        <div
                            ref={requestPanelRef}
                            className="chatsView__requestPanel"
                            role="region"
                            aria-label="Решение по ТУ"
                        >
                            <p className="chatsView__requestPanelTitle">Техническое собеседование</p>
                            <p className="chatsView__requestPanelHint">
                                {me?.role === 'student'
                                    ? 'Подтвердите, что вы прошли техническое собеседование с работодателем, или укажите причину отказа.'
                                    : 'Подтвердите, что студент прошёл техническое собеседование, или укажите причину отказа.'}
                            </p>
                            <label className="chatsView__requestPanelField">
                                <span>Причина отказа</span>
                                <select
                                    className="chatsView__requestPanelSelect"
                                    value={tuReasonCode}
                                    onChange={(e) => setTuReasonCode(e.target.value)}
                                    disabled={pendingBusy}
                                >
                                    {TU_REASON_CODES.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <textarea
                                className="chatsView__requestPanelComment"
                                rows={2}
                                placeholder="Комментарий (необязательно)"
                                value={pendingComment}
                                onChange={(e) => setPendingComment(e.target.value)}
                                disabled={pendingBusy}
                            />
                            <div className="chatsView__requestPanelActions">
                                <button
                                    type="button"
                                    className="chatsView__requestPanelBtn chatsView__requestPanelBtn--accept"
                                    disabled={pendingBusy}
                                    onClick={() => handleTuDecision(true)}
                                >
                                    Подтвердить ТУ
                                </button>
                                <button
                                    type="button"
                                    className="chatsView__requestPanelBtn chatsView__requestPanelBtn--reject"
                                    disabled={pendingBusy}
                                    onClick={() => handleTuDecision(false)}
                                >
                                    Отказ по ТУ
                                </button>
                            </div>
                        </div>
                    ) : null}
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
                                disabled={!selectedId || sending || composerLocked}
                                aria-label="Прикрепить файл"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                ＋
                            </button>
                            <input
                                ref={draftInputRef}
                                type="text"
                                className="chatsView__textInput"
                                placeholder={selectedId ? 'Напишите сообщение...' : 'Сначала выберите чат'}
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                disabled={!selectedId || composerLocked}
                                maxLength={16000}
                                autoComplete="off"
                            />
                        </div>
                        <button
                            type="submit"
                            className="chatsView__sendBtn"
                            disabled={!selectedId || sending || !draft.trim() || composerLocked}
                            aria-label="Отправить"
                        >
                            ↑
                        </button>
                    </form>
                </footer>
            </main>

            {tuCongrats ? (
                <div
                    className="chatsView__tuCongratsOverlay"
                    role="presentation"
                    onClick={closeTuCongrats}
                >
                    <div
                        className="chatsView__tuCongratsModal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="tu-congrats-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="chatsView__tuCongratsIcon" aria-hidden="true">
                            {tuCongrats.variant === 'success' ? '🎉' : '✓'}
                        </div>
                        <h3 id="tu-congrats-title" className="chatsView__tuCongratsTitle">
                            {tuCongrats.variant === 'success' ? 'Поздравляем!' : 'ТУ подтверждено'}
                        </h3>
                        <p className="chatsView__tuCongratsText">
                            {tuCongrats.variant === 'success'
                                ? 'Заявка успешно завершена. Желаем удачи в дальнейшем сотрудничестве!'
                                : 'Вы подтвердили прохождение технического собеседования.'}
                        </p>
                        <button
                            type="button"
                            className="chatsView__tuCongratsBtn"
                            onClick={closeTuCongrats}
                        >
                            Отлично
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default ChatsView;
