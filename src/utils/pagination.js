/** Spring Page / legacy обёртки: content → data → value → массив */
export const extractPageItems = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.content)) return res.content;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.value)) return res.value;
    return [];
};

export const pageQuery = (page = 0, size = 20, sortFields = []) => {
    const p = new URLSearchParams();
    p.set('page', String(page));
    p.set('size', String(size));
    for (const s of sortFields) {
        p.append('sort', s);
    }
    return p.toString();
};
