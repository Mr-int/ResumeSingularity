export const PENDING_APPROVAL_MESSAGE =
    'Ваш аккаунт ещё на проверке. После одобрения администратором откроется полный доступ к каталогу и профилю.';

const normalize = (value) => String(value || '').trim().toLowerCase();

const isAccessDeniedText = (text) => {
    const lower = normalize(text);
    return (
        lower.includes('access is denied')
        || lower.includes('access denied')
        || lower.includes('forbidden')
        || lower.includes('http error! status: 403')
        || lower.includes('status: 403')
    );
};

const isPendingApprovalText = (text) => {
    const lower = normalize(text);
    return (
        lower.includes('ожидает одобрения')
        || lower.includes('pending_approval')
        || lower.includes('pending approval')
        || lower.includes('на проверке')
        || lower.includes('не привязана карточка')
    );
};

export function formatApiUserMessage(error) {
    if (!error) {
        return 'Не удалось выполнить запрос. Попробуйте обновить страницу.';
    }

    const status = error.status;
    const raw = String(error.message || error.responseBody?.message || '').trim();

    if (status === 403 || isAccessDeniedText(raw) || isPendingApprovalText(raw)) {
        if (isPendingApprovalText(raw) && raw && !isAccessDeniedText(raw)) {
            return raw.endsWith('.') ? raw : `${raw}.`;
        }
        return PENDING_APPROVAL_MESSAGE;
    }

    if (status === 404 && isPendingApprovalText(raw)) {
        return PENDING_APPROVAL_MESSAGE;
    }

    if (status === 401) {
        return 'Войдите в аккаунт, чтобы продолжить.';
    }

    if (raw) {
        return raw;
    }

    return 'Не удалось выполнить запрос. Попробуйте позже.';
}

export function isPendingApprovalError(error) {
    if (!error) return false;
    if (error.status === 403) return true;
    const raw = String(error.message || error.responseBody?.message || '');
    return isAccessDeniedText(raw) || isPendingApprovalText(raw);
}
