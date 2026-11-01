import { useEffect, useRef, useState } from 'react';
import calendarIcon from '../../../assets/icons/calendar.svg';
import linkIcon from '../../../assets/icons/link-outlined.svg';
import arrowIcon from '../../../assets/icons/arrow_small.svg';
import certificateIcon from '../../../assets/icons/certificate-upload.svg';
import './educationForm.css';

const EDUCATION_LEVELS = [
    'Среднее профессиональное',
    'Бакалавриат',
    'Специалитет',
    'Магистратура',
    'Аспирантура',
];

const COURSE_PLATFORMS = [
    'Skypro',
    'Нетология Практикум',
    'GeekBrains',
    'Skillbox',
    'Stepik',
    'Coursera',
    'Другое',
];

const currentYear = new Date().getFullYear();

const EducationForm = ({
    values = {},
    educations = [],
    onChange,
    onAdd,
}) => {
    const {
        educationKind = 'gov',
        educationId = '',
        institutionName = '',
        direction = '',
        educationLevel = '',
        webUrl = '',
        courseName = '',
        courseLink = '',
        platform = '',
        startYear = '',
        endYear = '',
        certificateName = '',
        certificatePreview = '',
    } = values;

    const fileInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const selectedKind = educationKind === 'course' ? 'course' : 'gov';
    const isGov = selectedKind === 'gov';

    useEffect(() => () => {
        if (certificatePreview?.startsWith?.('blob:')) {
            URL.revokeObjectURL(certificatePreview);
        }
    }, [certificatePreview]);

    const patch = (next) => onChange?.(next);

    const handleUniversityChange = (raw) => {
        const nextName = raw;
        const needle = nextName.trim().toLowerCase();
        const exact = educations.find(
            (item) => (item?.institution || '').trim().toLowerCase() === needle,
        );
        const partial = exact || educations.find((item) => {
            const label = (item?.institution || '').trim().toLowerCase();
            return needle && (label.includes(needle) || needle.includes(label));
        });
        const matched = partial || null;
        patch({
            institutionName: nextName,
            educationId: matched?.id != null ? String(matched.id) : '',
            webUrl: matched?.webUrl || webUrl,
            educationLevel: matched?.additionalInfo || educationLevel,
        });
    };

    const pickCertificate = (file) => {
        if (!file) return;
        const type = String(file.type || '').toLowerCase();
        const okType = type === 'application/pdf'
            || type === 'image/jpeg'
            || type === 'image/png'
            || /\.(pdf|jpe?g|png)$/i.test(file.name || '');
        if (!okType) return;

        if (certificatePreview?.startsWith?.('blob:')) {
            URL.revokeObjectURL(certificatePreview);
        }

        const isImage = type.startsWith('image/');
        patch({
            certificateName: file.name || 'certificate',
            certificatePreview: isImage ? URL.createObjectURL(file) : '',
            certificateFile: file,
        });
    };

    const handleAdd = () => {
        if (isGov) {
            onAdd?.({
                educationKind: 'gov',
                educationId: educationId === '' ? undefined : Number(educationId),
                institutionName: institutionName.trim(),
                direction: direction.trim(),
                educationLevel: educationLevel.trim(),
                webUrl: webUrl.trim(),
                startYear: startYear === '' ? undefined : Number(startYear),
                endYear: endYear === '' ? undefined : Number(endYear),
            });
            return;
        }

        onAdd?.({
            educationKind: 'course',
            institutionName: (platform || courseName).trim(),
            courseName: courseName.trim(),
            courseLink: courseLink.trim(),
            platform: platform.trim(),
            webUrl: courseLink.trim(),
            direction: courseName.trim(),
            educationLevel: 'Образовательный курс',
            startYear: startYear === '' ? undefined : Number(startYear),
            endYear: endYear === '' ? undefined : Number(endYear),
            certificateName,
            certificatePreview,
        });
    };

    return (
        <section className="educationForm">
            <h2 className="educationForm__title">Добавьте гос. образование или курс</h2>

            <div
                className={`educationForm__kind educationForm__kind--${selectedKind}`}
                role="group"
                aria-label="Тип образования"
            >
                <span className="educationForm__kindThumb" aria-hidden="true" />
                <button
                    type="button"
                    className={
                        'educationForm__kindBtn'
                        + (isGov ? ' is-active' : '')
                    }
                    aria-pressed={isGov}
                    onClick={() => patch({ educationKind: 'gov' })}
                >
                    Гос. образование
                </button>
                <button
                    type="button"
                    className={
                        'educationForm__kindBtn'
                        + (!isGov ? ' is-active' : '')
                    }
                    aria-pressed={!isGov}
                    onClick={() => patch({ educationKind: 'course' })}
                >
                    Образовательные курсы
                </button>
            </div>

            <div className="educationForm__box">
                {isGov ? (
                    <div className="educationForm__fields">
                        <label className={`educationForm__field educationForm__field--select${institutionName ? ' is-filled' : ''}`}>
                            <input
                                type="text"
                                list="education-university-list"
                                value={institutionName}
                                placeholder="Выберете обр. учреждение"
                                autoComplete="off"
                                aria-label="Образовательное учреждение"
                                onChange={(event) => handleUniversityChange(event.target.value)}
                            />
                            <img src={arrowIcon} alt="" className="educationForm__chevron" />
                            <datalist id="education-university-list">
                                {educations.map((item) => (
                                    <option key={item.id} value={item.institution} />
                                ))}
                            </datalist>
                        </label>

                        <label className={`educationForm__field educationForm__field--select${direction ? ' is-filled' : ''}`}>
                            <input
                                type="text"
                                value={direction}
                                placeholder="Направление"
                                autoComplete="off"
                                aria-label="Направление"
                                onChange={(event) => patch({ direction: event.target.value })}
                            />
                            <img src={arrowIcon} alt="" className="educationForm__chevron" />
                        </label>

                        <label className={`educationForm__field${educationLevel ? ' is-filled is-muted' : ''}`}>
                            <input
                                type="text"
                                list="education-level-list"
                                value={educationLevel}
                                placeholder="Уровень образования"
                                autoComplete="off"
                                aria-label="Уровень образования"
                                onChange={(event) => patch({ educationLevel: event.target.value })}
                            />
                            <datalist id="education-level-list">
                                {EDUCATION_LEVELS.map((level) => (
                                    <option key={level} value={level} />
                                ))}
                            </datalist>
                        </label>

                        <div className="educationForm__row">
                            <label className={`educationForm__field educationForm__field--icon${startYear ? ' is-filled' : ''}`}>
                                <input
                                    type="number"
                                    min="1950"
                                    max={currentYear + 10}
                                    value={startYear}
                                    placeholder="Начало обучения"
                                    aria-label="Начало обучения"
                                    onChange={(event) => patch({ startYear: event.target.value })}
                                />
                                <img src={calendarIcon} alt="" />
                            </label>
                            <label className={`educationForm__field educationForm__field--icon${endYear ? ' is-filled' : ''}`}>
                                <input
                                    type="number"
                                    min="1950"
                                    max={currentYear + 10}
                                    value={endYear}
                                    placeholder="Окончание"
                                    aria-label="Окончание"
                                    onChange={(event) => patch({ endYear: event.target.value })}
                                />
                                <img src={calendarIcon} alt="" />
                            </label>
                        </div>

                        <label className={`educationForm__field educationForm__field--icon${webUrl ? ' is-filled is-link is-muted' : ''}`}>
                            <input
                                type="url"
                                value={webUrl}
                                placeholder="Сайт обр. учреждения"
                                aria-label="Сайт образовательного учреждения"
                                onChange={(event) => patch({ webUrl: event.target.value })}
                            />
                            <img src={linkIcon} alt="" />
                        </label>
                    </div>
                ) : (
                    <div className="educationForm__fields">
                        <div className="educationForm__row">
                            <label className={`educationForm__field${courseName ? ' is-filled' : ''}`}>
                                <input
                                    type="text"
                                    value={courseName}
                                    placeholder="Название курса"
                                    aria-label="Название курса"
                                    onChange={(event) => patch({ courseName: event.target.value })}
                                />
                            </label>
                            <label className={`educationForm__field educationForm__field--icon${courseLink ? ' is-filled is-link' : ''}`}>
                                <input
                                    type="url"
                                    value={courseLink}
                                    placeholder="Ссылка на курс"
                                    aria-label="Ссылка на курс"
                                    onChange={(event) => patch({ courseLink: event.target.value })}
                                />
                                <img src={linkIcon} alt="" />
                            </label>
                        </div>

                        <label className={`educationForm__field educationForm__field--select${platform ? ' is-filled' : ''}`}>
                            <input
                                type="text"
                                list="education-platform-list"
                                value={platform}
                                placeholder="Выберете образовательную платформу"
                                autoComplete="off"
                                aria-label="Образовательная платформа"
                                onChange={(event) => patch({ platform: event.target.value })}
                            />
                            <img src={arrowIcon} alt="" className="educationForm__chevron" />
                            <datalist id="education-platform-list">
                                {COURSE_PLATFORMS.map((item) => (
                                    <option key={item} value={item} />
                                ))}
                            </datalist>
                        </label>

                        <div className="educationForm__row">
                            <label className={`educationForm__field educationForm__field--icon${startYear ? ' is-filled' : ''}`}>
                                <input
                                    type="number"
                                    min="1950"
                                    max={currentYear + 10}
                                    value={startYear}
                                    placeholder="Начало обучения"
                                    aria-label="Начало обучения"
                                    onChange={(event) => patch({ startYear: event.target.value })}
                                />
                                <img src={calendarIcon} alt="" />
                            </label>
                            <label className={`educationForm__field educationForm__field--icon${endYear ? ' is-filled' : ''}`}>
                                <input
                                    type="number"
                                    min="1950"
                                    max={currentYear + 10}
                                    value={endYear}
                                    placeholder="Окончание"
                                    aria-label="Окончание"
                                    onChange={(event) => patch({ endYear: event.target.value })}
                                />
                                <img src={calendarIcon} alt="" />
                            </label>
                        </div>

                        {certificateName ? (
                            <div className="educationForm__certificate">
                                <div className="educationForm__certificateThumb">
                                    {certificatePreview ? (
                                        <img src={certificatePreview} alt="" />
                                    ) : (
                                        <span className="educationForm__certificatePdf">PDF</span>
                                    )}
                                </div>
                                <div className="educationForm__certificateCopy">
                                    <p className="educationForm__certificateTitle">
                                        Ваш прикрепленный сертификат
                                    </p>
                                    <p className="educationForm__certificateName">{certificateName}</p>
                                    <button
                                        type="button"
                                        className="educationForm__certificateReplace"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        Загрузить другой
                                        <span aria-hidden="true">×</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <label
                                htmlFor="education-certificate-file"
                                className={`educationForm__dropzone${isDragging ? ' is-dragging' : ''}`}
                                onDragOver={(event) => {
                                    event.preventDefault();
                                    setIsDragging(true);
                                }}
                                onDragLeave={(event) => {
                                    event.preventDefault();
                                    setIsDragging(false);
                                }}
                                onDrop={(event) => {
                                    event.preventDefault();
                                    setIsDragging(false);
                                    pickCertificate(event.dataTransfer.files?.[0]);
                                }}
                            >
                                <img src={certificateIcon} alt="" width={78} height={57} />
                                <span className="educationForm__dropzoneText">
                                    <span className="educationForm__dropzoneLead">
                                        Ваш сертификат (при наличии)
                                    </span>
                                    <span>формат jpeg/png или PDF</span>
                                </span>
                            </label>
                        )}
                        <input
                            id="education-certificate-file"
                            ref={fileInputRef}
                            type="file"
                            className="educationForm__fileInput"
                            accept="image/jpeg,image/png,application/pdf,.pdf"
                            onChange={(event) => {
                                pickCertificate(event.target.files?.[0]);
                                event.target.value = '';
                            }}
                        />
                    </div>
                )}

                <button type="button" className="educationForm__add" onClick={handleAdd}>
                    Добавить
                </button>
            </div>
        </section>
    );
};

export default EducationForm;
