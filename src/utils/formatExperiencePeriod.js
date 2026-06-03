const ONGOING_MARKERS = ['по настоящее время', 'настоящее время', 'present', 'now', 'current'];

const pluralize = (count, one, few, many) => {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod100 >= 11 && mod100 <= 14) return many;
    if (mod10 === 1) return one;
    if (mod10 >= 2 && mod10 <= 4) return few;
    return many;
};

export const isOngoingExperienceDate = (value) => {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) return false;
    return ONGOING_MARKERS.some((marker) => normalized === marker || normalized.includes('настоящ'));
};

export const parseExperienceDate = (value) => {
    if (!value || isOngoingExperienceDate(value)) return null;

    const normalized = String(value).trim();

    const isoMatch = normalized.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
    if (isoMatch) {
        const year = Number(isoMatch[1]);
        const month = Number(isoMatch[2]) - 1;
        const day = isoMatch[3] ? Number(isoMatch[3]) : 1;
        const date = new Date(year, month, day);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    const dmyMatch = normalized.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (dmyMatch) {
        const date = new Date(Number(dmyMatch[3]), Number(dmyMatch[2]) - 1, Number(dmyMatch[1]));
        return Number.isNaN(date.getTime()) ? null : date;
    }

    const yearOnlyMatch = normalized.match(/^(\d{4})$/);
    if (yearOnlyMatch) {
        const date = new Date(Number(yearOnlyMatch[1]), 0, 1);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatExperienceMonthYear = (date) => {
    const formatted = date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    return formatted.replace(/\s*г\.?\s*$/i, '').trim().toLowerCase();
};

const formatDurationLabel = (startDate, endDate) => {
    const diffMs = endDate.getTime() - startDate.getTime();
    if (diffMs < 0) return '';

    const days = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    const totalMonths = Math.max(1, Math.round(days / 30));

    if (totalMonths >= 12) {
        const years = Math.round(totalMonths / 12);
        const form = pluralize(years, 'год', 'года', 'лет');
        return `(${years} ${form})`;
    }

    const form = pluralize(totalMonths, 'месяц', 'месяца', 'месяцев');
    return `(${totalMonths} ${form})`;
};

/**
 * @returns {string[]}
 */
export const getExperiencePeriodLines = (startRaw, endRaw, isCurrent = false) => {
    const ongoing = isCurrent || isOngoingExperienceDate(endRaw);
    const start = parseExperienceDate(startRaw);
    const end = ongoing ? new Date() : parseExperienceDate(endRaw);

    if (start && (end || ongoing)) {
        const lines = [formatExperienceMonthYear(start)];
        lines.push(ongoing ? 'по настоящее время' : formatExperienceMonthYear(end));
        const duration = formatDurationLabel(start, end);
        if (duration) lines.push(duration);
        return lines;
    }

    if (start) {
        return [`с ${formatExperienceMonthYear(start)}`];
    }

    if (ongoing) {
        return ['по настоящее время'];
    }

    if (end) {
        return [`до ${formatExperienceMonthYear(end)}`];
    }

    const startText = String(startRaw || '').trim();
    const endText = String(endRaw || '').trim();

    if (startText && endText) {
        return [`${startText} - ${endText}`];
    }
    if (startText) return [`С ${startText}`];
    if (endText) return [`До ${endText}`];

    return [];
};
