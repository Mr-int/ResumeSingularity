export const buildSkillCatalogMap = (catalog = []) => {
    const map = new Map();
    for (const skill of catalog) {
        if (skill?.id != null) {
            map.set(Number(skill.id), skill);
        }
    }
    return map;
};

export const extractSkillIds = (skills) => {
    if (!Array.isArray(skills)) return [];
    return skills
        .map((skill) => {
            if (skill == null) return null;
            if (typeof skill === 'number') return skill;
            if (typeof skill === 'string' && /^\d+$/.test(skill.trim())) return Number(skill);
            if (typeof skill === 'object' && skill.id != null) return Number(skill.id);
            return null;
        })
        .filter((id) => Number.isFinite(id) && id > 0);
};

export const getSkillDisplayName = (skill, catalogById) => {
    if (skill == null) return 'Навык';

    if (typeof skill === 'string') {
        const trimmed = skill.trim();
        if (/^\d+$/.test(trimmed) && catalogById) {
            const fromCatalog = catalogById.get(Number(trimmed));
            return fromCatalog?.name || fromCatalog?.title || trimmed;
        }
        return trimmed || 'Навык';
    }

    if (typeof skill === 'number') {
        const fromCatalog = catalogById?.get(skill);
        return fromCatalog?.name || fromCatalog?.title || String(skill);
    }

    if (typeof skill === 'object') {
        const directName = skill.name || skill.title || skill.skillName;
        if (directName) return directName;
        if (skill.id != null) {
            const fromCatalog = catalogById?.get(Number(skill.id));
            return fromCatalog?.name || fromCatalog?.title || String(skill.id);
        }
    }

    return 'Навык';
};
