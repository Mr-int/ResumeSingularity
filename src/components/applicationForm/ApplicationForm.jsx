import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './applicationForm.css';
import exclamationIcon from '../../assets/icons/exclamationIcon.svg';
import mailIcon from '../../assets/icons/mailIcon.svg';
import successIcon from '../../assets/icons/success.svg';
import sunIcon from '../../assets/other/sun.png';
import cloudMailIcon from '../../assets/other/cloudMail.png';
import { checkRecruiterProfile } from '../../services/getApi.js';
import {
    buildCreateRequestBody,
    createRequest,
    normalizeTelegramForApi,
} from '../../services/requestApi.js';
import { createRecruiterRequest } from '../../services/studentApi.js';
import { isAuthenticated, isRecruiterRole, requestLogin } from '../../services/authApi.js';
import { formatApiUserMessage } from '../../utils/apiErrors.js';

const getInputNumbersValue = (value) => String(value ?? '').replace(/\D/g, '');

/**
 * Формат бэкенда: «1–15 цифр и опциональный + в начале» (без пробелов/скобок из маски).
 */
const normalizePhoneForApi = (raw) => {
    let digits = getInputNumbersValue(raw);
    if (!digits) return '';
    if (digits.length === 11 && digits[0] === '8') {
        digits = `7${digits.slice(1)}`;
    }
    if (digits.length === 10 && digits[0] === '9') {
        digits = `7${digits}`;
    }
    if (digits.length > 15) {
        digits = digits.slice(0, 15);
    }
    const trimmed = String(raw ?? '').trim();
    if (trimmed.startsWith('+')) {
        return `+${digits}`;
    }
    return digits;
};

/** Маска как в демо: РФ 7/8/9 → +7/8 (___) ___-__-__, иначе до +16 цифр. */
const formatPhoneDisplay = (inputNumbersValue) => {
    if (!inputNumbersValue) return '';
    let nums = inputNumbersValue;
    if (['7', '8', '9'].includes(nums[0])) {
        if (nums[0] === '9') nums = `7${nums}`;
        nums = nums.slice(0, 11);
        const firstChar = nums[0] === '8' ? '8' : '+7';
        let formattedInputValue = `${firstChar} `;
        if (nums.length > 1) {
            formattedInputValue += `(${nums.substring(1, 4)}`;
        }
        if (nums.length >= 5) {
            formattedInputValue += `) ${nums.substring(4, 7)}`;
        }
        if (nums.length >= 8) {
            formattedInputValue += `-${nums.substring(7, 9)}`;
        }
        if (nums.length >= 10) {
            formattedInputValue += `-${nums.substring(9, 11)}`;
        }
        return formattedInputValue;
    }
    return `+${inputNumbersValue.substring(0, 16)}`;
};

/** Временно: без строгой проверки телефона на клиенте. TODO: под бэкенд. */
const shouldShowPhoneInvalid = () => false;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const TG_USERNAME_MAX = 20;

/** Всегда «@» + только a-zA-Z0-9_, длина имени 1–20. */
const formatTelegramValue = (raw) => {
    let v = String(raw ?? '');
    if (!v.startsWith('@')) {
        v = `@${v.replace(/@/g, '')}`;
    }
    let usernamePart = v.substring(1);
    usernamePart = usernamePart.replace(/[^a-zA-Z0-9_]/g, '');
    if (usernamePart.length > TG_USERNAME_MAX) {
        usernamePart = usernamePart.substring(0, TG_USERNAME_MAX);
    }
    return `@${usernamePart}`;
};

const getTelegramPureName = (formatted) =>
    formatted.length > 1 ? formatted.slice(1) : '';

const isTelegramUsernameTooLong = (formatted) => {
    const pure = getTelegramPureName(formatted);
    return pure.length > TG_USERNAME_MAX;
};

const FULL_NAME_LIMIT = 50;
const TASK_MIN = 20;
const TASK_MAX = 500;

const profileDisplayName = (profile) =>
    `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim();

const profileNeedsTelegram = (profile) =>
    !normalizeTelegramForApi(profile?.telegramUsername);

const formatTelegramFromProfile = (username) => {
    const pure = normalizeTelegramForApi(username);
    return pure ? `@${pure}` : '@';
};

/** Как в демо: только буквы/пробел/дефис, без двойных пробелов и дефисов, капитализация после пробела/дефиса/начала. */
const formatFullNameInput = (raw) => {
    let val = String(raw ?? '');
    val = val.replace(/[^a-zA-Zа-яёА-ЯЁ\- ]/g, '');
    val = val.replace(/\s\s+/g, ' ');
    val = val.replace(/--+/g, '-');
    val = val
        .toLowerCase()
        .replace(/(^|\s|\-)([a-zа-яё])/g, (match) => match.toUpperCase());
    return val.substring(0, FULL_NAME_LIMIT);
};

const isFullNameValid = (value) => {
    const parts = value.trim().split(' ');
    return parts.length >= 2 && parts.every((p) => p.length >= 2);
};

const isFullNameInvalidHint = (value) =>
    value.trim().length > 0 && !isFullNameValid(value);

const getFriendlyError = (err) => {
    const body = err?.responseBody;
    const msg = (body?.message || err?.message || '').toLowerCase();
    if (err?.status === 401) return 'Ошибка авторизации. Пожалуйста, войдите в систему.';
    if (err?.status === 403) return formatApiUserMessage(err);
    if (msg.includes('last name') || msg.includes('255') || msg.includes('characters')) {
        return 'Вы должны вписать имя и фамилию через пробел.';
    }
    if (msg.includes('null') || msg.includes('не должно равняться') || msg.includes('обязательн')) {
        return 'Некоторые поля пустые. Заполните все обязательные поля.';
    }
    if (msg.includes('email') || msg.includes('почт')) return 'Укажите корректный адрес почты.';
    if (
        msg.includes('телефон') ||
        msg.includes('phone') ||
        msg.includes('номер') ||
        msg.includes('digits') ||
        msg.includes('букв') ||
        msg.includes('letter')
    ) {
        return 'Номер телефона: только цифры (1–15), можно с + в начале — проверьте ввод или оставьте поле пустым, если указали почту/Telegram.';
    }
    if (body?.message) return body.message;
    return 'Не удалось отправить заявку. Проверьте данные и попробуйте ещё раз.';
};

const ApplicationForm = ({ studentName, studentId, onClose, onSubmit, onGoToChats }) => {
    const hasStudent = Boolean(studentId);
    const [profileMode, setProfileMode] = useState('loading');
    const [blockedReason, setBlockedReason] = useState('');
    const [recruiterProfile, setRecruiterProfile] = useState(null);
    const [taskDescription, setTaskDescription] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        company: '',
        email: '',
        telegram: '@',
        phone: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [createdChatId, setCreatedChatId] = useState(null);
    const [phoneInvalid, setPhoneInvalid] = useState(false);
    /** none — без подсветки; valid / invalid — как в демо email. */
    const [emailValidation, setEmailValidation] = useState('none');
    const [telegramInvalid, setTelegramInvalid] = useState(false);
    const [nameInvalid, setNameInvalid] = useState(false);
    const nameInputRef = useRef(null);
    const nameCursorRef = useRef(null);

    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            if (!isAuthenticated()) {
                requestLogin();
                onClose();
                return;
            }
            if (!isRecruiterRole()) {
                if (!cancelled) {
                    setProfileMode('blocked');
                    setBlockedReason('Заявки доступны только работодателям.');
                }
                return;
            }
            try {
                const { linked, profile } = await checkRecruiterProfile();
                if (cancelled) return;
                setProfileMode(linked ? 'linked' : 'unlinked');
                setRecruiterProfile(profile);
                if (profile?.telegramUsername) {
                    setFormData((prev) => ({
                        ...prev,
                        telegram: formatTelegramFromProfile(profile.telegramUsername),
                    }));
                }
            } catch (err) {
                if (!cancelled) {
                    setProfileMode('blocked');
                    setBlockedReason(getFriendlyError(err));
                }
            }
        };

        init();
        return () => {
            cancelled = true;
        };
    }, [onClose]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
    };

    const handleNameInput = (e) => {
        const input = e.target;
        const prevLength = input.value.length;
        const cursorPosition = input.selectionStart ?? 0;
        const val = formatFullNameInput(input.value);
        if (cursorPosition < val.length || prevLength > val.length) {
            nameCursorRef.current = cursorPosition;
        } else {
            nameCursorRef.current = null;
        }
        setFormData(prev => ({ ...prev, name: val }));
        setNameInvalid(isFullNameInvalidHint(val));
        setError('');
    };

    const handleNameBlur = () => {
        const trimmed = formData.name.trim();
        const v = formatFullNameInput(trimmed);
        setFormData(prev => ({ ...prev, name: v }));
        setNameInvalid(isFullNameInvalidHint(v));
    };

    useLayoutEffect(() => {
        if (nameCursorRef.current == null || !nameInputRef.current) return;
        const pos = Math.min(nameCursorRef.current, formData.name.length);
        nameInputRef.current.setSelectionRange(pos, pos);
        nameCursorRef.current = null;
    }, [formData.name]);

    const handleTelegramInput = (e) => {
        const v = formatTelegramValue(e.target.value);
        setFormData(prev => ({ ...prev, telegram: v }));
        setTelegramInvalid(isTelegramUsernameTooLong(v));
        setError('');
    };

    const handleTelegramKeyDown = (e) => {
        if (e.key === 'Backspace' && formData.telegram === '@') {
            e.preventDefault();
        }
    };

    const handleTelegramPaste = (e) => {
        e.preventDefault();
        let paste = e.clipboardData?.getData('text') ?? '';
        if (paste.includes('/')) {
            paste = paste.split('/').pop() ?? '';
        }
        paste = paste.split('?')[0].split('#')[0];
        paste = paste.replace(/[^a-zA-Z0-9_]/g, '');
        const next = `@${paste.substring(0, TG_USERNAME_MAX)}`;
        setFormData(prev => ({ ...prev, telegram: next }));
        setTelegramInvalid(isTelegramUsernameTooLong(next));
        setError('');
    };

    const normalizeEmailValue = (raw) => String(raw ?? '').replace(/\s/g, '');

    const handleEmailInput = (e) => {
        const value = normalizeEmailValue(e.target.value);
        setFormData(prev => ({ ...prev, email: value }));
        setError('');
        if (value.length === 0) {
            setEmailValidation('none');
        } else if (EMAIL_REGEX.test(value)) {
            setEmailValidation('valid');
        } else {
            setEmailValidation('invalid');
        }
    };

    const handleEmailBlur = () => {
        if (!formData.email) setEmailValidation('none');
    };

    const handleEmailPaste = (e) => {
        e.preventDefault();
        const chunk = normalizeEmailValue(e.clipboardData?.getData('text') ?? '');
        const input = e.target;
        const start = input.selectionStart ?? formData.email.length;
        const end = input.selectionEnd ?? formData.email.length;
        const next =
            formData.email.slice(0, start) + chunk + formData.email.slice(end);
        setFormData(prev => ({ ...prev, email: next }));
        setError('');
        if (next.length === 0) {
            setEmailValidation('none');
        } else if (EMAIL_REGEX.test(next)) {
            setEmailValidation('valid');
        } else {
            setEmailValidation('invalid');
        }
    };

    const handlePhoneInput = (e) => {
        const input = e.target;
        const selectionStart = input.selectionStart ?? 0;
        let inputNumbersValue = getInputNumbersValue(input.value);

        if (!inputNumbersValue) {
            setFormData(prev => ({ ...prev, phone: '' }));
            setPhoneInvalid(false);
            setError('');
            return;
        }

        // Редактирование не в конце — не переформатируем, чтобы не прыгал курсор (как в демо).
        if (input.value.length !== selectionStart) {
            const data = e.nativeEvent instanceof InputEvent ? e.nativeEvent.data : null;
            if (data && /\D/.test(data)) {
                const formatted = formatPhoneDisplay(inputNumbersValue);
                setFormData(prev => ({ ...prev, phone: formatted }));
                setPhoneInvalid(shouldShowPhoneInvalid(formatted));
            } else {
                setPhoneInvalid(shouldShowPhoneInvalid(input.value));
            }
            setError('');
            return;
        }

        const formattedInputValue = formatPhoneDisplay(inputNumbersValue);
        setFormData(prev => ({ ...prev, phone: formattedInputValue }));
        setPhoneInvalid(shouldShowPhoneInvalid(formattedInputValue));
        setError('');
    };

    const handlePhoneKeyDown = (e) => {
        if (e.key !== 'Backspace') return;
        const inputValue = getInputNumbersValue(formData.phone);
        if (inputValue.length === 1) {
            e.preventDefault();
            setFormData(prev => ({ ...prev, phone: '' }));
            setPhoneInvalid(false);
            setError('');
        }
    };

    const handlePhonePaste = (e) => {
        e.preventDefault();
        const pastedText = e.clipboardData?.getData('text') ?? '';
        const pastedDigits = getInputNumbersValue(pastedText);
        const currentDigits = getInputNumbersValue(formData.phone);
        const mergedDigits =
            pastedDigits.length >= 10 ? pastedDigits : currentDigits + pastedDigits;
        const formatted = formatPhoneDisplay(mergedDigits);
        setFormData(prev => ({ ...prev, phone: formatted }));
        setPhoneInvalid(shouldShowPhoneInvalid(formatted));
        setError('');
    };

    const splitFullName = (fullName) => {
        const names = fullName.trim().split(' ');
        if (names.length === 1) {
            return { firstName: names[0], lastName: '' };
        } else if (names.length >= 2) {
            return { firstName: names[0], lastName: names.slice(1).join(' ') };
        }
        return { firstName: '', lastName: '' };
    };

    const buildRecruiterFieldsFromForm = () => {
        const { firstName, lastName } = splitFullName(formData.name);
        const body = {
            companyName: formData.company.trim(),
            firstName: firstName || '',
            lastName: lastName || '',
        };
        const emailTrim = normalizeEmailValue(formData.email);
        if (emailTrim) body.email = emailTrim;
        const phoneForApi = normalizePhoneForApi(formData.phone);
        if (phoneForApi) body.phoneNumber = phoneForApi;
        const tgPure = normalizeTelegramForApi(formData.telegram);
        if (tgPure) body.telegramUsername = tgPure;
        return body;
    };

    const buildRecruiterBodyFromProfile = (extras = {}) => {
        if (!recruiterProfile) return { ...extras };
        const body = {
            companyName: recruiterProfile.companyName || '',
            firstName: recruiterProfile.firstName || '',
            lastName: recruiterProfile.lastName || '',
        };
        if (recruiterProfile.email) body.email = recruiterProfile.email;
        if (recruiterProfile.phoneNumber) body.phoneNumber = recruiterProfile.phoneNumber;
        const profileTg = normalizeTelegramForApi(recruiterProfile.telegramUsername);
        const formTg = normalizeTelegramForApi(formData.telegram);
        const telegramUsername = profileTg || formTg;
        if (telegramUsername) body.telegramUsername = telegramUsername;
        return { ...body, ...extras };
    };

    const postRecruiterWithFallback = async (body) => {
        try {
            return await createRecruiterRequest(body);
        } catch (err) {
            if (err.status === 400 && body.description) {
                const { description, ...rest } = body;
                return await createRecruiterRequest(rest);
            }
            throw err;
        }
    };

    const validateFullForm = () => {
        const emptyName = !formData.name.trim();
        const emptyCompany = !formData.company.trim();
        const tgPure = getTelegramPureName(formData.telegram);
        const hasTelegramContact = tgPure.length > 0;
        const emptyContact =
            !hasTelegramContact && !formData.email.trim() && !formData.phone.trim();
        if (emptyName || emptyCompany || emptyContact) {
            setError('Некоторые поля пустые. Заполните все обязательные поля.');
            return false;
        }
        if (isFullNameInvalidHint(formData.name)) {
            setError('Введите имя и фамилию через пробел');
            setNameInvalid(true);
            return false;
        }
        if (isTelegramUsernameTooLong(formData.telegram)) {
            setError(`Имя в Telegram не длиннее ${TG_USERNAME_MAX} символов (a-z, 0-9, _)`);
            setTelegramInvalid(true);
            return false;
        }
        const emailNorm = normalizeEmailValue(formData.email);
        if (emailNorm.length > 0 && !EMAIL_REGEX.test(emailNorm)) {
            setError('Введите корректный адрес (например, name@domain.com)');
            setEmailValidation('invalid');
            return false;
        }
        return true;
    };

    const validateLinkedGeneralForm = () => {
        const task = taskDescription.trim();
        if (task.length < TASK_MIN) {
            setError(`Опишите задачу — минимум ${TASK_MIN} символов.`);
            return false;
        }
        if (task.length > TASK_MAX) {
            setError(`Описание задачи — не более ${TASK_MAX} символов.`);
            return false;
        }
        if (profileNeedsTelegram(recruiterProfile)) {
            const tgPure = getTelegramPureName(formData.telegram);
            if (!tgPure) {
                setError('Укажите Telegram для связи.');
                return false;
            }
            if (isTelegramUsernameTooLong(formData.telegram)) {
                setError(`Имя в Telegram не длиннее ${TG_USERNAME_MAX} символов (a-z, 0-9, _)`);
                setTelegramInvalid(true);
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (profileMode === 'loading' || profileMode === 'blocked') return;

        if (profileMode === 'linked' && hasStudent) {
            setLoading(true);
            try {
                const response = await createRequest(buildCreateRequestBody(studentId));
                setCreatedChatId(response?.appChatId || null);
                setSuccess(true);
                if (onSubmit) await onSubmit({ studentId });
            } catch (err) {
                setError(getFriendlyError(err));
            } finally {
                setLoading(false);
            }
            return;
        }

        if (profileMode === 'linked' && !hasStudent) {
            if (!validateLinkedGeneralForm()) return;
            setLoading(true);
            try {
                const body = buildRecruiterBodyFromProfile({
                    description: taskDescription.trim(),
                });
                const response = await postRecruiterWithFallback(body);
                setCreatedChatId(response?.appChatId || null);
                setSuccess(true);
                if (onSubmit) await onSubmit(body);
            } catch (err) {
                setError(getFriendlyError(err));
            } finally {
                setLoading(false);
            }
            return;
        }

        if (!validateFullForm()) return;

        setLoading(true);
        try {
            let response;
            let requestData;
            if (hasStudent) {
                requestData = buildCreateRequestBody(studentId, buildRecruiterFieldsFromForm());
                response = await createRequest(requestData);
            } else {
                requestData = buildRecruiterFieldsFromForm();
                response = await postRecruiterWithFallback(requestData);
            }

            setCreatedChatId(response?.appChatId || null);
            setSuccess(true);
            if (onSubmit) await onSubmit(requestData);
        } catch (err) {
            setError(getFriendlyError(err));
        } finally {
            setLoading(false);
        }
    };

    const getButtonText = () => {
        if (loading) return 'Отправка...';
        if (success) return 'Заявка отправлена!';
        if (profileMode === 'linked' && hasStudent) return 'Отправить заявку';
        return 'Связаться';
    };

    const showFullForm = profileMode === 'unlinked';
    const showLinkedStudent = profileMode === 'linked' && hasStudent;
    const showLinkedGeneral = profileMode === 'linked' && !hasStudent;
    const isCompact = showLinkedStudent || showLinkedGeneral;
    const showLoading = profileMode === 'loading';
    const showBlocked = profileMode === 'blocked';

    const infoText = () => {
        if (showLinkedStudent) {
            return `Отправьте заявку студенту${studentName ? ` ${studentName}` : ''}. Данные работодателя возьмём из вашего профиля.`;
        }
        if (showLinkedGeneral) {
            return 'Свяжемся с вами по контактам из профиля. Кратко опишите задачу — так мы быстрее подберём студентов.';
        }
        if (hasStudent && profileMode === 'unlinked') {
            return 'При первой заявке сохраним ваши данные в профиль. После этого достаточно будет только выбрать студента.';
        }
        return 'Отправьте заявку — мы свяжемся с вами в течение 24 часов, уточним задачу и подберём студентов, которые лучше всего подойдут.';
    };

    const renderProfileCard = () => {
        if (!recruiterProfile) return null;
        const name = profileDisplayName(recruiterProfile);
        const contacts = [
            recruiterProfile.companyName,
            name,
            recruiterProfile.email,
            recruiterProfile.phoneNumber,
            recruiterProfile.telegramUsername
                ? `@${normalizeTelegramForApi(recruiterProfile.telegramUsername)}`
                : null,
        ].filter(Boolean);
        return (
            <div className="applicationForm__profileCard">
                <p className="applicationForm__profileCard-title">Ваш профиль</p>
                <ul className="applicationForm__profileCard-list">
                    {contacts.map((line) => (
                        <li key={line}>{line}</li>
                    ))}
                </ul>
                <Link to="/settings" className="applicationForm__profileCard-link" onClick={onClose}>
                    Изменить данные в настройках
                </Link>
            </div>
        );
    };

    const showMailIcon = () => !loading && !success;

    return (
        <div className="applicationForm__overlay" onClick={onClose}>
            {success ? (
                <div
                    className="applicationForm__successWindow"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button className="applicationForm__close" onClick={onClose}>×</button>
                    <div className="applicationForm__successWindow-inner">
<div className="applicationForm__successWindow-body">
                                <div className="applicationForm__successWindow-titleRow">
                                    <h2 className="applicationForm__successWindow-title">Заявка оставлена</h2>
                                    <img src={successIcon} alt="" className="applicationForm__successWindow-titleIcon" width={40} height={40} />
                                </div>
                            <p className="appвlicationForm__successWindow-text">
                                Мы свяжемся с вами в течении 24 часов.
                            </p>
                            {typeof onGoToChats === 'function' ? (
                                <div className="applicationForm__successWindow-tgBlock">
                                    <a
                                        href="#chats"
                                        className="applicationForm__successWindow-tgLink"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            onGoToChats(createdChatId);
                                        }}
                                    >
                                        <div className="applicationForm__successWindow-tgLink-textBlock">
                                            <span className="applicationForm__successWindow-tgLink-text">
                                                Перейти в чаты
                                            </span>
                                            <span className="applicationForm__successWindow-tgLink-arrow">Открыть →</span>
                                        </div>
                                        <span className="applicationForm__successWindow-tgLink-telegramIcon" aria-hidden>
                                            <svg width="72" height="72" viewBox="0 0 24 24">
                                                <path
                                                    fill="currentColor"
                                                    d="M9.8 15.2 9.4 20c.5 0 .7-.2 1-.4l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6v-.1c.3-1.2-.4-1.7-1.2-1.4L2.9 10.1c-1.2.5-1.2 1.1-.2 1.4l4.7 1.5L18.4 6c.5-.3 1-.1.6.2"
                                                />
                                            </svg>
                                        </span>
                                    </a>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            ) : (
                <div
                    className={`applicationForm__content${isCompact ? ' applicationForm__content--compact' : ''}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="applicationForm__contentInner">
                        <img src={sunIcon} alt="" className="applicationForm__sunIcon"/>
                        <button className="applicationForm__close" onClick={onClose}>×</button>

                        {showLoading ? (
                            <div className="applicationForm__loading">
                                <p>Проверяем профиль…</p>
                            </div>
                        ) : showBlocked ? (
                            <div className="applicationForm__blocked">
                                <p>{blockedReason}</p>
                                <button type="button" className="applicationForm__submit" onClick={onClose}>
                                    Закрыть
                                </button>
                            </div>
                        ) : (
                            <>
                                {showLinkedStudent && studentName ? (
                                    <h2 className="applicationForm__compactTitle">
                                        Связаться с {studentName}?
                                    </h2>
                                ) : null}

                                <div className="applicationForm__info">
                                    <img
                                        src={exclamationIcon}
                                        alt="info"
                                        className="applicationForm__info-icon"
                                    />
                                    {infoText()}
                                </div>

                                {(showLinkedStudent || showLinkedGeneral) && renderProfileCard()}

                                <form onSubmit={handleSubmit} className="applicationForm__form">
                                    {showLinkedGeneral ? (
                                        <>
                                            <div className="applicationForm__field">
                                                <label htmlFor="taskDescription">Кратко опишите задачу</label>
                                                <textarea
                                                    id="taskDescription"
                                                    name="taskDescription"
                                                    className="applicationForm__textarea"
                                                    value={taskDescription}
                                                    onChange={(e) => {
                                                        setTaskDescription(e.target.value);
                                                        setError('');
                                                    }}
                                                    disabled={loading}
                                                    placeholder="Например: ищем frontend-стажёра на 3 месяца для внутреннего портала…"
                                                    rows={5}
                                                    maxLength={TASK_MAX}
                                                />
                                                <p className="applicationForm__taskHint">
                                                    {taskDescription.trim().length}/{TASK_MAX} (минимум {TASK_MIN})
                                                </p>
                                            </div>
                                            {profileNeedsTelegram(recruiterProfile) ? (
                                                <div className="applicationForm__field">
                                                    <label htmlFor="telegram">Телеграмм для связи</label>
                                                    <div className="applicationForm__telegramWrapper">
                                                        <input
                                                            id="telegram"
                                                            name="telegram"
                                                            type="text"
                                                            value={formData.telegram}
                                                            onChange={handleTelegramInput}
                                                            onKeyDown={handleTelegramKeyDown}
                                                            onPaste={handleTelegramPaste}
                                                            disabled={loading}
                                                            placeholder="@username"
                                                            spellCheck={false}
                                                            autoComplete="off"
                                                            className={`applicationForm__telegramInput${
                                                                telegramInvalid ? ' applicationForm__inputInvalid' : ''
                                                            }`}
                                                            aria-invalid={telegramInvalid}
                                                        />
                                                    </div>
                                                </div>
                                            ) : null}
                                        </>
                                    ) : null}

                                    {showFullForm ? (
                                        <>
                        <div className="applicationForm__field">
                            <label htmlFor="name">Имя Фамилия</label>
                            <input
                                ref={nameInputRef}
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleNameInput}
                                onBlur={handleNameBlur}
                                disabled={loading}
                                placeholder="Иван Иванов"
                                spellCheck={false}
                                autoComplete="name"
                                className={nameInvalid ? 'applicationForm__inputInvalid' : undefined}
                                aria-invalid={nameInvalid}
                            />
                            <div
                                className={
                                    nameInvalid
                                        ? 'applicationForm__phoneFieldError applicationForm__phoneFieldError--visible'
                                        : 'applicationForm__phoneFieldError'
                                }
                                role="alert"
                            >
                                Введите имя и фамилию через пробел
                            </div>
                        </div>

                        <div className="applicationForm__field">
                            <label htmlFor="company">Компания или проект</label>
                            <input
                                id="company"
                                name="company"
                                type="text"
                                value={formData.company}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                placeholder='ООО "Компания"'
                            />
                        </div>

                        <div className="applicationForm__field">
                            <label htmlFor="telegram">Телеграмм для связи</label>
                            <div className="applicationForm__telegramWrapper">
                                <input
                                    id="telegram"
                                    name="telegram"
                                    type="text"
                                    value={formData.telegram}
                                    onChange={handleTelegramInput}
                                    onKeyDown={handleTelegramKeyDown}
                                    onPaste={handleTelegramPaste}
                                    disabled={loading}
                                    placeholder="@username"
                                    spellCheck={false}
                                    autoComplete="off"
                                    className={`applicationForm__telegramInput${
                                        telegramInvalid ? ' applicationForm__inputInvalid' : ''
                                    }`}
                                    aria-invalid={telegramInvalid}
                                />
                                <div
                                    className={
                                        telegramInvalid
                                            ? 'applicationForm__telegramFieldError applicationForm__telegramFieldError--visible'
                                            : 'applicationForm__telegramFieldError'
                                    }
                                    role="alert"
                                >
                                    Максимум {TG_USERNAME_MAX} символов (a-z, 0-9, _)
                                </div>
                                <p className="applicationForm__telegramHint">
                                    {`Имя пользователя 1–${TG_USERNAME_MAX} символов: латиница, цифры, _`}
                                </p>
                            </div>
                        </div>

                        <div className="applicationForm__field">
                            <label htmlFor="email">Ваша почта</label>
                            <div className="applicationForm__emailWrapper">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleEmailInput}
                                    onBlur={handleEmailBlur}
                                    onPaste={handleEmailPaste}
                                    disabled={loading}
                                    placeholder="example@mail.com"
                                    spellCheck={false}
                                    autoComplete="email"
                                    className={
                                        emailValidation === 'valid'
                                            ? 'applicationForm__inputValid'
                                            : emailValidation === 'invalid'
                                              ? 'applicationForm__inputInvalid'
                                              : undefined
                                    }
                                    aria-invalid={emailValidation === 'invalid'}
                                />
                                <div
                                    className={
                                        emailValidation === 'invalid'
                                            ? 'applicationForm__emailHint applicationForm__emailHint--error applicationForm__emailHint--visible'
                                            : 'applicationForm__emailHint applicationForm__emailHint--error'
                                    }
                                    role="alert"
                                >
                                    Введите корректный адрес (например, name@domain.com)
                                </div>
                                <div
                                    className={
                                        emailValidation === 'valid'
                                            ? 'applicationForm__emailHint applicationForm__emailHint--success applicationForm__emailHint--visible'
                                            : 'applicationForm__emailHint applicationForm__emailHint--success'
                                    }
                                >
                                    Отличный email!
                                </div>
                            </div>
                        </div>

                        <div className="applicationForm__field">
                            <label htmlFor="phone">Номер телефона</label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                inputMode="tel"
                                autoComplete="tel"
                                value={formData.phone}
                                onChange={handlePhoneInput}
                                onKeyDown={handlePhoneKeyDown}
                                onPaste={handlePhonePaste}
                                disabled={loading}
                                placeholder="+7 (___) ___-__-__"
                                className={phoneInvalid ? 'applicationForm__inputInvalid' : undefined}
                                aria-invalid={phoneInvalid}
                            />
                            <div
                                className={
                                    phoneInvalid
                                        ? 'applicationForm__phoneFieldError applicationForm__phoneFieldError--visible'
                                        : 'applicationForm__phoneFieldError'
                                }
                                role="alert"
                            >
                                Проверьте номер: РФ 11 цифр (7/8/9…) или международный 10–15 цифр
                            </div>
                        </div>
                                        </>
                                    ) : null}

                        {error && <div className="applicationForm__error">{error}</div>}

                        <div className="applicationForm__button-container">
                            <button
                                type="submit"
                                className="applicationForm__submit"
                                disabled={loading || success || showLoading || showBlocked}
                            >
                                {getButtonText()}
                                {showMailIcon() && (
                                    <img
                                        src={mailIcon}
                                        alt="mail"
                                        className="applicationForm__submit-icon"
                                    />
                                )}
                            </button>
                        </div>
                        </form>
                            </>
                        )}
                        <img src={cloudMailIcon} alt="" className="applicationForm__cloudMailIcon"/>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApplicationForm;