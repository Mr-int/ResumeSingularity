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

/** Студент подтверждает ТУ после согласия работодателя. */
export const canStudentTuDecideRequest = (result) => result === 'RECRUITER_CONFIRMED';

/** Работодатель подтверждает ТУ после согласия студента. */
export const canRecruiterTuDecideRequest = (result) => result === 'STUDENT_CONFIRMED';

export const canTuDecideRequest = (result, role) => {
    if (!result || !role) return false;
    if (role === 'student') return canStudentTuDecideRequest(result);
    if (role === 'recruiter') return canRecruiterTuDecideRequest(result);
    return false;
};

export const buildTuDecisionBody = (accept, reasonCode = '', comment = '') => {
    const body = {
        accept: accept === true,
        comment: String(comment ?? '').trim().slice(0, 2000),
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
