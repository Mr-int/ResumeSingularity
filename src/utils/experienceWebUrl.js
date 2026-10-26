/** Маркер URL в additionalInfo: у ExperienceReq нет webUrl в API. */
const WEB_URL_MARKER = '\n\n__RS_WEB_URL__:';

/**
 * Упаковать описание и ссылку в одно поле additionalInfo для API.
 * @param {string} description
 * @param {string} webUrl
 * @returns {string}
 */
export const packExperienceAdditionalInfo = (description = '', webUrl = '') => {
    const desc = String(description || '').trim();
    const url = String(webUrl || '').trim();
    if (!url) return desc;
    return `${desc}${WEB_URL_MARKER}${url}`;
};

/**
 * Достать описание и ссылку из additionalInfo с бэкенда.
 * @param {string} raw
 * @returns {{ description: string, webUrl: string }}
 */
export const unpackExperienceAdditionalInfo = (raw = '') => {
    const text = String(raw || '');
    const idx = text.lastIndexOf(WEB_URL_MARKER);
    if (idx === -1) {
        return { description: text.trim(), webUrl: '' };
    }
    return {
        description: text.slice(0, idx).trim(),
        webUrl: text.slice(idx + WEB_URL_MARKER.length).trim(),
    };
};
