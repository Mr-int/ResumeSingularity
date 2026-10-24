/** Этапы онбординга студента после входа (GET /auth/me + GET /student/me). */

export const STUDENT_STAGE = {
    CONFIRM_EMAIL: 'confirm_email',
    COMPLETE_REGISTRATION: 'complete_registration',
    QUESTIONNAIRE: 'questionnaire',
    PENDING_REVIEW: 'pending_review',
    REJECTED: 'rejected',
    APPROVED: 'approved',
};

const PROFILE_SUBMITTED_KEY = 'resume:student-profile-submitted';

export const markStudentProfileSubmitted = (userId) => {
    if (!userId) return;
    try {
        localStorage.setItem(`${PROFILE_SUBMITTED_KEY}:${userId}`, '1');
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

export const clearStudentProfileSubmitted = (userId) => {
    if (!userId) return;
    try {
        localStorage.removeItem(`${PROFILE_SUBMITTED_KEY}:${userId}`);
    } catch {
        /* empty */
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

    // ready + PENDING → экран ожидания (без повторного submit)
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
            return '/onboarding';
        case STUDENT_STAGE.QUESTIONNAIRE:
            return '/plug';
        case STUDENT_STAGE.PENDING_REVIEW:
            return '/onboarding';
        case STUDENT_STAGE.REJECTED:
            return '/onboarding';
        case STUDENT_STAGE.APPROVED:
            return '/students';
        default:
            return '/students';
    }
};
