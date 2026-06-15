import {
    isAccountPending,
    isStudentRole,
    getAccountStatus,
} from '../services/authApi.js';

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
    );
};

const isHtmlErrorBody = (text) => {
    const value = String(text || '').trim();
    return value.startsWith('<') || value.includes('<html') || value.includes('<!DOCTYPE');
};

export function formatApiUserMessage(error) {
    if (!error) {
        return 'Не удалось выполнить запрос. Попробуйте обновить страницу.';
    }

    const status = error.status;
    const raw = String(error.message || error.responseBody?.message || '').trim();

    if (status === 502 || status === 503 || status === 504 || isHtmlErrorBody(raw)) {
        return 'Сервер временно недоступен. Попробуйте обновить страницу чуть позже.';
    }

    if (isPendingApprovalText(raw) || (status === 403 && isAccountPending())) {
        if (isPendingApprovalText(raw) && raw && !isAccessDeniedText(raw)) {
            return raw.endsWith('.') ? raw : `${raw}.`;
        }
        return PENDING_APPROVAL_MESSAGE;
    }

    if (status === 404 && isPendingApprovalText(raw)) {
        return PENDING_APPROVAL_MESSAGE;
    }

    if (status === 403) {
        if (
            isStudentRole()
            && (isAccountPending(getAccountStatus()) || isPendingApprovalText(raw))
        ) {
            return PENDING_APPROVAL_MESSAGE;
        }
        if (raw && !isAccessDeniedText(raw)) return raw;
        return 'Недостаточно прав для выполнения действия.';
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
    const raw = String(error.message || error.responseBody?.message || '');
    if (isPendingApprovalText(raw)) return true;
    if (error.status === 403 && isAccountPending()) return true;
    if (error.status === 403 && isStudentRole() && isAccountPending(getAccountStatus())) return true;
    return false;
}
