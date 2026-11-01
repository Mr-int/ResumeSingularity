import { isAllowedProfileCity } from '../constants/campusCities.js';

const ok = () => ({ valid: true, message: '' });

const fail = (message) => ({ valid: false, message });

/**
 * Обязательные поля мастера резюме.
 * Не проверяем: опыт (шаг 6), ссылки портфолио (шаг 8),
 * поля опциональные в PATCH (отчество, hh, telegram и т.д.).
 */
export const validateResumeStep = (step, ctx) => {
    const {
        profile = {},
        bio = '',
        selectedSkills = [],
        photoPreview,
        educationsAdded = [],
        savedInstitutionCount = 0,
        legacyCity = '',
    } = ctx;

    switch (step) {
        case 1: {
            if (!profile.firstName?.trim()) return fail('Укажите имя');
            if (!profile.lastName?.trim()) return fail('Укажите фамилию');
            if (!profile.birthDate) return fail('Укажите дату рождения');
            if (!isAllowedProfileCity(profile.city, legacyCity)) {
                return fail('Выберите город из списка');
            }
            if (!profile.course) return fail('Выберите курс');
            if (!profile.gender) return fail('Укажите пол');
            return ok();
        }
        case 2: {
            if (profile.specialityId == null || profile.specialityId === '') {
                return fail('Выберите специальность');
            }
            return ok();
        }
        case 3: {
            if (!photoPreview) return fail('Загрузите фото');
            return ok();
        }
        case 4: {
            const text = bio?.trim() || '';
            if (!text) return fail('Заполните блок «О себе»');
            if (text.length < 30) {
                return fail('В «О себе» нужно не меньше 30 символов');
            }
            if (bio.length > 2000) return fail('Описание не должно превышать 2000 символов');
            return ok();
        }
        case 5: {
            if (!selectedSkills.length) return fail('Выберите хотя бы один навык');
            return ok();
        }
        case 6:
            return ok();
        case 7: {
            const totalEducation = educationsAdded.length + savedInstitutionCount;
            if (totalEducation < 1) return fail('Добавьте хотя бы одно образование');
            return ok();
        }
        case 8:
            return ok();
        default:
            return ok();
    }
};

/** Частичное сохранение: только то, что может сломать PATCH или ввести в заблуждение. */
export const validatePartialSave = (ctx) => {
    const { profile = {}, bio = '', legacyCity = '' } = ctx;
    if (bio.length > 2000) {
        return fail('Описание не должно превышать 2000 символов');
    }
    const city = profile.city?.trim();
    if (city && !isAllowedProfileCity(city, legacyCity)) {
        return fail('Выберите город из списка или сбросьте поле');
    }
    return ok();
};

/** Проверка шагов 1…maxStep; шаг 6 (опыт) и шаг 8 (портфолио) пропускаем. */
export const validateResumeThroughStep = (maxStep, ctx) => {
    const last = Math.min(Math.max(maxStep, 1), 8);
    for (let s = 1; s <= last; s += 1) {
        if (s === 6 || s === 8) continue;
        const result = validateResumeStep(s, ctx);
        if (!result.valid) return result;
    }
    return ok();
};

export const resumeValidationContext = ({
    profile,
    bio,
    selectedSkills,
    photoPreview,
    educationsAdded,
    savedInstitutionCount,
    legacyCity = '',
    hhLink = '',
}) => ({
    profile,
    bio,
    selectedSkills,
    photoPreview,
    educationsAdded,
    savedInstitutionCount,
    legacyCity,
    hhLink,
});
