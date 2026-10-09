import { isCampusCity } from '../constants/campusCities.js';

const ok = () => ({ valid: true, message: '' });

const fail = (message) => ({ valid: false, message });

/**
 * Обязательные поля мастера резюме.
 * Не проверяем: опыт (шаг 6), поля опциональные в PATCH (отчество, hh, telegram и т.д.).
 */
export const validateResumeStep = (step, ctx) => {
    const {
        profile = {},
        bio = '',
        selectedSkills = [],
        photoPreview,
        educationsAdded = [],
        savedInstitutionCount = 0,
    } = ctx;

    switch (step) {
        case 1: {
            if (!profile.firstName?.trim()) return fail('Укажите имя');
            if (!profile.lastName?.trim()) return fail('Укажите фамилию');
            if (!profile.birthDate) return fail('Укажите дату рождения');
            if (!isCampusCity(profile.city)) return fail('Выберите город из списка');
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
            if (!bio?.trim()) return fail('Заполните описание резюме');
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
        default:
            return ok();
    }
};

/** Частичное сохранение: только то, что может сломать PATCH или ввести в заблуждение. */
export const validatePartialSave = (ctx) => {
    const { profile = {}, bio = '' } = ctx;
    if (bio.length > 2000) {
        return fail('Описание не должно превышать 2000 символов');
    }
    const city = profile.city?.trim();
    if (city && !isCampusCity(city)) {
        return fail('Выберите город из списка или сбросьте поле');
    }
    return ok();
};

/** Проверка шагов 1…maxStep; шаг 6 (опыт) пропускаем. */
export const validateResumeThroughStep = (maxStep, ctx) => {
    const last = Math.min(Math.max(maxStep, 1), 7);
    for (let s = 1; s <= last; s += 1) {
        if (s === 6) continue;
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
}) => ({
    profile,
    bio,
    selectedSkills,
    photoPreview,
    educationsAdded,
    savedInstitutionCount,
});
