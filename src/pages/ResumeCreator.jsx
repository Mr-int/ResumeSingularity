import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Layout,
    Header,
    Grid,
    StepForm,
    CardPreview,
    StepperFooter,
    PhotoUploader,
    ResumeBioForm,
    MemoBlock,
    SkillsSelection,
    SkillsAside,
    ExperienceForm,
    EducationForm,
} from '../components/resumeCreator/index.js';
import PhotoCropModal from '../components/resumeCreator/PhotoUploader/PhotoCropModal/PhotoCropModal.jsx';
import correctPhoto from '../assets/photoExamples/CorrectPhoto.png';
import correctPhoto2 from '../assets/photoExamples/CorrectPhoto2.png';
import wrongPhoto from '../assets/photoExamples/wrongPhoto.png';
import { getImageUrl } from '../config/api.js';
import { isCampusCity } from '../constants/campusCities.js';
import { getStudentMe } from '../services/getApi.js';
import { patchStudentMe, uploadStudentPhoto } from '../services/accountApi.js';
import {
    getAllSpecialities,
    getAllEducation,
    filterSkills,
    createExperience,
    createInstitution,
    getAllCompanies,
    getExperienceDetailsByStudentId,
    getInstitutionsByStudentId,
    resolveCompanyId,
    resolveEducationId,
} from '../services/studentApi.js';
import {
    resumeValidationContext,
    validatePartialSave,
    validateResumeStep,
} from './resumeCreatorValidation.js';
import {
    clearExperienceDraft,
    clearResumeCreatorStep,
    loadExperienceDraft,
    loadResumeCreatorStep,
    saveExperienceDraft,
    saveResumeCreatorStep,
} from './resumeCreatorStepStorage.js';

const TOTAL_STEPS = 7;

const skillEntityId = (item) => {
    if (item == null || typeof item !== 'object') return null;
    const raw = item.id ?? item.skillId;
    return raw != null ? raw : null;
};

const toPersistableSkillIds = (ids) =>
    (Array.isArray(ids) ? ids : [])
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0);

const PHOTO_EXAMPLES = [
    { id: 'correct-1', src: correctPhoto, status: 'correct', alt: 'Удачный пример фото' },
    { id: 'correct-2', src: correctPhoto2, status: 'correct', alt: 'Удачный пример фото' },
    { id: 'wrong-1', src: wrongPhoto, status: 'wrong', alt: 'Неудачный пример фото' },
];

const MEMO_BY_STEP = {
    4: [
        {
            id: 'bio-1',
            tone: 'success',
            title: 'Что нужно писать в резюме?',
            bullets: [
                'Профессиональный профиль: Краткий итог вашего опыта — кто вы, сколько лет в профессии и в чем ваша главная специализация.',
                'Главные достижения: Измеримые результаты (например, увеличил продажи на 20%, сократил время обработки заявок).',
                'Полезные навыки и контекст: Узкоспециализированные допуски, знание редких программ или методологий.',
                'Релевантные увлечения: Профильные хобби, ведение профессионального блога или участие в отраслевых сообществах.',
            ],
        },
        {
            id: 'bio-2',
            tone: 'error',
            title: 'Что НЕ нужно писать в резюме?',
            bullets: [
                'Информация, не связанная с желаемой должностью, избыточные личные данные и неактуальный стаж работы многолетней давности.',
            ],
        },
    ],
    5: [
        {
            id: 'skills-1',
            title: 'Что если у меня мало навыков?',
            content:
                'Укажите базовые навыки, которые вы успели освоить во время обучения, прохождения курсов или выполнения учебных проектов. Также можно сделать упор на soft-скиллы и готовность быстро обучаться.',
        },
        {
            id: 'skills-2',
            title: 'Если я не уверен в навыке на 100%, добавлять?',
            content:
                'Если вы понимаете базовые принципы технологии и сможете ответить на базовые вопросы на интервью, навык стоит добавить, но не завышайте свой уровень владения.',
        },
        {
            id: 'skills-3',
            title: 'Сколько навыков добавить?',
            content:
                'Оптимально указывать от 7 до 15 ключевых навыков, которые максимально точно соответствуют требованиям вакансии.',
        },
        {
            id: 'skills-4',
            title: 'На сколько важны Soft-скиллы?',
            content:
                'Личностные качества крайне важны, особенно для начинающих специалистов. Они показывают, как вы взаимодействуете в команде.',
        },
        {
            id: 'skills-5',
            title: 'Что представляют из себя навыки в резюме?',
            content:
                'Это ваш профессиональный фундамент, разделенный на Hard-скиллы (технические знания) и Soft-скиллы (социальные качества).',
        },
    ],
    6: [
        {
            id: 'exp-1',
            tone: 'success',
            title: 'Как описать опыт?',
            bullets: [
                'Роль, период и 1–2 конкретных результата с цифрами, если есть.',
                'Фокус на задачах, близких к желаемой позиции.',
            ],
        },
        {
            id: 'exp-2',
            tone: 'error',
            title: 'Чего не писать в опыте?',
            bullets: [
                'Длинные списки обязанностей без результата и нерелевантные подработки без пояснения.',
            ],
        },
    ],
    7: [
        {
            id: 'edu-1',
            tone: 'success',
            title: 'Что указать в образовании?',
            bullets: [
                'Вуз, направление и годы обучения. Курс уточняется в профиле.',
                'Можно добавить несколько вузов по одной записи.',
            ],
        },
        {
            id: 'edu-2',
            tone: 'error',
            title: 'Чего избегать?',
            bullets: [
                'Неактуальные краткосрочные курсы без связи со специальностью и избыточные школьные детали.',
            ],
        },
    ],
};

const dataUrlToFile = async (dataUrl, fileName = 'avatar.jpeg') => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const type = blob.type || 'image/jpeg';
    const safeName = fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')
        ? fileName
        : `${fileName}.jpeg`;
    return new File([blob], safeName, { type });
};

const toApiCourse = (course) => (course === 'NEW' ? 'FIFTH' : course);

/**
 * Создание / дозаполнение резюме студента через API.
 * Маршрут: /plug (ProtectedRoute)
 */
const ResumeCreator = () => {
    const navigate = useNavigate();
    const [bootLoading, setBootLoading] = useState(true);
    const [bootError, setBootError] = useState('');
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState({ visible: false, text: '', error: false });
    const toastTimerRef = useRef(null);

    const [step, setStep] = useState(1);
    const [resumeComplete, setResumeComplete] = useState(false);
    const [studentId, setStudentId] = useState(null);
    const [specialties, setSpecialties] = useState([]);
    const [skillsCatalog, setSkillsCatalog] = useState([]);
    const [educationsCatalog, setEducationsCatalog] = useState([]);
    const [companiesCatalog, setCompaniesCatalog] = useState([]);

    const [photoPreview, setPhotoPreview] = useState(null);
    const [photoName, setPhotoName] = useState('');
    const [cropSrc, setCropSrc] = useState(null);
    const pendingPhotoNameRef = useRef('');
    const cropDraftUrlRef = useRef(null);
    const [bio, setBio] = useState('');
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [experienceDraft, setExperienceDraft] = useState({});
    const [educationDraft, setEducationDraft] = useState({});
    const [experiences, setExperiences] = useState([]);
    const [educationsAdded, setEducationsAdded] = useState([]);
    const [savedInstitutionCount, setSavedInstitutionCount] = useState(0);

    const [profile, setProfile] = useState({
        firstName: '',
        lastName: '',
        city: '',
        birthDate: '',
        course: '',
        gender: '',
        specialityId: null,
        busyness: 'FREE',
    });

    const specialtyName = useMemo(() => {
        const found = specialties.find((item) => String(item.id) === String(profile.specialityId));
        return found?.name || 'Специализация';
    }, [profile.specialityId, specialties]);

    const validationCtx = useMemo(
        () => resumeValidationContext({
            profile,
            bio,
            selectedSkills,
            photoPreview,
            educationsAdded,
            savedInstitutionCount,
        }),
        [profile, bio, selectedSkills, photoPreview, educationsAdded, savedInstitutionCount],
    );

    const currentStepValid = useMemo(
        () => validateResumeStep(step, validationCtx).valid,
        [step, validationCtx],
    );

    const updateProfile = (field, value) => {
        setProfile((prev) => ({ ...prev, [field]: value }));
    };

    const showToast = (text, { error = false } = {}) => {
        setToast({ visible: true, text, error });
        if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = window.setTimeout(() => {
            setToast({ visible: false, text: '', error: false });
        }, 2800);
    };

    useEffect(() => () => {
        if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    }, []);

    useEffect(() => {
        let cancelled = false;

        const boot = async () => {
            setBootLoading(true);
            setBootError('');
            try {
                const me = await getStudentMe();
                const [specs, skillsPage, edus, institutions, experienceDetails, companies] = await Promise.all([
                    getAllSpecialities(),
                    filterSkills({}, { page: 0, size: 500 }),
                    getAllEducation(),
                    getInstitutionsByStudentId(me.id),
                    getExperienceDetailsByStudentId(me.id),
                    getAllCompanies(),
                ]);
                if (cancelled) return;

                setStudentId(me.id);
                setSpecialties(Array.isArray(specs) ? specs : []);
                setCompaniesCatalog(Array.isArray(companies) ? companies : []);
                const apiSkills = Array.isArray(skillsPage?.data)
                    ? skillsPage.data
                    : (Array.isArray(skillsPage) ? skillsPage : []);
                const meSkills = Array.isArray(me.skills) ? me.skills : [];
                const catalogById = new Map();
                [...apiSkills, ...meSkills].forEach((skill) => {
                    const id = skillEntityId(skill);
                    if (id == null) return;
                    if (!catalogById.has(String(id))) catalogById.set(String(id), skill);
                });
                setSkillsCatalog([...catalogById.values()]);
                setEducationsCatalog(Array.isArray(edus) ? edus : []);

                setSavedInstitutionCount(Array.isArray(institutions) ? institutions.length : 0);
                setExperiences(
                    Array.isArray(experienceDetails)
                        ? experienceDetails.map((item) => ({
                            id: item.id,
                            companyId: item.companyId,
                            companyName: item.company || '',
                            position: item.position || '',
                            startDate: item.startDate || '',
                            endDate: item.current || item.endDate === 'по настоящее время'
                                ? ''
                                : (item.endDate || ''),
                            additionalInfo: item.description || '',
                        }))
                        : [],
                );
                const restoredExperienceDraft = loadExperienceDraft(me.id);
                if (restoredExperienceDraft) {
                    setExperienceDraft(restoredExperienceDraft);
                }
                setProfile({
                    firstName: me.firstName || '',
                    lastName: me.lastName || '',
                    city: me.city || '',
                    birthDate: me.birthDate || '',
                    course: me.course === 'NEW' ? 'FIFTH' : (me.course || ''),
                    gender: me.gender || '',
                    specialityId: me.specialityId ?? null,
                    busyness: me.busyness || 'FREE',
                });
                setBio(me.bio || '');
                setSelectedSkills(
                    meSkills.map((item) => skillEntityId(item)).filter((id) => id != null),
                );
                if (me.imagePath) {
                    setPhotoPreview(getImageUrl(me.imagePath));
                    setPhotoName('avatar.jpeg');
                }

                const savedStep = loadResumeCreatorStep(me.id);
                if (savedStep) setStep(savedStep);
            } catch (err) {
                if (cancelled) return;
                const status = err?.status;
                if (status === 404 || status === 403) {
                    setBootError('Карточка студента не найдена. Войдите как студент или завершите регистрацию.');
                } else {
                    setBootError(err?.message || 'Не удалось загрузить данные резюме');
                }
            } finally {
                if (!cancelled) setBootLoading(false);
            }
        };

        boot();
        return () => {
            cancelled = true;
        };
    }, []);

    const buildPatchBody = () => {
        const body = {};
        if (profile.firstName?.trim()) body.firstName = profile.firstName.trim();
        if (profile.lastName?.trim()) body.lastName = profile.lastName.trim();
        if (isCampusCity(profile.city)) body.city = profile.city.trim();
        if (profile.birthDate) body.birthDate = profile.birthDate;
        if (profile.course) body.course = toApiCourse(profile.course);
        if (profile.gender) body.gender = profile.gender;
        body.busyness = profile.busyness || 'FREE';
        if (profile.specialityId != null && profile.specialityId !== '') {
            body.specialityId = Number(profile.specialityId);
        }
        if (bio?.trim()) body.bio = bio.trim();
        return body;
    };

    const applyMeToProfile = (me, { keepLocalSkills = false } = {}) => {
        if (!me) return;
        setProfile((prev) => ({
            ...prev,
            firstName: me.firstName ?? prev.firstName,
            lastName: me.lastName ?? prev.lastName,
            city: me.city ?? prev.city,
            birthDate: me.birthDate ?? prev.birthDate,
            course: me.course === 'NEW' ? 'FIFTH' : (me.course ?? prev.course),
            gender: me.gender ?? prev.gender,
            specialityId: me.specialityId ?? prev.specialityId,
            busyness: me.busyness ?? prev.busyness,
        }));
        if (me.bio != null) setBio(me.bio);
        if (Array.isArray(me.skills)) {
            const fromServer = me.skills
                .map((item) => skillEntityId(item))
                .filter((id) => id != null);
            // Если PATCH не принял skillsIds, не затираем локальный выбор пустым ответом
            if (fromServer.length > 0 || !keepLocalSkills) {
                setSelectedSkills(fromServer);
            }
            if (fromServer.length > 0) {
                setSkillsCatalog((prev) => {
                    const byId = new Map(prev.map((s) => [String(skillEntityId(s)), s]));
                    me.skills.forEach((skill) => {
                        const id = skillEntityId(skill);
                        if (id != null && !byId.has(String(id))) byId.set(String(id), skill);
                    });
                    return [...byId.values()];
                });
            }
        }
    };

    const persistProfile = async ({ syncSkills = false } = {}) => {
        const body = buildPatchBody();
        const sentCity = body.city;
        const sentSkillIds = toPersistableSkillIds(selectedSkills);
        // На шаге навыков всегда шлём ids (в т.ч. пустой). На других — только если есть что сохранить.
        if (syncSkills || sentSkillIds.length > 0) {
            body.skillsIds = sentSkillIds;
            // совместимость с DTO, где поле называется skillIds
            body.skillIds = sentSkillIds;
        }
        if (syncSkills && selectedSkills.length > 0 && sentSkillIds.length === 0) {
            throw new Error('Выбранные навыки нельзя сохранить — обновите страницу и выберите навыки из каталога');
        }
        await patchStudentMe(body);
        const me = await getStudentMe();
        const serverSkillIds = toPersistableSkillIds(
            Array.isArray(me.skills) ? me.skills.map((item) => skillEntityId(item)) : [],
        );
        const skillsMismatch = Boolean(body.skillsIds)
            && sentSkillIds.length > 0
            && !sentSkillIds.every((id) => serverSkillIds.includes(id));
        applyMeToProfile(me, { keepLocalSkills: skillsMismatch });
        return {
            cityMismatch: Boolean(sentCity && me.city !== sentCity),
            actualCity: me.city,
            skillsMismatch,
        };
    };

    const handleSaveProgress = async () => {
        if (saving) return;
        const check = validatePartialSave(validationCtx);
        if (!check.valid) {
            showToast(check.message, { error: true });
            return;
        }
        setSaving(true);
        try {
            const result = await persistProfile({ syncSkills: step === 5 });
            if (result?.cityMismatch) {
                showToast(
                    `Город не обновился (на сервере: ${result.actualCity || '—'}). Выберите город из списка.`,
                    { error: true },
                );
                return;
            }
            if (result?.skillsMismatch) {
                showToast('Навыки не сохранились на сервере. Попробуйте ещё раз.', { error: true });
                return;
            }
            await flushExperienceDraftIfReady();
            saveResumeCreatorStep(studentId, step);
            showToast('Прогресс успешно сохранён');
        } catch (err) {
            showToast(err?.message || 'Не удалось сохранить прогресс', { error: true });
        } finally {
            setSaving(false);
        }
    };

    const handleNext = async () => {
        if (saving) return;
        const check = validateResumeStep(step, validationCtx);
        if (!check.valid) {
            showToast(check.message, { error: true });
            return;
        }

        setSaving(true);
        try {
            if (step === 1 || step === 2 || step === 4 || step === 5) {
                const result = await persistProfile({ syncSkills: step === 5 });
                if (result?.cityMismatch) {
                    showToast(
                        `Город не обновился (на сервере: ${result.actualCity || '—'}). Выберите город из списка.`,
                        { error: true },
                    );
                    return;
                }
                if (result?.skillsMismatch && step === 5) {
                    showToast('Навыки не сохранились на сервере. Попробуйте ещё раз.', { error: true });
                    return;
                }
            }
            if (step === 6) {
                await flushExperienceDraftIfReady();
            }
            if (step >= TOTAL_STEPS) {
                const result = await persistProfile();
                if (result?.cityMismatch) {
                    showToast(
                        `Город не обновился (на сервере: ${result.actualCity || '—'}). Выберите город из списка.`,
                        { error: true },
                    );
                    return;
                }
                clearResumeCreatorStep(studentId);
                clearExperienceDraft(studentId);
                setResumeComplete(true);
                showToast('Резюме сохранено');
                navigate('/settings');
                return;
            }
            const nextStep = step + 1;
            saveResumeCreatorStep(studentId, nextStep);
            setStep(nextStep);
        } catch (err) {
            showToast(err?.message || 'Не удалось сохранить шаг', { error: true });
        } finally {
            setSaving(false);
        }
    };

    const handleBack = () => {
        if (step <= 1) {
            navigate('/');
            return;
        }
        const prevStep = step - 1;
        saveResumeCreatorStep(studentId, prevStep);
        setStep(prevStep);
    };

    const clearCropDraft = () => {
        if (cropDraftUrlRef.current) {
            URL.revokeObjectURL(cropDraftUrlRef.current);
            cropDraftUrlRef.current = null;
        }
        setCropSrc(null);
    };

    const openCropModal = (src, { isObjectUrl = false } = {}) => {
        if (!src) return;
        if (cropDraftUrlRef.current) {
            URL.revokeObjectURL(cropDraftUrlRef.current);
            cropDraftUrlRef.current = null;
        }
        if (isObjectUrl) {
            cropDraftUrlRef.current = src;
        }
        setCropSrc(src);
    };

    const handlePhotoFile = (file) => {
        if (!file) return;
        pendingPhotoNameRef.current = file.name || 'photo.jpeg';
        openCropModal(URL.createObjectURL(file), { isObjectUrl: true });
    };

    const handleCropConfirm = async (dataUrl) => {
        const name = pendingPhotoNameRef.current || 'photo.jpeg';
        setPhotoPreview(dataUrl);
        setPhotoName(name);
        pendingPhotoNameRef.current = '';
        clearCropDraft();

        if (!studentId) return;
        setSaving(true);
        try {
            const file = await dataUrlToFile(dataUrl, name);
            await uploadStudentPhoto(studentId, file);
            showToast('Фото сохранено');
        } catch (err) {
            showToast(err?.message || 'Не удалось загрузить фото', { error: true });
        } finally {
            setSaving(false);
        }
    };

    const handleCropReset = () => {
        clearCropDraft();
        pendingPhotoNameRef.current = '';
    };

    const handleReplacePhoto = () => {
        setPhotoPreview(null);
        setPhotoName('');
        pendingPhotoNameRef.current = '';
    };

    const buildExperienceBody = async (entry) => {
        const companyName = entry.companyName?.trim() || '';
        // Бэкенд требует companyId > 0 («должно быть больше 0»), без id уходит 0
        const companyId = await resolveCompanyId(companyName, entry.companyId);
        const additionalInfo = (entry.additionalInfo || '').trim();

        const body = {
            companyId,
            position: entry.position.trim(),
            startDate: entry.startDate,
        };
        if (additionalInfo) body.additionalInfo = additionalInfo;
        if (entry.endDate) body.endDate = entry.endDate;
        return { body, companyName, companyId };
    };

    const persistExperienceEntry = async (entry) => {
        const { body, companyName, companyId } = await buildExperienceBody(entry);
        const created = await createExperience(body);
        const id = created?.experience?.id || created?.id;
        const saved = {
            ...entry,
            id,
            companyId: companyId || entry.companyId,
            companyName: companyName || entry.companyName || '',
        };
        setExperiences((prev) => [...prev, saved]);
        setExperienceDraft({});
        clearExperienceDraft(studentId);
        return saved;
    };

    const flushExperienceDraftIfReady = async () => {
        const entry = {
            companyId: experienceDraft.companyId || undefined,
            companyName: (experienceDraft.companyName || '').trim(),
            position: (experienceDraft.position || '').trim(),
            additionalInfo: experienceDraft.additionalInfo || '',
            startDate: experienceDraft.startDate || '',
            endDate: experienceDraft.endDate || undefined,
        };
        if (!entry.position || !entry.startDate) {
            saveExperienceDraft(studentId, experienceDraft);
            return false;
        }
        if (!entry.companyName && !(Number(entry.companyId) > 0)) {
            saveExperienceDraft(studentId, experienceDraft);
            return false;
        }
        await persistExperienceEntry(entry);
        return true;
    };

    const handleAddExperience = async (entry) => {
        if (!entry?.companyName?.trim() && !(Number(entry?.companyId) > 0)) {
            showToast('Укажите компанию', { error: true });
            return;
        }
        if (!entry?.position?.trim() || !entry?.startDate) {
            showToast('Укажите должность и дату начала', { error: true });
            return;
        }
        setSaving(true);
        try {
            const saved = await persistExperienceEntry(entry);
            if (saved?.companyId && saved?.companyName) {
                setCompaniesCatalog((prev) => (
                    prev.some((item) => Number(item.id) === Number(saved.companyId))
                        ? prev
                        : [...prev, { id: saved.companyId, name: saved.companyName }]
                ));
            }
            showToast('Опыт добавлен');
        } catch (err) {
            showToast(err?.message || 'Не удалось добавить опыт', { error: true });
        } finally {
            setSaving(false);
        }
    };

    const handleAddEducation = async (entry) => {
        const institutionName = entry?.institutionName?.trim() || '';
        if (!(Number(entry?.educationId) > 0) && !institutionName) {
            showToast('Укажите образовательную организацию', { error: true });
            return;
        }
        if (entry.startYear == null || entry.endYear == null) {
            showToast('Укажите год начала и год окончания обучения', { error: true });
            return;
        }
        setSaving(true);
        try {
            // Бэкенд требует educationId > 0; без id ищет «education with id0»
            const educationId = await resolveEducationId(
                institutionName,
                entry.educationId,
                educationsCatalog,
            );
            const created = await createInstitution({
                educationId,
                startYear: entry.startYear,
                endYear: entry.endYear,
            });
            const resolvedName = educationsCatalog.find(
                (item) => Number(item.id) === Number(educationId),
            )?.institution || institutionName;

            setEducationsAdded((prev) => [...prev, {
                ...entry,
                educationId,
                institutionName: resolvedName,
                id: created?.institution?.id || created?.educationId || educationId,
            }]);
            setEducationDraft({});
            showToast('Образование добавлено');
        } catch (err) {
            showToast(err?.message || 'Не удалось добавить образование', { error: true });
        } finally {
            setSaving(false);
        }
    };

    if (bootLoading) {
        return (
            <Layout>
                <Header resumeComplete={false} onMessagesClick={() => navigate('/chats')} onAvatarClick={() => navigate('/settings')} />
                <div className="studentCreatorLayout__content">
                    <p style={{ color: '#8e8e93' }}>Загружаем резюме…</p>
                </div>
            </Layout>
        );
    }

    if (bootError) {
        return (
            <Layout>
                <Header resumeComplete={false} onMessagesClick={() => navigate('/chats')} onAvatarClick={() => navigate('/settings')} />
                <div className="studentCreatorLayout__content">
                    <p style={{ color: '#e74c3c', maxWidth: 520, textAlign: 'center' }}>{bootError}</p>
                </div>
            </Layout>
        );
    }

    const left = (() => {
        switch (step) {
            case 1:
            case 2:
                return (
                    <StepForm
                        step={step}
                        values={profile}
                        specialties={specialties}
                        onChange={updateProfile}
                        onCourseChange={(course) => updateProfile('course', course)}
                        onGenderChange={(gender) => updateProfile('gender', gender)}
                        onSpecialtyChange={(id) => updateProfile('specialityId', id)}
                    />
                );
            case 3:
                return (
                    <PhotoUploader
                        examples={PHOTO_EXAMPLES}
                        photoSrc={photoPreview}
                        photoName={photoName}
                        onFileSelect={handlePhotoFile}
                        onReplacePhoto={handleReplacePhoto}
                        onExampleSelect={(example) => {
                            if (!example?.src) return;
                            pendingPhotoNameRef.current = example.id
                                ? `${example.id}.jpeg`
                                : 'example.jpeg';
                            openCropModal(example.src);
                        }}
                    />
                );
            case 4:
                return (
                    <ResumeBioForm value={bio} onChange={setBio} />
                );
            case 5:
                return (
                    <SkillsSelection
                        skills={skillsCatalog}
                        selectedSkills={selectedSkills}
                        onToggle={(id) => {
                            setSelectedSkills((prev) => (
                                prev.some((item) => String(item) === String(id))
                                    ? prev.filter((item) => String(item) !== String(id))
                                    : [...prev, id]
                            ));
                        }}
                    />
                );
            case 6:
                return (
                    <ExperienceForm
                        values={experienceDraft}
                        items={experiences}
                        companies={companiesCatalog}
                        onChange={(patch) => {
                            setExperienceDraft((prev) => {
                                const next = { ...prev, ...patch };
                                saveExperienceDraft(studentId, next);
                                return next;
                            });
                        }}
                        onAdd={handleAddExperience}
                    />
                );
            case 7:
                return (
                    <EducationForm
                        values={educationDraft}
                        educations={educationsCatalog}
                        onChange={(patch) => {
                            setEducationDraft((prev) => ({ ...prev, ...patch }));
                        }}
                        onAdd={handleAddEducation}
                    />
                );
            default:
                return null;
        }
    })();

    const right = (() => {
        if (step <= 3) {
            return (
                <CardPreview
                    firstName={profile.firstName || 'Имя'}
                    lastName={profile.lastName || 'Фамилия'}
                    specialty={specialtyName}
                    course={profile.course}
                    photoSrc={photoPreview}
                />
            );
        }
        if (step === 5) {
            return (
                <SkillsAside
                    skills={skillsCatalog}
                    selectedSkills={selectedSkills}
                    memoItems={MEMO_BY_STEP[5] || []}
                    onToggle={(id) => {
                        setSelectedSkills((prev) =>
                            prev.filter((item) => String(item) !== String(id))
                        );
                    }}
                />
            );
        }
        return (
            <MemoBlock
                title="Памятка"
                items={MEMO_BY_STEP[step] || []}
            />
        );
    })();

    return (
        <Layout>
            <Header
                resumeComplete={resumeComplete}
                onMessagesClick={() => navigate('/chats')}
                onAvatarClick={() => navigate('/settings')}
            />
            <div className="studentCreatorLayout__content">
                <div className="studentCreatorLayout__stage">
                    <Grid left={left} right={right} />
                    <StepperFooter
                        currentStep={step}
                        totalSteps={TOTAL_STEPS}
                        showSkip={step === 6}
                        nextHidden={false}
                        nextDisabled={saving || !currentStepValid}
                        onBack={handleBack}
                        onNext={handleNext}
                        onSkip={handleNext}
                        onSave={handleSaveProgress}
                    />
                </div>
            </div>
            <div
                className={
                    `studentCreatorSaveToast${toast.visible ? ' is-visible' : ''}`
                    + (toast.error ? ' is-error' : '')
                }
                role="status"
                aria-live="polite"
            >
                {toast.text}
            </div>
            {cropSrc ? (
                <PhotoCropModal
                    src={cropSrc}
                    onCrop={handleCropConfirm}
                    onReset={handleCropReset}
                />
            ) : null}
        </Layout>
    );
};

export default ResumeCreator;
