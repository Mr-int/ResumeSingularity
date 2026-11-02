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
    ExperienceAside,
    EducationForm,
    PortfolioLinksForm,
    PortfolioLinksAside,
} from '../components/resumeCreator/index.js';
import PhotoCropModal from '../components/resumeCreator/PhotoUploader/PhotoCropModal/PhotoCropModal.jsx';
import correctPhoto from '../assets/photoExamples/CorrectPhoto.png';
import correctPhoto2 from '../assets/photoExamples/CorrectPhoto2.png';
import wrongPhoto from '../assets/photoExamples/wrongPhoto.png';
import { getImageUrl } from '../config/api.js';
import { isAllowedProfileCity } from '../constants/campusCities.js';
import { getStudentMe } from '../services/getApi.js';
import {
    completeStudentRegistration,
    patchStudentMe,
    submitStudentForReview,
    uploadStudentPhoto,
} from '../services/accountApi.js';
import { fetchAuthMe } from '../services/authApi.js';
import { resolveStudentOnboarding, STUDENT_STAGE } from '../services/studentOnboardingApi.js';
import {
    formatMissingProfileFields,
    hasRegistrationBasics,
    isStudentRegistrationCompletedLocally,
    markStudentProfileSubmitted,
    markStudentRegistrationCompleted,
} from '../utils/studentOnboarding.js';
import {
    getAllSpecialities,
    getAllEducation,
    filterSkills,
    createExperience,
    updateExperience,
    deleteExperience,
    createInstitution,
    createPortfolio,
    updatePortfolio,
    deletePortfolio,
    getAllCompanies,
    getExperienceDetailsByStudentId,
    getInstitutionsByStudentId,
    getPortfolioByStudentId,
    resolveCompanyId,
    resolveEducationId,
} from '../services/studentApi.js';
import {
    resumeValidationContext,
    validatePartialSave,
    validateResumeStep,
    validateResumeThroughStep,
} from './resumeCreatorValidation.js';
import { packExperienceAdditionalInfo } from '../utils/experienceWebUrl.js';
import { buildPortfolioPayload, normalizePortfolioItem } from '../utils/portfolio.js';
import {
    clearExperienceDraft,
    clearResumeCreatorStep,
    loadExperienceDraft,
    loadResumeCreatorStep,
    saveExperienceDraft,
    saveResumeCreatorStep,
} from './resumeCreatorStepStorage.js';

const TOTAL_STEPS = 8;

const emptyPortfolioDraft = () => ({ name: '', description: '', link: '' });

const skillEntityId = (item) => {
    if (item == null || typeof item !== 'object') return null;
    const raw = item.id ?? item.skillId;
    return raw != null ? raw : null;
};

const toPersistableSkillIds = (ids) =>
    (Array.isArray(ids) ? ids : [])
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0);

const pickExperienceId = (payload) => {
    if (payload == null || typeof payload !== 'object') return null;
    const candidates = [
        payload.id,
        payload.experienceId,
        payload.experience?.id,
        payload.data?.id,
        payload.data?.experience?.id,
    ];
    for (const raw of candidates) {
        if (raw == null || raw === '') continue;
        const num = Number(raw);
        if (Number.isFinite(num) && num > 0) return num;
        if (!String(raw).startsWith('exp-')) return raw;
    }
    return null;
};

const isPersistedExperienceId = (id) => {
    if (id == null || id === '') return false;
    const num = Number(id);
    if (Number.isFinite(num)) return num > 0;
    return !String(id).startsWith('exp-');
};

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
            title: 'Что если у меня нет опыта работы?',
            content:
                'Добавьте учебные и личные проекты во вкладке «Проектная деятельность»: название, роль, срок и ссылку на материалы. Это показывает практику даже без официального трудоустройства.',
        },
        {
            id: 'exp-2',
            title: 'Какую ссылку оставить в опыте работы?',
            content:
                'Для работы — сайт организации или публичный профиль. Для проекта — портфолио, GitHub, Figma или демо. Ссылка должна открываться без пароля.',
        },
        {
            id: 'exp-3',
            title: 'Подойдет ли неофициальное трудоустройство?',
            content:
                'Да. Укажите организацию, роль и задачи так же, как при официальной работе. Важно описать результат, а не только формальный статус.',
        },
        {
            id: 'exp-4',
            title: 'На сколько важно иметь опыт работы в резюме?',
            content:
                'Опыт и проекты — ключевой блок для рекрутера. Даже короткий релевантный кейс сильнее длинного списка курсов без практики.',
        },
        {
            id: 'exp-5',
            title: 'Что представляет из себя опыт работы?',
            content:
                'Это подтверждённая практика: где вы работали или какой проект делали, в какой роли, сколько длилось и какой был результат.',
        },
    ],
    7: [
        {
            id: 'edu-1',
            title: 'Что если у меня нет высшего образования?',
            content:
                'Укажите среднее профессиональное образование или добавьте релевантные образовательные курсы во вкладке «Образовательные курсы». Для многих junior-позиций важнее навыки и проекты, чем диплом.',
        },
        {
            id: 'edu-2',
            title: 'Какой год окончания выбрать, если ещё не окончил?',
            content:
                'Укажите планируемый год выпуска. Если точная дата неизвестна, поставьте текущий или следующий учебный год — это нормальная практика для студентов.',
        },
        {
            id: 'edu-3',
            title: 'Подойдут ли неофициальные курсы?',
            content:
                'Да, если курс дал применимые навыки. Укажите название, платформу и ссылку; при наличии приложите сертификат — так проще подтвердить обучение на собеседовании.',
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
 * Маршрут: /resume/create (ProtectedRoute)
 */
const ResumeCreator = () => {
    const navigate = useNavigate();
    const [bootLoading, setBootLoading] = useState(true);
    const [bootError, setBootError] = useState('');
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState({ visible: false, text: '', error: false });
    const toastTimerRef = useRef(null);
    /** Нужен POST complete-registration (письмо), если basics ещё не были на карточке. */
    const needsCompleteRegistrationRef = useRef(false);

    const [step, setStep] = useState(1);
    /** Дальше этого шага по клику на прогресс нельзя — пока не пройдены обязательные шаги. */
    const [maxReachedStep, setMaxReachedStep] = useState(1);
    const [resumeComplete, setResumeComplete] = useState(false);
    const [studentId, setStudentId] = useState(null);
    /** Город с сервера при boot — старые профили вне кампусного списка не блокируем. */
    const [legacyCity, setLegacyCity] = useState('');
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
    const [hhLink, setHhLink] = useState('');
    const [portfolios, setPortfolios] = useState([]);
    const [portfolioDraft, setPortfolioDraft] = useState(emptyPortfolioDraft);
    const [editingPortfolioId, setEditingPortfolioId] = useState(null);
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [experienceDraft, setExperienceDraft] = useState({});
    const [educationDraft, setEducationDraft] = useState({});
    const [experiences, setExperiences] = useState([]);
    const [editingExperienceId, setEditingExperienceId] = useState(null);
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
            hhLink,
            selectedSkills,
            photoPreview,
            educationsAdded,
            savedInstitutionCount,
            legacyCity,
        }),
        [
            profile, bio, hhLink,
            selectedSkills, photoPreview, educationsAdded, savedInstitutionCount, legacyCity,
        ],
    );

    /**
     * Уже посещённые шаги + следующий, если все обязательные до него заполнены.
     * Нельзя перепрыгнуть незаполненные обязательные шаги.
     */
    const maxReachableStep = useMemo(() => {
        let max = Math.max(1, maxReachedStep, step);
        for (let candidate = max + 1; candidate <= TOTAL_STEPS; candidate += 1) {
            if (candidate <= 1) {
                max = candidate;
                continue;
            }
            const prevOk = validateResumeThroughStep(candidate - 1, validationCtx).valid;
            if (!prevOk) break;
            max = candidate;
        }
        return Math.min(TOTAL_STEPS, max);
    }, [maxReachedStep, step, validationCtx]);

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
                try {
                    const gate = await resolveStudentOnboarding();
                    if (cancelled) return;
                    if (gate.stage === STUDENT_STAGE.CONFIRM_EMAIL && gate.path) {
                        navigate(gate.path, { replace: true });
                        return;
                    }
                    needsCompleteRegistrationRef.current = gate.stage === STUDENT_STAGE.COMPLETE_REGISTRATION
                        || (
                            gate.authMe?.id
                            && !isStudentRegistrationCompletedLocally(gate.authMe.id)
                            && !hasRegistrationBasics(gate.studentMe)
                        );
                } catch {
                    /* не-студент или сеть — продолжаем обычный boot */
                }

                const me = await getStudentMe();
                const [specs, skillsPage, edus, institutions, experienceDetails, companies, portfolio] = await Promise.all([
                    getAllSpecialities(),
                    filterSkills({}, { page: 0, size: 500 }),
                    getAllEducation(),
                    getInstitutionsByStudentId(me.id),
                    getExperienceDetailsByStudentId(me.id),
                    getAllCompanies(),
                    getPortfolioByStudentId(me.id),
                ]);
                if (cancelled) return;

                setStudentId(me.id);
                setPortfolios(
                    (Array.isArray(portfolio) ? portfolio : [])
                        .map(normalizePortfolioItem)
                        .filter((item) => item.name || item.link || item.description),
                );
                setHhLink(me.hhLink || '');
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
                        ? experienceDetails
                            .map((item) => ({
                                id: pickExperienceId(item),
                                companyId: item.companyId,
                                companyName: item.company || '',
                                companyUrl: item.webUrl || item.companyUrl || '',
                                position: item.position || '',
                                startDate: item.startDate || '',
                                endDate: item.current || item.endDate === 'по настоящее время'
                                    ? ''
                                    : (item.endDate || ''),
                                additionalInfo: item.description || '',
                                experienceType: item.experienceType === 'PROJECT' ? 'PROJECT' : 'WORK',
                                activityKind: item.activityKind === 'project' || item.experienceType === 'PROJECT'
                                    ? 'project'
                                    : 'work',
                            }))
                            .filter((item) => isPersistedExperienceId(item.id))
                        : [],
                );
                const restoredExperienceDraft = loadExperienceDraft(me.id);
                if (restoredExperienceDraft) {
                    setExperienceDraft(restoredExperienceDraft);
                    const draftEditId = pickExperienceId(restoredExperienceDraft);
                    if (isPersistedExperienceId(draftEditId)) {
                        setEditingExperienceId(draftEditId);
                    }
                }
                const resolvedSpecialityId = me.specialityId
                    ?? me.speciality?.id
                    ?? null;
                setLegacyCity((me.city || '').trim());
                setProfile({
                    firstName: me.firstName || '',
                    lastName: me.lastName || '',
                    city: me.city || '',
                    birthDate: me.birthDate || '',
                    course: me.course === 'NEW' ? 'FIFTH' : (me.course || ''),
                    gender: me.gender || '',
                    specialityId: resolvedSpecialityId,
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
                if (savedStep) {
                    setStep(savedStep);
                    setMaxReachedStep(savedStep);
                }
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
        if (isAllowedProfileCity(profile.city, legacyCity)) {
            body.city = profile.city.trim();
        }
        if (profile.birthDate) body.birthDate = profile.birthDate;
        if (profile.course) body.course = toApiCourse(profile.course);
        if (profile.gender) body.gender = profile.gender;
        body.busyness = profile.busyness || 'FREE';
        if (profile.specialityId != null && profile.specialityId !== '') {
            body.specialityId = Number(profile.specialityId);
        }
        if (bio?.trim()) body.bio = bio.trim();
        if (hhLink?.trim()) body.hhLink = hhLink.trim();
        return body;
    };

    const applyMeToProfile = (me, { keepLocalSkills = false } = {}) => {
        if (!me) return;
        if (me.city?.trim()) setLegacyCity(me.city.trim());
        setProfile((prev) => ({
            ...prev,
            firstName: me.firstName ?? prev.firstName,
            lastName: me.lastName ?? prev.lastName,
            city: me.city ?? prev.city,
            birthDate: me.birthDate ?? prev.birthDate,
            course: me.course === 'NEW' ? 'FIFTH' : (me.course ?? prev.course),
            gender: me.gender ?? prev.gender,
            specialityId: me.specialityId ?? me.speciality?.id ?? prev.specialityId,
            busyness: me.busyness ?? prev.busyness,
        }));
        if (me.bio != null) setBio(me.bio);
        if (me.hhLink != null) setHhLink(me.hhLink);
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

    const refreshPortfolios = async () => {
        if (!studentId) return [];
        const list = await getPortfolioByStudentId(studentId);
        const normalized = (Array.isArray(list) ? list : [])
            .map(normalizePortfolioItem)
            .filter((item) => item.name || item.link || item.description);
        setPortfolios(normalized);
        return normalized;
    };

    const savePortfolioBody = async (body) => {
        const send = (payload) => (
            editingPortfolioId != null
                ? updatePortfolio(editingPortfolioId, payload)
                : createPortfolio(payload)
        );

        const trySend = async (payload) => {
            try {
                return await send(payload);
            } catch (err) {
                if (!(err?.status === 400 || err?.status === 422)) throw err;
                // Убираем опциональные алиасы, которые старый API может не принимать.
                const rest = { ...payload };
                delete rest.title;
                delete rest.url;
                delete rest.additionalInfo;
                delete rest.description;
                if (!rest.name && payload.title) rest.name = payload.title;
                if (!rest.link && payload.url) rest.link = payload.url;
                // Если без description тоже 400 — пробуем только обязательный минимум.
                try {
                    return await send(rest);
                } catch (err2) {
                    if (!(err2?.status === 400 || err2?.status === 422)) throw err2;
                    return send({
                        studentId: payload.studentId,
                        name: payload.name || payload.title,
                        link: payload.link || payload.url,
                    });
                }
            }
        };

        return trySend(body);
    };

    const commitPortfolioDraft = async ({ requireContent = false } = {}) => {
        const built = buildPortfolioPayload({
            ...portfolioDraft,
            studentId,
        });
        if (built.empty) {
            if (requireContent) {
                showToast('Введите название и ссылку', { error: true });
                return false;
            }
            return true;
        }
        if (built.error) {
            showToast(built.error, { error: true });
            return false;
        }

        const created = await savePortfolioBody(built.body);
        const createdId = created?.id ?? created?.portfolioId ?? editingPortfolioId;
        const localItem = {
            id: createdId ?? `local-${Date.now()}`,
            ...built.local,
        };

        // Сразу показываем то, что ввёл пользователь — даже если API name не вернул.
        setPortfolios((prev) => {
            if (editingPortfolioId != null) {
                return prev.map((item) => (
                    String(item.id) === String(editingPortfolioId)
                        ? { ...item, ...localItem, id: item.id }
                        : item
                ));
            }
            const withoutDup = prev.filter((item) => (
                String(item.link) !== String(localItem.link)
                || String(item.name) !== String(localItem.name)
            ));
            return [...withoutDup, localItem];
        });

        setPortfolioDraft(emptyPortfolioDraft());
        setEditingPortfolioId(null);

        const refreshed = await refreshPortfolios();
        // Если после refresh имя пропало — дозаписываем packed description и оставляем локальное имя в UI.
        const matched = refreshed.find((item) => (
            (createdId != null && String(item.id) === String(createdId))
            || String(item.link) === String(localItem.link)
        ));
        if (matched?.id != null && !matched.name) {
            await updatePortfolio(matched.id, {
                studentId,
                link: localItem.link,
                url: localItem.link,
                name: localItem.name,
                title: localItem.name,
                description: built.body.description,
                additionalInfo: built.body.description,
            }).catch(() => null);
            const again = await refreshPortfolios();
            const stillMissing = again.find((item) => String(item.id) === String(matched.id));
            if (stillMissing && !stillMissing.name) {
                setPortfolios((prev) => prev.map((item) => (
                    String(item.id) === String(matched.id)
                        ? { ...item, name: localItem.name, description: localItem.description, link: localItem.link }
                        : item
                )));
            }
        } else if (matched?.id != null) {
            // Подтягиваем серверный id, имя уже есть.
            setPortfolios((prev) => {
                const hasMatched = prev.some((item) => String(item.id) === String(matched.id));
                if (hasMatched) return prev;
                return prev.map((item) => (
                    String(item.link) === String(localItem.link)
                        ? { ...item, id: matched.id }
                        : item
                ));
            });
        }
        return true;
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
                if (
                    step === 1
                    && needsCompleteRegistrationRef.current
                    && profile.birthDate
                    && profile.course
                    && isAllowedProfileCity(profile.city, legacyCity)
                ) {
                    try {
                        await completeStudentRegistration({
                            birthDate: profile.birthDate,
                            course: toApiCourse(profile.course),
                            city: profile.city.trim(),
                        });
                        const me = await fetchAuthMe();
                        markStudentRegistrationCompleted(me?.id);
                        needsCompleteRegistrationRef.current = false;
                    } catch (regErr) {
                        showToast(regErr?.message || 'Не удалось завершить регистрацию', { error: true });
                        return;
                    }
                }
            }
            if (step === 6) {
                await flushExperienceDraftIfReady();
            }
            if (step >= TOTAL_STEPS) {
                const saved = await commitPortfolioDraft();
                if (!saved) return;
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

                let authMe = null;
                try {
                    authMe = await fetchAuthMe();
                } catch {
                    authMe = null;
                }
                const pending = String(authMe?.accountStatus || '').toUpperCase() === 'PENDING_APPROVAL';

                if (pending) {
                    // communication-readiness временно не блокируем — сразу submit-for-review
                    let submitted = false;
                    try {
                        await submitStudentForReview();
                        submitted = true;
                    } catch (submitErr) {
                        const body = submitErr?.responseBody;
                        if (submitErr?.status === 403 && body?.code === 'PROFILE_INCOMPLETE') {
                            const missing = formatMissingProfileFields(body.missingFields);
                            showToast(
                                missing
                                    ? `Резюме сохранено. Для модерации ещё нужно: ${missing}`
                                    : (body.message || 'Резюме сохранено. Дозаполните профиль для модерации'),
                                { error: true },
                            );
                        } else {
                            showToast(
                                submitErr?.message || 'Резюме сохранено, но отправить на проверку не удалось',
                                { error: true },
                            );
                        }
                    }

                    // После полного прохождения мастера — в ЛК; локальная метка, чтобы логин не вернул в мастер
                    markStudentProfileSubmitted(authMe?.id);
                    clearResumeCreatorStep(studentId);
                    clearExperienceDraft(studentId);
                    setResumeComplete(true);
                    if (submitted) {
                        showToast('Анкета отправлена на проверку');
                    }
                    navigate('/profile', { replace: true });
                    return;
                }

                clearResumeCreatorStep(studentId);
                clearExperienceDraft(studentId);
                setResumeComplete(true);
                showToast('Резюме сохранено');
                navigate('/profile', { replace: true });
                return;
            }
            const nextStep = step + 1;
            saveResumeCreatorStep(studentId, nextStep);
            setMaxReachedStep((prev) => Math.max(prev, nextStep));
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

    const handleStepSelect = (targetStep) => {
        if (saving) return;
        if (targetStep < 1 || targetStep > TOTAL_STEPS) return;
        if (targetStep > maxReachableStep) {
            showToast('Сначала заполните предыдущие шаги', { error: true });
            return;
        }
        if (targetStep === step) return;
        saveResumeCreatorStep(studentId, targetStep);
        setMaxReachedStep((prev) => Math.max(prev, targetStep));
        setStep(targetStep);
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
        // ExperienceReq в API без webUrl — кладём ссылку в additionalInfo маркером
        const additionalInfo = packExperienceAdditionalInfo(
            entry.additionalInfo || '',
            entry.companyUrl || entry.webUrl || '',
        );

        const experienceType = entry.experienceType === 'PROJECT'
            || entry.activityKind === 'project'
            ? 'PROJECT'
            : 'WORK';

        const body = {
            studentId,
            companyId,
            position: entry.position.trim(),
            startDate: entry.startDate,
            experienceType,
        };
        if (additionalInfo) body.additionalInfo = additionalInfo;
        if (entry.endDate) body.endDate = entry.endDate;
        return { body, companyName, companyId, experienceType };
    };

    const rememberCompany = (companyId, companyName) => {
        if (!companyId || !companyName) return;
        setCompaniesCatalog((prev) => (
            prev.some((item) => Number(item.id) === Number(companyId))
                ? prev
                : [...prev, { id: companyId, name: companyName }]
        ));
    };

    const clearExperienceEditor = () => {
        setEditingExperienceId(null);
        setExperienceDraft({});
        clearExperienceDraft(studentId);
    };

    const resolveEditingExperienceId = (entry = {}) => {
        if (isPersistedExperienceId(editingExperienceId)) return editingExperienceId;
        if (isPersistedExperienceId(entry.id)) return entry.id;
        if (isPersistedExperienceId(experienceDraft.id)) return experienceDraft.id;
        return null;
    };

    const validateExperienceEntry = (entry) => {
        const isProject = entry?.experienceType === 'PROJECT' || entry?.activityKind === 'project';
        if (!entry?.companyName?.trim() && !(Number(entry?.companyId) > 0)) {
            return isProject ? 'Укажите название проекта' : 'Укажите компанию';
        }
        if (!entry?.position?.trim() || !entry?.startDate) {
            return isProject
                ? 'Укажите роль и дату начала'
                : 'Укажите должность и дату начала';
        }
        return '';
    };

    /** Создание нового опыта → очистка формы. */
    const persistExperienceEntry = async (entry) => {
        const { body, companyName, companyId } = await buildExperienceBody(entry);
        const created = await createExperience(body);
        const id = pickExperienceId(created);
        if (!isPersistedExperienceId(id)) {
            throw new Error('Сервер не вернул id опыта — обновите страницу');
        }
        const experienceType = body.experienceType === 'PROJECT' ? 'PROJECT' : 'WORK';
        const saved = {
            ...entry,
            id,
            companyId: companyId || entry.companyId,
            companyName: companyName || entry.companyName || '',
            experienceType,
            activityKind: experienceType === 'PROJECT' ? 'project' : 'work',
        };
        setExperiences((prev) => [...prev, saved]);
        rememberCompany(saved.companyId, saved.companyName);
        clearExperienceEditor();
        return saved;
    };

    /** Обновление существующего опыта → очистка формы (режим создания). */
    const persistExperienceUpdate = async (entry, id) => {
        const { body, companyName, companyId } = await buildExperienceBody(entry);
        await updateExperience(id, body);
        const experienceType = body.experienceType === 'PROJECT' ? 'PROJECT' : 'WORK';
        const saved = {
            ...entry,
            id,
            companyId: companyId || entry.companyId,
            companyName: companyName || entry.companyName || '',
            experienceType,
            activityKind: experienceType === 'PROJECT' ? 'project' : 'work',
        };
        setExperiences((prev) =>
            prev.map((item) => (String(item.id) === String(id) ? { ...item, ...saved } : item)),
        );
        rememberCompany(saved.companyId, saved.companyName);
        clearExperienceEditor();
        return saved;
    };

    /**
     * Сохранить черновик опыта: если editingExperienceId — UPDATE, иначе CREATE.
     * Вызывается и из «Сохранить прогресс», и при «Далее» на шаге 6.
     */
    const flushExperienceDraftIfReady = async () => {
        const entry = {
            companyId: experienceDraft.companyId || undefined,
            companyName: (experienceDraft.companyName || '').trim(),
            companyUrl: (experienceDraft.companyUrl || '').trim(),
            position: (experienceDraft.position || '').trim(),
            additionalInfo: experienceDraft.additionalInfo || '',
            startDate: experienceDraft.startDate || '',
            endDate: experienceDraft.endDate || undefined,
            activityKind: experienceDraft.activityKind === 'project' ? 'project' : 'work',
            id: experienceDraft.id,
        };
        const isEmpty = !entry.position && !entry.startDate && !entry.companyName
            && !(Number(entry.companyId) > 0) && !String(entry.additionalInfo || '').trim()
            && !entry.companyUrl;
        if (isEmpty) {
            clearExperienceDraft(studentId);
            return false;
        }
        if (!entry.position || !entry.startDate) {
            saveExperienceDraft(studentId, { ...experienceDraft, id: editingExperienceId ?? experienceDraft.id });
            return false;
        }
        if (!entry.companyName && !(Number(entry.companyId) > 0)) {
            saveExperienceDraft(studentId, { ...experienceDraft, id: editingExperienceId ?? experienceDraft.id });
            return false;
        }

        const editId = resolveEditingExperienceId(entry);
        if (editId != null) {
            await persistExperienceUpdate(entry, editId);
        } else {
            await persistExperienceEntry(entry);
        }
        return true;
    };

    const handleSelectExperience = (item) => {
        if (!item) return;
        const id = pickExperienceId(item);
        if (!isPersistedExperienceId(id)) {
            showToast('У этой записи нет id — обновите страницу', { error: true });
            return;
        }
        setEditingExperienceId(id);
        const next = {
            id,
            companyId: item.companyId != null ? String(item.companyId) : '',
            companyName: item.companyName || '',
            companyUrl: item.companyUrl || '',
            position: item.position || '',
            startDate: item.startDate || '',
            endDate: item.endDate || '',
            additionalInfo: item.additionalInfo || '',
            experienceType: item.experienceType === 'PROJECT' ? 'PROJECT' : 'WORK',
            activityKind: item.activityKind === 'project' || item.experienceType === 'PROJECT'
                ? 'project'
                : 'work',
        };
        setExperienceDraft(next);
        saveExperienceDraft(studentId, next);
    };

    const handleAddExperience = async (entry) => {
        const error = validateExperienceEntry(entry);
        if (error) {
            showToast(error, { error: true });
            return;
        }
        setSaving(true);
        try {
            await persistExperienceEntry(entry);
            showToast('Опыт добавлен');
        } catch (err) {
            showToast(err?.message || 'Не удалось добавить опыт', { error: true });
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateExperience = async (entry) => {
        const id = resolveEditingExperienceId(entry);
        if (!isPersistedExperienceId(id)) {
            showToast('Нельзя обновить запись без id', { error: true });
            return;
        }
        const error = validateExperienceEntry(entry);
        if (error) {
            showToast(error, { error: true });
            return;
        }
        setSaving(true);
        try {
            await persistExperienceUpdate(entry, id);
            showToast('Опыт обновлён');
        } catch (err) {
            showToast(err?.message || 'Не удалось обновить опыт', { error: true });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteExperience = async (item) => {
        const id = pickExperienceId(item);
        if (!isPersistedExperienceId(id)) {
            showToast('Нельзя удалить запись без id', { error: true });
            return;
        }
        setSaving(true);
        try {
            await deleteExperience(id);
            setExperiences((prev) => prev.filter((row) => String(row.id) !== String(id)));
            if (String(editingExperienceId) === String(id)) {
                clearExperienceEditor();
            }
            showToast('Опыт удалён');
        } catch (err) {
            showToast(err?.message || 'Не удалось удалить опыт', { error: true });
        } finally {
            setSaving(false);
        }
    };

    const handleAddEducation = async (entry) => {
        const kind = entry?.educationKind === 'course' ? 'course' : 'gov';
        const institutionName = entry?.institutionName?.trim() || '';
        if (kind === 'course') {
            if (!entry?.courseName?.trim() && !entry?.platform?.trim()) {
                showToast('Укажите название курса или платформу', { error: true });
                return;
            }
        } else if (!(Number(entry?.educationId) > 0) && !institutionName) {
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
            const educationType = kind === 'course' ? 'COURSE' : 'STATE';
            const direction = (entry.direction || entry.courseName || '').trim();
            const educationLevel = (entry.educationLevel || '').trim();
            const created = await createInstitution({
                studentId,
                educationId,
                startYear: entry.startYear,
                endYear: entry.endYear,
                educationType,
                ...(direction ? { direction } : {}),
                ...(educationLevel ? { educationLevel } : {}),
            });
            const resolvedName = educationsCatalog.find(
                (item) => Number(item.id) === Number(educationId),
            )?.institution || institutionName;

            setEducationsAdded((prev) => [...prev, {
                ...entry,
                educationKind: kind,
                educationType,
                direction,
                educationLevel,
                educationId,
                institutionName: resolvedName,
                id: created?.institution?.id || created?.educationId || educationId,
            }]);
            setEducationDraft({ educationKind: kind });
            showToast(kind === 'course' ? 'Курс добавлен' : 'Образование добавлено');
        } catch (err) {
            showToast(err?.message || 'Не удалось добавить образование', { error: true });
        } finally {
            setSaving(false);
        }
    };

    const handlePortfolioSubmit = async () => {
        if (saving) return;
        const wasEditing = editingPortfolioId != null;
        setSaving(true);
        try {
            const saved = await commitPortfolioDraft({ requireContent: true });
            if (saved) showToast(wasEditing ? 'Ссылка обновлена' : 'Ссылка добавлена');
        } catch (err) {
            showToast(err?.message || 'Не удалось сохранить ссылку', { error: true });
        } finally {
            setSaving(false);
        }
    };

    const handleEditPortfolio = (item) => {
        if (item?.id == null) {
            showToast('У этой ссылки нет id — обновите страницу', { error: true });
            return;
        }
        setEditingPortfolioId(item.id);
        setPortfolioDraft({
            name: item.name || '',
            description: item.description || '',
            link: item.link || '',
        });
    };

    const handleDeletePortfolio = async (item) => {
        if (item?.id == null) {
            showToast('Нельзя удалить ссылку без id', { error: true });
            return;
        }
        setSaving(true);
        try {
            await deletePortfolio(item.id);
            setPortfolios((prev) => prev.filter((row) => String(row.id) !== String(item.id)));
            if (String(editingPortfolioId) === String(item.id)) {
                setEditingPortfolioId(null);
                setPortfolioDraft(emptyPortfolioDraft());
            }
            showToast('Ссылка удалена');
        } catch (err) {
            showToast(err?.message || 'Не удалось удалить ссылку', { error: true });
        } finally {
            setSaving(false);
        }
    };

    if (bootLoading) {
        return (
            <Layout>
                <Header resumeComplete={false} onMessagesClick={() => navigate('/chats')} onAvatarClick={() => navigate('/profile')} />
                <div className="studentCreatorLayout__content">
                    <p style={{ color: '#8e8e93' }}>Загружаем резюме…</p>
                </div>
            </Layout>
        );
    }

    if (bootError) {
        return (
            <Layout>
                <Header resumeComplete={false} onMessagesClick={() => navigate('/chats')} onAvatarClick={() => navigate('/profile')} />
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
                    <ResumeBioForm
                        value={bio}
                        hhLink={hhLink}
                        onChange={setBio}
                        onHhLinkChange={setHhLink}
                    />
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
                        companies={companiesCatalog}
                        editingId={editingExperienceId}
                        onChange={(patch) => {
                            setExperienceDraft((prev) => {
                                const next = {
                                    ...prev,
                                    ...patch,
                                    id: editingExperienceId ?? prev.id,
                                };
                                saveExperienceDraft(studentId, next);
                                return next;
                            });
                        }}
                        onAdd={handleAddExperience}
                        onUpdate={handleUpdateExperience}
                        onCancelEdit={clearExperienceEditor}
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
            case 8:
                return (
                    <PortfolioLinksForm
                        name={portfolioDraft.name}
                        description={portfolioDraft.description}
                        link={portfolioDraft.link}
                        submitLabel={
                            editingPortfolioId != null || portfolios.length === 0
                                ? 'Сохранить'
                                : 'Добавить'
                        }
                        disabled={saving}
                        onChange={(patch) => {
                            setPortfolioDraft((prev) => ({ ...prev, ...patch }));
                        }}
                        onSubmit={handlePortfolioSubmit}
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
        if (step === 6) {
            return (
                <ExperienceAside
                    items={experiences}
                    editingId={editingExperienceId}
                    memoItems={MEMO_BY_STEP[6] || []}
                    onEdit={handleSelectExperience}
                    onDelete={handleDeleteExperience}
                />
            );
        }
        if (step === 8) {
            return (
                <PortfolioLinksAside
                    items={portfolios}
                    onEdit={handleEditPortfolio}
                    onDelete={handleDeletePortfolio}
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
                avatarSrc={photoPreview || undefined}
                onMessagesClick={() => navigate('/chats')}
                onAvatarClick={() => navigate('/profile')}
            />
            <div className="studentCreatorLayout__content">
                <div className="studentCreatorLayout__stage">
                    <Grid left={left} right={right} />
                    <StepperFooter
                        currentStep={step}
                        totalSteps={TOTAL_STEPS}
                        maxReachableStep={maxReachableStep}
                        showSkip={step === 6}
                        nextHidden={false}
                        nextDisabled={saving}
                        onBack={handleBack}
                        onNext={handleNext}
                        onSkip={handleNext}
                        onSave={handleSaveProgress}
                        onStepSelect={handleStepSelect}
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
