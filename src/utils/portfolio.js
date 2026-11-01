/** Нормализация и сборка тела для POST/PUT /portfolio. */

export const normalizePortfolioItem = (item) => {
    if (!item || typeof item !== 'object') {
        return { id: null, name: '', description: '', link: '' };
    }

    const id = item.id ?? item.portfolioId ?? null;
    const link = String(item.link || item.url || item.webUrl || '').trim();
    let name = String(item.name || item.title || item.portfolioName || '').trim();
    let description = String(
        item.description || item.about || item.additionalInfo || item.subtitle || '',
    ).trim();

    // Если бэкенд не хранит name, достаём его из первой строки description/additionalInfo.
    if (!name && description) {
        const lines = description.split('\n');
        name = (lines[0] || '').trim();
        description = lines.slice(1).join('\n').trim();
    } else if (name && description === name) {
        description = '';
    } else if (name && description.startsWith(`${name}\n`)) {
        description = description.slice(name.length + 1).trim();
    }

    return { id, name, description, link };
};

export const buildPortfolioPayload = ({
    name = '',
    description = '',
    link = '',
    studentId,
}) => {
    const trimmedName = String(name || '').trim();
    const trimmedLink = String(link || '').trim();
    const trimmedDescription = String(description || '').trim();

    if (!trimmedName && !trimmedLink && !trimmedDescription) {
        return { empty: true };
    }
    if (!trimmedName) return { error: 'Введите название' };
    if (!trimmedLink) return { error: 'Введите ссылку на материал' };

    // Дублируем поля: разные версии API принимают name/title и description/additionalInfo.
    const packedDescription = trimmedDescription
        ? `${trimmedName}\n${trimmedDescription}`
        : trimmedName;

    const body = {
        studentId,
        name: trimmedName,
        title: trimmedName,
        link: trimmedLink,
        url: trimmedLink,
        description: packedDescription,
        additionalInfo: packedDescription,
    };

    return {
        body,
        local: {
            name: trimmedName,
            description: trimmedDescription,
            link: trimmedLink,
        },
    };
};
