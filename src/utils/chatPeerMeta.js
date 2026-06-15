export const GENERIC_PEER_TITLES = new Set(['Работодатель', 'Студент', 'Собеседник', 'Диалог', '…', '?']);

export const isGenericPeerTitle = (title) => {
    const value = String(title || '').trim();
    return !value || GENERIC_PEER_TITLES.has(value);
};

export const formatRecruiterPeerMeta = (recruiter) => {
    if (!recruiter || typeof recruiter !== 'object') return null;
    const person = `${recruiter.firstName || ''} ${recruiter.lastName || ''}`.trim();
    const title = recruiter.companyName || person || null;
    if (!title) return null;
    const subtitle = person && recruiter.companyName ? person : '';
    return { title, subtitle };
};

export const formatStudentPeerMeta = (student) => {
    if (!student || typeof student !== 'object') return null;
    const title = `${student.firstName || ''} ${student.lastName || ''}`.trim() || null;
    if (!title) return null;
    const subtitle = student.speciality || student.profession || '';
    return { title, subtitle };
};

/** recruiterId из чата или из заявки по appChatId. */
export const resolveRecruiterIdForChat = (chat, chatIds, requests = []) => {
    if (chat?.recruiterId) return chat.recruiterId;
    const ids = chatIds instanceof Set ? chatIds : new Set((chatIds || []).map(String));
    const matched = (Array.isArray(requests) ? requests : []).find((request) => {
        const appChatId = request?.appChatId ?? request?.chatId;
        return appChatId != null && ids.has(String(appChatId));
    });
    return matched?.recruiterId ?? null;
};

/** studentId из чата или из заявки по appChatId. */
export const resolveStudentIdForChat = (chat, chatIds, requests = []) => {
    if (chat?.studentId) return chat.studentId;
    const ids = chatIds instanceof Set ? chatIds : new Set((chatIds || []).map(String));
    const matched = (Array.isArray(requests) ? requests : []).find((request) => {
        const appChatId = request?.appChatId ?? request?.chatId;
        return appChatId != null && ids.has(String(appChatId));
    });
    return matched?.studentId ?? null;
};

/** Запасной вариант: логин собеседника из сообщений. */
export const derivePeerMetaFromMessages = (messages, isMine) => {
    if (!Array.isArray(messages) || typeof isMine !== 'function') return null;
    const peerMsg = messages.find(
        (message) =>
            message?.messageKind === 'USER'
            && !isMine(message)
            && String(message.authorUsername || '').trim(),
    );
    if (!peerMsg) return null;
    return {
        title: String(peerMsg.authorUsername).trim(),
        subtitle: '',
    };
};
