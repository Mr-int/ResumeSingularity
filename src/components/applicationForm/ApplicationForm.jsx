import React, { useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './applicationForm.css';
import exclamationIcon from '../../assets/icons/exclamationIcon.svg';
import mailIcon from '../../assets/icons/mailIcon.svg';
import successIcon from '../../assets/icons/success.svg';
import sunIcon from '../../assets/other/sun.png';
import cloudMailIcon from '../../assets/other/cloudMail.png';
import { apiClientJson } from '../../utils/apiClient.js';

const getInputNumbersValue = (value) => String(value ?? '').replace(/\D/g, '');

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

const isPhoneIncomplete = (digits) => digits.length > 0 && digits.length < 11;

/** Как в демо: близко к RFC, без пробелов внутри строки. */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const TG_USERNAME_MAX = 32;
const TG_USERNAME_MIN = 5;

/** Всегда «@» + только a-zA-Z0-9_, длина имени ≤ 32. */
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

const isTelegramUsernameTooShort = (formatted) => {
    const pure = getTelegramPureName(formatted);
    return pure.length > 0 && pure.length < TG_USERNAME_MIN;
};

const FULL_NAME_LIMIT = 50;

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

const ApplicationForm = ({ studentName, studentId, onClose, onSubmit, successNavigateTo }) => {
    const navigate = useNavigate();
    const hasStudent = Boolean(studentId);
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
    const [phoneInvalid, setPhoneInvalid] = useState(false);
    /** none — без подсветки; valid / invalid — как в демо email. */
    const [emailValidation, setEmailValidation] = useState('none');
    const [telegramInvalid, setTelegramInvalid] = useState(false);
    const [nameInvalid, setNameInvalid] = useState(false);
    const nameInputRef = useRef(null);
    const nameCursorRef = useRef(null);

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
        setTelegramInvalid(isTelegramUsernameTooShort(v));
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
        setTelegramInvalid(isTelegramUsernameTooShort(next));
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
                setPhoneInvalid(isPhoneIncomplete(getInputNumbersValue(formatted)));
            }
            setError('');
            return;
        }

        const formattedInputValue = formatPhoneDisplay(inputNumbersValue);
        setFormData(prev => ({ ...prev, phone: formattedInputValue }));
        setPhoneInvalid(isPhoneIncomplete(getInputNumbersValue(formattedInputValue)));
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
        setPhoneInvalid(isPhoneIncomplete(getInputNumbersValue(formatted)));
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

    const getFriendlyError = (err) => {
        const body = err?.responseBody;
        const msg = (body?.message || err?.message || '').toLowerCase();
        if (err?.status === 401) return 'Ошибка авторизации. Пожалуйста, войдите в систему.';
        if (err?.status === 403) return 'Доступ запрещён.';
        if (msg.includes('last name') || msg.includes('255') || msg.includes('characters')) return 'Вы должны вписать имя и фамилию через пробел.';
        if (msg.includes('null') || msg.includes('не должно равняться') || msg.includes('обязательн')) return 'Некоторые поля пустые. Заполните все обязательные поля.';
        if (msg.includes('email') || msg.includes('почт')) return 'Укажите корректный адрес почты.';
        if (msg.includes('телефон') || msg.includes('phone') || msg.includes('номер') || msg.includes('букв') || msg.includes('letter')) return 'Укажите номер телефона в верном формате (только цифры, плюс, скобки или дефис).';
        if (body?.message) return body.message;
        return 'Не удалось отправить заявку. Проверьте данные и попробуйте ещё раз.';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        const emptyName = !formData.name.trim();
        const emptyCompany = !formData.company.trim();
        const tgPure = getTelegramPureName(formData.telegram);
        const hasTelegramContact = tgPure.length > 0;
        const emptyContact =
            !hasTelegramContact &&
            !formData.email.trim() &&
            !formData.phone.trim();
        if (emptyName || emptyCompany || emptyContact) {
            setError('Некоторые поля пустые. Заполните все обязательные поля.');
            return;
        }
        if (isFullNameInvalidHint(formData.name)) {
            setError('Введите имя и фамилию через пробел');
            setNameInvalid(true);
            return;
        }
        if (isTelegramUsernameTooShort(formData.telegram)) {
            setError('Минимум 5 символов (A-Z, 0-9, _)');
            setTelegramInvalid(true);
            return;
        }
        const phoneDigits = getInputNumbersValue(formData.phone);
        if (isPhoneIncomplete(phoneDigits)) {
            setError('Номер введен не полностью');
            setPhoneInvalid(true);
            return;
        }
        const emailNorm = normalizeEmailValue(formData.email);
        if (emailNorm.length > 0 && !EMAIL_REGEX.test(emailNorm)) {
            setError('Введите корректный адрес (например, name@domain.com)');
            setEmailValidation('invalid');
            return;
        }

        setLoading(true);
        try {
            const { firstName, lastName } = splitFullName(formData.name);
            const baseData = {
                companyName: formData.company.trim(),
                firstName: firstName || '',
                lastName: lastName || '',
                email: formData.email?.trim() || '',
                phoneNumber: formData.phone?.trim() || '',
                telegramUsername:
                    getTelegramPureName(formData.telegram).length >= TG_USERNAME_MIN
                        ? formData.telegram.trim()
                        : ''
            };

            // Два режима:
            // 1) со страницы студента -> создаем request со studentId
            // 2) общая заявка без студента -> создаем/обновляем профиль recruiter
            const endpoint = hasStudent ? 'request' : 'recruiter';
            const requestData = hasStudent ? { ...baseData, studentId } : baseData;

            const response = await apiClientJson(endpoint, {
                method: 'POST',
                body: JSON.stringify(requestData),
            });

            setSuccess(true);
            if (onSubmit) {
                await onSubmit(requestData);
            }
        } catch (err) {
            setError(getFriendlyError(err));
        } finally {
            setLoading(false);
        }
    };

    const getButtonText = () => {
        if (loading) return 'Отправка...';
        if (success) return 'Заявка отправлена!';
        return 'Связаться';
    };

    const showMailIcon = () => {
        return !loading && !success;
    };

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
                            <p className="applicationForm__successWindow-text">
                                Мы свяжемся с вами в течении 24 часов.
                            </p>
                            {successNavigateTo ? (
                                <button
                                    type="button"
                                    className="applicationForm__successChatsBtn"
                                    onClick={() => {
                                        onClose();
                                        navigate(successNavigateTo);
                                    }}
                                >
                                    Перейти в чаты
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="applicationForm__content" onClick={(e) => e.stopPropagation()}>
                    <div className="applicationForm__contentInner">
                        <img src={sunIcon} alt="" className="applicationForm__sunIcon"/>
                        <button className="applicationForm__close" onClick={onClose}>×</button>
                        <div className="applicationForm__info">
                            <img
                                src={exclamationIcon}
                                alt="info"
                                className="applicationForm__info-icon"
                            />
                            Отправьте заявку — мы свяжемся с вами в течение 24 часов, уточним задачу и подберём студентов, которые лучше всего подойдут.
                        </div>
                        <form onSubmit={handleSubmit} className="applicationForm__form">
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
                                    Минимум 5 символов (A-Z, 0-9, _)
                                </div>
                                <p className="applicationForm__telegramHint">
                                    Например: @durov или @username
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
                                Номер введен не полностью
                            </div>
                        </div>

                        {error && <div className="applicationForm__error">{error}</div>}

                        <div className="applicationForm__button-container">
                            <button
                                type="submit"
                                className="applicationForm__submit"
                                disabled={loading || success}
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
                        <img src={cloudMailIcon} alt="" className="applicationForm__cloudMailIcon"/>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApplicationForm;