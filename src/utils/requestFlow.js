export const REQUEST_RESULT_LABELS = {
    CREATION: 'Создана',
    SYNC: 'Синхронизация',
    WAITING: 'Ожидание ответа',
    EXPECTATION: 'Ожидает решения',
    STUDENT_CONFIRMED: 'Подтверждена студентом',
    RECRUITER_CONFIRMED: 'Подтверждена работодателем',
    SUCCESS: 'Успешно',
    REFUSAL: 'Отказ',
};

export const STUDENT_DECIDABLE_RESULTS = new Set(['WAITING', 'EXPECTATION', 'CREATION']);

export const TU_DECIDABLE_RESULTS = new Set(['STUDENT_CONFIRMED', 'RECRUITER_CONFIRMED']);

export const TU_REASON_CODES = [
    { value: 'NOT_A_FIT', label: 'Не подходит' },
    { value: 'NO_SHOW', label: 'Не явился' },
    { value: 'OTHER', label: 'Другое' },
];

export const canStudentDecideRequest = (result) => STUDENT_DECIDABLE_RESULTS.has(result);

export const canTuDecideRequest = (result) => TU_DECIDABLE_RESULTS.has(result);

export const buildTuDecisionBody = (accept, reasonCode = '', comment = '') => {
    const body = {
        accept: accept === true,
        comment: String(comment ?? '').trim().slice(0, 4000),
    };
    if (!accept) {
        body.reasonCode = String(reasonCode || 'NOT_A_FIT').trim();
    }
    return body;
};

export const matchRequestToChat = (request, chatRow, chatIds, peerRecruiterId, peerStudentId) => {
    const appChatId = request?.appChatId ?? request?.chatId;
    if (appChatId != null && chatIds.has(String(appChatId))) return true;
    if (peerRecruiterId != null && String(request.recruiterId) === String(peerRecruiterId)) return true;
    if (peerStudentId != null && String(request.studentId) === String(peerStudentId)) return true;
    return false;
};
