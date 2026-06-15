export const REQUEST_RESULT_LABELS = {
    CREATION: 'Создана',
    SYNC: 'Синхронизация',
    WAITING: 'Ожидание ответа',
    EXPECTATION: 'Ожидает решения',
    STUDENT_CONFIRMED: 'Этап ТУ',
    RECRUITER_CONFIRMED: 'ТУ: ждём студента',
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

/**
 * Кто может нажать «Подтвердить ТУ»:
 * - STUDENT_CONFIRMED: обе стороны (студент принял заявку, этап ТУ открыт)
 * - RECRUITER_CONFIRMED: только студент (финальное подтверждение после работодателя)
 */
export const canTuDecideRequest = (result, role) => {
    if (!result || !role) return false;
    if (result === 'STUDENT_CONFIRMED') return true;
    if (result === 'RECRUITER_CONFIRMED') return role === 'student';
    return false;
};

/** Ожидание решения второй стороны на этапе ТУ. */
export const getTuWaitingHint = (result, role) => {
    if (result === 'RECRUITER_CONFIRMED' && role === 'recruiter') {
        return 'Вы подтвердили ТУ. Ожидаем финальное подтверждение от студента.';
    }
    return null;
};

const requestSortKey = (request) =>
    Date.parse(request?.updatedAt || request?.createdAt || 0) || 0;

/** Приоритет заявки в объединённом диалоге: сначала привязанная к открытому chatId. */
const requestFocusScore = (request, focusChatId, chatIds) => {
    const cid = request?.appChatId ?? request?.chatId;
    if (cid == null) return 0;
    const key = String(cid);
    if (focusChatId != null && key === String(focusChatId)) return 2;
    if (chatIds?.has?.(key)) return 1;
    return 0;
};

/**
 * Выбирает актуальную заявку для чата и режим UI.
 * @param {object[]} matched
 * @param {'student'|'recruiter'} role
 * @param {(request: object) => number|null} resolveId
 * @param {string|number|null} [focusChatId] — id открытого чата (канонический в merge-группе)
 * @param {Set<string>|null} [chatIds] — все id чатов в объединённом диалоге
 */
export const resolveRequestAction = (matched, role, resolveId, focusChatId = null, chatIds = null) => {
    if (!Array.isArray(matched) || !matched.length || !role) {
        return { request: null, mode: null };
    }

    const sorted = [...matched]
        .filter((r) => resolveId(r) != null)
        .sort((a, b) => {
            const focusDiff =
                requestFocusScore(b, focusChatId, chatIds) -
                requestFocusScore(a, focusChatId, chatIds);
            if (focusDiff !== 0) return focusDiff;
            return requestSortKey(b) - requestSortKey(a);
        });

    if (!sorted.length) {
        return { request: null, mode: null };
    }

    if (role === 'student') {
        const studentAction = sorted.find((r) => canStudentDecideRequest(r.result));
        if (studentAction) {
            return { request: studentAction, mode: 'student_decision' };
        }
    }

    const tuAction = sorted.find((r) => canTuDecideRequest(r.result, role));
    if (tuAction) {
        return { request: tuAction, mode: 'tu_decision' };
    }

    const tuWaiting = sorted.find((r) => TU_DECIDABLE_RESULTS.has(r.result));
    if (tuWaiting && getTuWaitingHint(tuWaiting.result, role)) {
        return { request: tuWaiting, mode: 'tu_waiting' };
    }

    const success = sorted.find((r) => r.result === 'SUCCESS');
    if (success) {
        return { request: success, mode: 'success' };
    }

    return { request: sorted[0], mode: null };
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

export const matchRequestToChat = (request, _chatRow, chatIds) => {
    const appChatId = request?.appChatId ?? request?.chatId;
    if (appChatId == null) return false;
    return chatIds.has(String(appChatId));
};
