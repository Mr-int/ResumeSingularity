export const STUDENT_STAGE = {
    CONFIRM_EMAIL: 'confirm_email',
    COMPLETE_REGISTRATION: 'complete_registration',
    QUESTIONNAIRE: 'questionnaire',
    PENDING_REVIEW: 'pending_review',
    REJECTED: 'rejected',
    APPROVED: 'approved',
};

const PROFILE_SUBMITTED_KEY = 'resume:student-profile-submitted';
const PROFILE_SUBMITTED_AT_KEY = 'resume:student-profile-submitted-at';
const REGISTRATION_COMPLETED_KEY = 'resume:student-registration-completed';

/** Окно «Отправляем на проверку…» после submit-for-review (как в макете). */
export const RESUME_SUBMIT_GRACE_MS = 5 * 60 * 1000;

export const RESUME_BANNER_STATUS = {
    NOT_SUBMITTED: 'not_submitted',
    AWAITING_SEND: 'awaiting_send',
    IN_REVIEW: 'in_review',
    REVISION: 'revision',
};

export const markStudentProfileSubmitted = (userId) => {
    if (!userId) return;
    try {
        localStorage.setItem(`${PROFILE_SUBMITTED_KEY}:${userId}`, '1');
        localStorage.setItem(`${PROFILE_SUBMITTED_AT_KEY}:${userId}`, String(Date.now()));
    } catch {
        /* empty */
    }
};

export const isStudentProfileSubmittedLocally = (userId) => {
    if (!userId) return false;
    try {
        return localStorage.getItem(`${PROFILE_SUBMITTED_KEY}:${userId}`) === '1';
    } catch {
        return false;
    }
};

export const getStudentProfileSubmittedAt = (userId) => {
    if (!userId) return null;
    try {
        const raw = localStorage.getItem(`${PROFILE_SUBMITTED_AT_KEY}:${userId}`);
        const ts = Number(raw);
        return Number.isFinite(ts) && ts > 0 ? ts : null;
    } catch {
        return null;
    }
};

export const clearStudentProfileSubmitted = (userId) => {
    if (!userId) return;
    try {
        localStorage.removeItem(`${PROFILE_SUBMITTED_KEY}:${userId}`);
        localStorage.removeItem(`${PROFILE_SUBMITTED_AT_KEY}:${userId}`);
    } catch {
        /* empty */
    }
};

/**
 * Баннер статуса резюме в ЛК.
 * APPROVED → null (баннер не показываем).
 */
export const resolveResumeBannerStatus = (authMe, { now = Date.now() } = {}) => {
    const status = String(authMe?.accountStatus || '').toUpperCase();
    const userId = authMe?.id;

    if (status === 'APPROVED') return null;
    if (status === 'REJECTED') return RESUME_BANNER_STATUS.REVISION;

    const submitted = isStudentProfileSubmittedLocally(userId);
    if (!submitted) return RESUME_BANNER_STATUS.NOT_SUBMITTED;

    const submittedAt = getStudentProfileSubmittedAt(userId);
    if (submittedAt != null && now - submittedAt < RESUME_SUBMIT_GRACE_MS) {
        return RESUME_BANNER_STATUS.AWAITING_SEND;
    }

    return RESUME_BANNER_STATUS.IN_REVIEW;
};

export const markStudentRegistrationCompleted = (userId) => {
    if (!userId) return;
    try {
        localStorage.setItem(`${REGISTRATION_COMPLETED_KEY}:${userId}`, '1');
    } catch {
        /* empty */
    }
};

export const isStudentRegistrationCompletedLocally = (userId) => {
    if (!userId) return false;
    try {
        return localStorage.getItem(`${REGISTRATION_COMPLETED_KEY}:${userId}`) === '1';
    } catch {
        return false;
    }
};

const hasText = (value) => String(value ?? '').trim().length > 0;

/** Есть birthDate, course и city на карточке — шаг complete-registration уже пройден. */
export const hasRegistrationBasics = (student) =>
    hasText(student?.birthDate)
    && hasText(student?.course)
    && hasText(student?.city);

/**
 * @param {object} authMe — GET /auth/me
 * @param {object|null} studentMe — GET /student/me (null, если 404)
 * @param {{ ready?: boolean }|null} readiness — GET /profile/communication-readiness
 */
export const resolveStudentStage = (authMe, studentMe, readiness = null) => {
    const status = String(authMe?.accountStatus || '').toUpperCase();
    const emailVerified = authMe?.emailVerified === true;

    if (status === 'REJECTED') return STUDENT_STAGE.REJECTED;
    if (status === 'APPROVED') return STUDENT_STAGE.APPROVED;

    if (!emailVerified) return STUDENT_STAGE.CONFIRM_EMAIL;

    if (!hasRegistrationBasics(studentMe)) {
        return STUDENT_STAGE.COMPLETE_REGISTRATION;
    }

    // ready + PENDING → анкета уже отправлена
    if (status === 'PENDING_APPROVAL' && readiness?.ready === true) {
        return STUDENT_STAGE.PENDING_REVIEW;
    }

    if (
        status === 'PENDING_APPROVAL'
        && isStudentProfileSubmittedLocally(authMe?.id)
    ) {
        return STUDENT_STAGE.PENDING_REVIEW;
    }

    return STUDENT_STAGE.QUESTIONNAIRE;
};

const MISSING_FIELD_LABELS = {
    name: 'имя и фамилия',
    photo: 'фото',
    about: 'блок «О себе» (не короче 30 символов)',
    city: 'город',
    speciality: 'специальность',
    skills: 'хотя бы один навык',
    experience: 'хотя бы один опыт работы или проект',
    portfolio: 'работу в портфолио или ссылку на HH',
    portfolio_or_hh: 'работу в портфолио или ссылку на HH',
};

/** Коды missingFields с бэка → текст для тоста. */
export const formatMissingProfileFields = (fields) => {
    if (!Array.isArray(fields) || fields.length === 0) return '';
    return fields
        .map((code) => MISSING_FIELD_LABELS[code] || code)
        .filter(Boolean)
        .join('; ');
};

/** Куда вести студента после логина / с публичных экранов. */
export const pathForStudentStage = (stage) => {
    switch (stage) {
        case STUDENT_STAGE.CONFIRM_EMAIL:
            return '/registration?role=student';
        case STUDENT_STAGE.COMPLETE_REGISTRATION:
            return '/resume/create';
        case STUDENT_STAGE.QUESTIONNAIRE:
            return '/resume/create';
        case STUDENT_STAGE.PENDING_REVIEW:
            return '/profile';
        case STUDENT_STAGE.REJECTED:
            return '/profile';
        case STUDENT_STAGE.APPROVED:
            return '/students';
        default:
            return '/students';
    }
};
