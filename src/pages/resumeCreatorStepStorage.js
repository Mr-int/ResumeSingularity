const TOTAL_STEPS = 7;

const storageKey = (studentId) => `resumeCreator.step.${studentId}`;
const experienceDraftKey = (studentId) => `resumeCreator.experienceDraft.${studentId}`;

export const loadResumeCreatorStep = (studentId) => {
    if (studentId == null) return null;
    try {
        const raw = localStorage.getItem(storageKey(studentId));
        const step = Number(raw);
        if (!Number.isInteger(step) || step < 1 || step > TOTAL_STEPS) return null;
        return step;
    } catch {
        return null;
    }
};

export const saveResumeCreatorStep = (studentId, step) => {
    if (studentId == null) return;
    const safe = Math.min(Math.max(Number(step) || 1, 1), TOTAL_STEPS);
    try {
        localStorage.setItem(storageKey(studentId), String(safe));
    } catch {
        /* private mode / quota */
    }
};

export const clearResumeCreatorStep = (studentId) => {
    if (studentId == null) return;
    try {
        localStorage.removeItem(storageKey(studentId));
    } catch {
        /* ignore */
    }
};

export const loadExperienceDraft = (studentId) => {
    if (studentId == null) return null;
    try {
        const raw = localStorage.getItem(experienceDraftKey(studentId));
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
        return null;
    }
};

export const saveExperienceDraft = (studentId, draft) => {
    if (studentId == null) return;
    try {
        const hasContent = Boolean(
            draft
            && (
                draft.companyName?.trim()
                || draft.position?.trim()
                || draft.startDate
                || draft.endDate
                || draft.additionalInfo?.trim()
            ),
        );
        if (!hasContent) {
            localStorage.removeItem(experienceDraftKey(studentId));
            return;
        }
        localStorage.setItem(experienceDraftKey(studentId), JSON.stringify(draft));
    } catch {
        /* ignore */
    }
};

export const clearExperienceDraft = (studentId) => {
    if (studentId == null) return;
    try {
        localStorage.removeItem(experienceDraftKey(studentId));
    } catch {
        /* ignore */
    }
};
