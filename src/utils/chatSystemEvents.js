/** Подписи системных событий чата (systemEvent). */
export const CHAT_SYSTEM_EVENT_LABELS = {
    TU_STUDENT_CONFIRMED: 'Студент подтвердил прохождение ТУ',
    TU_RECRUITER_CONFIRMED: 'Работодатель подтвердил прохождение ТУ',
    TU_CONFIRMED: 'Техническое собеседование успешно завершено',
    TU_REJECTED: 'Отказ по техническому собеседованию',
    REQUEST_CREATED: 'Отправлена заявка',
    REQUEST_ACCEPTED: 'Заявка принята',
    REQUEST_REJECTED: 'Заявка отклонена',
};

export const formatChatSystemMessage = (message) => {
    const body = String(message?.body ?? '').trim();
    if (body) return body;
    const key = message?.systemEvent;
    if (key && CHAT_SYSTEM_EVENT_LABELS[key]) {
        return CHAT_SYSTEM_EVENT_LABELS[key];
    }
    return key || 'Системное сообщение';
};
