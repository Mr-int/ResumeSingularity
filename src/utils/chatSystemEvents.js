/** Короткие подписи системных событий чата — без номеров заявок и лишних деталей. */
export const CHAT_SYSTEM_EVENT_LABELS = {
    TU_STUDENT_CONFIRMED: 'Студент подтвердил прохождение ТУ',
    TU_RECRUITER_CONFIRMED: 'Работодатель подтвердил прохождение ТУ',
    TU_CONFIRMED: 'Техническое собеседование завершено',
    TU_REJECTED: 'Отказ по техническому собеседованию',
    REQUEST_CREATED: 'Работодатель отправил заявку',
    REQUEST_ACCEPTED: 'Студент принял заявку',
    REQUEST_REJECTED: 'Заявка отклонена',
    REQUEST_STUDENT_ACCEPTED: 'Студент принял заявку',
    REQUEST_STUDENT_REJECTED: 'Студент отклонил заявку',
    REQUEST_RECRUITER_CREATED: 'Работодатель отправил заявку',
    STUDENT_DECISION_ACCEPTED: 'Студент принял заявку',
    STUDENT_DECISION_REJECTED: 'Студент отклонил заявку',
};

const stripRequestDetails = (text) =>
    String(text || '')
        .replace(/\s*заявк[а-яё]*\s*(№|#|Nº|no\.?|number)?\s*\d+/gi, ' заявку')
        .replace(/\s*request\s*(#|№)?\s*\d+/gi, ' заявку')
        .replace(/\s*(№|#)\s*\d+/g, '')
        .replace(/\s*\(id\s*:?\s*\d+\)/gi, '')
        .replace(/\s*—\s*id\s*\d+/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

const inferLabelFromBody = (body) => {
    const raw = stripRequestDetails(body);
    const b = raw.toLowerCase();

    if (/отправил.*заявк|создан.*заявк|новая заявк|отправлена заявк/.test(b)) {
        return 'Работодатель отправил заявку';
    }
    if (/студент.*принял|принял.*заявк|заявк.*принят/.test(b) && !/отклон/.test(b)) {
        return 'Студент принял заявку';
    }
    if (/студент.*отклон|отклон.*заявк|заявк.*отклон/.test(b)) {
        return 'Заявка отклонена';
    }
    if (/студент.*подтверд.*ту|подтвердил.*ту.*студент/.test(b)) {
        return 'Студент подтвердил прохождение ТУ';
    }
    if (/рекрут|работодател.*подтверд.*ту/.test(b)) {
        return 'Работодатель подтвердил прохождение ТУ';
    }
    if (/ту.*заверш|ту.*подтвержден|обе.*подтверд|техническ.*собеседован.*заверш/.test(b)) {
        return 'Техническое собеседование завершено';
    }
    if (/ту.*отказ|отказ.*ту/.test(b)) {
        return 'Отказ по техническому собеседованию';
    }

    return raw;
};

export const formatChatSystemMessage = (message) => {
    const key = message?.systemEvent;
    if (key && CHAT_SYSTEM_EVENT_LABELS[key]) {
        return CHAT_SYSTEM_EVENT_LABELS[key];
    }

    const body = String(message?.body ?? '').trim();
    if (!body) {
        return key || 'Системное сообщение';
    }

    const inferred = inferLabelFromBody(body);
    if (inferred) return inferred;

    return key || 'Системное сообщение';
};

/** Превью в списке чатов — убирает номера заявок из системных строк. */
export const formatChatListPreview = (text) => {
    const value = String(text ?? '').trim();
    if (!value) return '';
    if (/заявк|ту|собеседован/i.test(value) && (/\d|№|#/.test(value) || /request/i.test(value))) {
        return formatChatSystemMessage({ body: value, messageKind: 'SYSTEM' });
    }
    return value;
};
