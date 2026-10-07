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
    ExperienceForm,
    EducationForm,
} from '../components/resumeCreator/index.js';
import PhotoCropModal from '../components/resumeCreator/PhotoUploader/PhotoCropModal/PhotoCropModal.jsx';
import correctPhoto from '../assets/photoExamples/CorrectPhoto.png';
import correctPhoto2 from '../assets/photoExamples/CorrectPhoto2.png';
import wrongPhoto from '../assets/photoExamples/wrongPhoto.png';
import { getImageUrl } from '../config/api.js';
import { getStudentMe } from '../services/getApi.js';
import { patchStudentMe, uploadStudentPhoto } from '../services/accountApi.js';
import {
    getAllSpecialities,
    getAllEducation,
    filterSkills,
    createCompany,
    createExperience,
    createInstitution,
    getInstitutionsByStudentId,
} from '../services/studentApi.js';
import {
    resumeValidationContext,
    validateResumeStep,
    validateResumeThroughStep,
} from './resumeCreatorValidation.js';

const TOTAL_STEPS = 7;

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
            tone: 'success',
            title: 'Какие навыки указывать?',
            bullets: [
                'Достаточно 5–12 релевантных тегов, не весь список технологий.',
                'Сначала то, что подтверждается опытом или проектами.',
            ],
        },
        {
            id: 'skills-2',
            tone: 'error',
            title: 'Чего избегать в навыках?',
            bullets: [
                'Устаревшие инструменты без контекста и навыки, не связанные с выбранной специальностью.',
            ],
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

    const primarySkill = useMemo(() => {
        const firstId = selectedSkills[0];
        const skill = skillsCatalog.find((item) => String(item.id) === String(firstId));
        if (!skill) return { code: '—', label: 'Навык' };
        return {
            code: skill.name.slice(0, 2).toUpperCase(),
            label: skill.name,
        };
    }, [selectedSkills, skillsCatalog]);

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
                const [specs, skillsPage, edus, institutions] = await Promise.all([
                    getAllSpecialities(),
                    filterSkills({}, { page: 0, size: 500 }),
                    getAllEducation(),
                    getInstitutionsByStudentId(me.id),
                ]);
                if (cancelled) return;

                setStudentId(me.id);
                setSpecialties(Array.isArray(specs) ? specs : []);
                setSkillsCatalog(Array.isArray(skillsPage?.data) ? skillsPage.data : []);
                setEducationsCatalog(Array.isArray(edus) ? edus : []);

                setSavedInstitutionCount(Array.isArray(institutions) ? institutions.length : 0);
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
                    Array.isArray(me.skills)
                        ? me.skills.map((item) => item.id).filter((id) => id != null)
                        : [],
                );
                if (me.imagePath) {
                    setPhotoPreview(getImageUrl(me.imagePath));
                    setPhotoName('avatar.jpeg');
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
        if (profile.city?.trim()) body.city = profile.city.trim();
        if (profile.birthDate) body.birthDate = profile.birthDate;
        if (profile.course) body.course = toApiCourse(profile.course);
        if (profile.gender) body.gender = profile.gender;
        body.busyness = profile.busyness || 'FREE';
        if (profile.specialityId != null && profile.specialityId !== '') {
            body.specialityId = Number(profile.specialityId);
        }
        if (bio?.trim()) body.bio = bio.trim();
        if (selectedSkills.length > 0) {
            body.skillsIds = selectedSkills.map((id) => Number(id));
        }
        return body;
    };

    const applyMeToProfile = (me) => {
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
            setSelectedSkills(me.skills.map((item) => item.id).filter((id) => id != null));
        }
    };

    const persistProfile = async () => {
        const body = buildPatchBody();
        const sentCity = body.city;
        await patchStudentMe(body);
        const me = await getStudentMe();
        applyMeToProfile(me);
        return {
            cityMismatch: Boolean(sentCity && me.city !== sentCity),
            actualCity: me.city,
        };
    };

    const handleSaveProgress = async () => {
        if (saving) return;
        const check = validateResumeThroughStep(step, validationCtx);
        if (!check.valid) {
            showToast(check.message, { error: true });
            return;
        }
        setSaving(true);
        try {
            const result = await persistProfile();
            if (result?.cityMismatch) {
                showToast(
                    `Город не обновился (на сервере: ${result.actualCity || '—'}). Выберите город из списка.`,
                    { error: true },
                );
                return;
            }
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
                const result = await persistProfile();
                if (result?.cityMismatch) {
                    showToast(
                        `Город не обновился (на сервере: ${result.actualCity || '—'}). Выберите город из списка.`,
                        { error: true },
                    );
                    return;
                }
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
                setResumeComplete(true);
                showToast('Резюме сохранено');
                navigate('/settings');
                return;
            }
            setStep((prev) => prev + 1);
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
        setStep((prev) => prev - 1);
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

    const handleAddExperience = async (entry) => {
        if (!entry?.position?.trim() || !entry?.startDate) {
            showToast('Укажите должность и дату начала', { error: true });
            return;
        }
        setSaving(true);
        try {
            let companyId = entry.companyId ? Number(entry.companyId) : undefined;
            if (!companyId && entry.companyName?.trim()) {
                const company = await createCompany({ name: entry.companyName.trim() });
                companyId = company?.id;
            }
            const created = await createExperience({
                companyId,
                position: entry.position.trim(),
                additionalInfo: entry.additionalInfo || undefined,
                startDate: entry.startDate,
                endDate: entry.endDate || undefined,
            });
            setExperiences((prev) => [...prev, { ...entry, id: created?.experience?.id || created?.id }]);
            setExperienceDraft({});
            showToast('Опыт добавлен');
        } catch (err) {
            showToast(err?.message || 'Не удалось добавить опыт', { error: true });
        } finally {
            setSaving(false);
        }
    };

    const handleAddEducation = async (entry) => {
        if (!entry?.educationId) {
            showToast('Выберите вуз', { error: true });
            return;
        }
        if (entry.startYear == null || entry.endYear == null) {
            showToast('Укажите год начала и год окончания обучения', { error: true });
            return;
        }
        setSaving(true);
        try {
            const created = await createInstitution({
                educationId: Number(entry.educationId),
                startYear: entry.startYear,
                endYear: entry.endYear,
            });
            setEducationsAdded((prev) => [...prev, { ...entry, id: created?.institution?.id || created?.educationId }]);
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
                        onChange={(field, value) => {
                            setExperienceDraft((prev) => ({ ...prev, [field]: value }));
                        }}
                        onAdd={handleAddExperience}
                    />
                );
            case 7:
                return (
                    <EducationForm
                        values={educationDraft}
                        educations={educationsCatalog}
                        onChange={(field, value) => {
                            setEducationDraft((prev) => ({ ...prev, [field]: value }));
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
                    skillCode={primarySkill.code}
                    skillLabel={primarySkill.label}
                    photoSrc={photoPreview}
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
