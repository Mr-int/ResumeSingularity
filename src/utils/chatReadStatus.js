const READ_CURSOR_FIELDS = [
    'studentLastReadMessageId',
    'recruiterLastReadMessageId',
    'peerLastReadMessageId',
    'otherPartyLastReadMessageId',
    'counterpartyLastReadMessageId',
    'lastReadMessageId',
    'otherLastReadMessageId',
];

const READ_CURSOR_FIELDS_BY_ROLE = {
    recruiter: [
        'studentLastReadMessageId',
        'peerLastReadMessageId',
        'otherPartyLastReadMessageId',
        'counterpartyLastReadMessageId',
        'otherLastReadMessageId',
        'lastReadMessageId',
    ],
    student: [
        'recruiterLastReadMessageId',
        'peerLastReadMessageId',
        'otherPartyLastReadMessageId',
        'counterpartyLastReadMessageId',
        'otherLastReadMessageId',
        'lastReadMessageId',
    ],
};

export const isChatReadEvent = (payload) => {
    if (!payload || typeof payload !== 'object') return false;
    const type = String(payload.type || payload.eventType || payload.systemEvent || '').toUpperCase();
    if (type.includes('READ') && type !== 'CHAT_MESSAGE') return true;
    return READ_CURSOR_FIELDS.some((key) => payload[key] != null && String(payload[key]).trim());
};

/** UUID из сводки чата — если бэкенд отдаёт курсор прочтения собеседника. */
export const extractPeerReadMessageId = (chatSummary, role) => {
    if (!chatSummary || typeof chatSummary !== 'object') return null;
    const fields = READ_CURSOR_FIELDS_BY_ROLE[role] || READ_CURSOR_FIELDS_BY_ROLE.recruiter;
    for (const key of fields) {
        const value = chatSummary[key];
        if (value != null && String(value).trim()) return String(value);
    }
    return null;
};

const messageIndexById = (messages, messageId) => {
    if (!messageId) return -1;
    return messages.findIndex((m) => String(m.id) === String(messageId));
};

const isUserMessage = (m) => m?.messageKind === 'USER' && !m.deletedAt && !m.deletedByAdmin;

/**
 * @returns {'read' | 'sent' | null} — только для исходящих USER-сообщений
 */
export const getOutgoingReadStatus = (message, messages, peerReadMessageId, isMine) => {
    if (!message || !isMine(message) || !isUserMessage(message)) return null;

    const msgIdx = messageIndexById(messages, message.id);
    if (msgIdx < 0) return 'sent';

    const readIdx = messageIndexById(messages, peerReadMessageId);
    if (readIdx >= 0 && msgIdx <= readIdx) return 'read';

    const msgTime = new Date(message.createdAt || 0).getTime();
    const peerRepliedAfter = messages.some(
        (m) =>
            isUserMessage(m) &&
            !isMine(m) &&
            new Date(m.createdAt || 0).getTime() > msgTime,
    );
    if (peerRepliedAfter) return 'read';

    return 'sent';
};

export const readStatusLabel = (status) => {
    if (status === 'read') return 'Прочитано';
    if (status === 'sent') return 'Отправлено';
    return '';
};
