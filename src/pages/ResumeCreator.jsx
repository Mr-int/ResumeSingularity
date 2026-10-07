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

const TOTAL_STEPS = 7;

const PHOTO_EXAMPLES = [
    { id: 'correct-1', src: correctPhoto, status: 'correct', alt: 'Удачный пример фото' },
    { id: 'correct-2', src: correctPhoto2, status: 'correct', alt: 'Удачный пример фото' },
    { id: 'wrong-1', src: wrongPhoto, status: 'wrong', alt: 'Неудачный пример фото' },
];

const MOCK_SPECIALTIES = [
    { id: 1, name: 'Backend' },
    { id: 2, name: 'Frontend' },
    { id: 3, name: 'Data Science' },
    { id: 4, name: 'Mobile' },
    { id: 5, name: 'DevOps' },
    { id: 6, name: 'QA / Testing' },
    { id: 7, name: 'Product Design' },
    { id: 8, name: 'System Analyst' },
    { id: 9, name: 'ML Engineer' },
    { id: 10, name: 'Cybersecurity' },
    { id: 11, name: 'Game Development' },
    { id: 12, name: 'Fullstack' },
];

const MOCK_SKILLS = [
    { id: 1, name: 'Python' },
    { id: 2, name: 'JavaScript' },
    { id: 3, name: 'React' },
    { id: 4, name: 'SQL' },
    { id: 5, name: 'Docker' },
    { id: 6, name: 'Git' },
    { id: 7, name: 'TypeScript' },
    { id: 8, name: 'Java' },
];

const MOCK_EDUCATIONS = [
    { id: 1, institution: 'МГУ' },
    { id: 2, institution: 'МФТИ' },
    { id: 3, institution: 'ВШЭ' },
    { id: 4, institution: 'ИТМО' },
];

const MEMO_BY_STEP = {
    4: [
        { id: 'bio-1', title: 'Что писать в «О себе»?', content: 'Кратко: кто вы, чем интересны, к какой роли идёте.' },
        { id: 'bio-2', title: 'Чего избегать', content: 'Общие фразы без фактов и слишком длинный текст.' },
    ],
    5: [
        { id: 'skills-1', title: 'Сколько навыков', content: 'Достаточно 5–12 релевантных тегов, не весь список.' },
        { id: 'skills-2', title: 'Приоритет', content: 'Сначала то, что подтверждается опытом или проектами.' },
    ],
    6: [
        { id: 'exp-1', title: 'Как описать опыт', content: 'Роль, период, 1–2 конкретных результата.' },
        { id: 'exp-2', title: 'Нет опыта', content: 'Можно пропустить шаг и добавить стажировки позже.' },
    ],
    7: [
        { id: 'edu-1', title: 'Образование', content: 'Вуз и годы обучения. Курс уточняется в профиле.' },
        { id: 'edu-2', title: 'Несколько вузов', content: 'Добавляйте записи по одной.' },
    ],
};

/**
 * PLUG-страница: локальная сборка resumeCreator без модерации админа и без API.
 * Маршрут: /plug
 */
const ResumeCreator = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [saveToastVisible, setSaveToastVisible] = useState(false);
    const saveToastTimerRef = useRef(null);
    const [resumeComplete, setResumeComplete] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [cropSrc, setCropSrc] = useState(null);
    const cropDraftUrlRef = useRef(null);
    const [bio, setBio] = useState('');
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [experienceDraft, setExperienceDraft] = useState({});
    const [educationDraft, setEducationDraft] = useState({});
    const [experiences, setExperiences] = useState([]);
    const [educationsAdded, setEducationsAdded] = useState([]);

    const [profile, setProfile] = useState({
        firstName: '',
        lastName: '',
        city: '',
        birthDate: '',
        course: '',
        gender: '',
        specialityId: null,
    });

    const specialtyName = useMemo(() => {
        const found = MOCK_SPECIALTIES.find((item) => String(item.id) === String(profile.specialityId));
        return found?.name || 'Специализация';
    }, [profile.specialityId]);

    const primarySkill = useMemo(() => {
        const firstId = selectedSkills[0];
        const skill = MOCK_SKILLS.find((item) => String(item.id) === String(firstId));
        if (!skill) return { code: '—', label: 'Навык' };
        return {
            code: skill.name.slice(0, 2).toUpperCase(),
            label: skill.name,
        };
    }, [selectedSkills]);

    const updateProfile = (field, value) => {
        setProfile((prev) => ({ ...prev, [field]: value }));
    };

    useEffect(() => () => {
        if (saveToastTimerRef.current) {
            window.clearTimeout(saveToastTimerRef.current);
        }
    }, []);

    const handleSaveProgress = () => {
        console.log('[PLUG] save progress', {
            step,
            profile,
            bio,
            selectedSkills,
            experiences,
            educationsAdded,
        });
        setSaveToastVisible(true);
        if (saveToastTimerRef.current) {
            window.clearTimeout(saveToastTimerRef.current);
        }
        saveToastTimerRef.current = window.setTimeout(() => {
            setSaveToastVisible(false);
        }, 2500);
    };

    const canGoNextFromStep1 = Boolean(profile.course && profile.gender);

    const handleNext = () => {
        if (step === 1 && !canGoNextFromStep1) return;
        if (step >= TOTAL_STEPS) {
            setResumeComplete(true);
            return;
        }
        setStep((prev) => prev + 1);
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
        openCropModal(URL.createObjectURL(file), { isObjectUrl: true });
    };

    const handleCropConfirm = (dataUrl) => {
        setPhotoPreview(dataUrl);
        clearCropDraft();
    };

    const handleCropReset = () => {
        clearCropDraft();
        setPhotoPreview(null);
    };

    const left = (() => {
        switch (step) {
            case 1:
            case 2:
                return (
                    <StepForm
                        step={step}
                        values={profile}
                        specialties={MOCK_SPECIALTIES}
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
                        onFileSelect={handlePhotoFile}
                        onExampleSelect={(example) => {
                            if (example?.src) openCropModal(example.src);
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
                        skills={MOCK_SKILLS}
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
                        onAdd={(entry) => {
                            setExperiences((prev) => [...prev, entry]);
                            setExperienceDraft({});
                        }}
                    />
                );
            case 7:
                return (
                    <EducationForm
                        values={educationDraft}
                        educations={MOCK_EDUCATIONS}
                        onChange={(field, value) => {
                            setEducationDraft((prev) => ({ ...prev, [field]: value }));
                        }}
                        onAdd={(entry) => {
                            setEducationsAdded((prev) => [...prev, entry]);
                            setEducationDraft({});
                        }}
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
                        nextDisabled={
                            (step === 1 && !canGoNextFromStep1)
                            || (step === 5 && selectedSkills.length === 0)
                        }
                        onBack={handleBack}
                        onNext={handleNext}
                        onSkip={handleNext}
                        onSave={handleSaveProgress}
                    />
                </div>
            </div>
            <div
                className={`studentCreatorSaveToast${saveToastVisible ? ' is-visible' : ''}`}
                role="status"
                aria-live="polite"
            >
                Прогресс успешно сохранён
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
