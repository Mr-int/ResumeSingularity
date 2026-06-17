export const TU_PHASE_LABELS = {
    NOT_APPLICABLE: null,
    WAITING_STUDENT: 'ТУ: ждём студента',
    WAITING_RECRUITER: 'ТУ: ждём работодателя',
    COMPLETED: 'ТУ пройдено',
    REJECTED: 'Отказ по ТУ',
};

export const INBOX_REFRESH_TYPES = new Set([
    'NEW_REQUEST',
    'REQUEST_DECISION',
    'TU_PARTIAL',
    'TU_CONFIRMED',
    'TU_REJECTED',
    'CHAT_MESSAGE',
]);
