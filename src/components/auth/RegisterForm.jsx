import React, { useState, useEffect, useRef } from 'react';
import {
    confirmEmail,
    EMAIL_CONFIRMATION_EMAIL_KEY,
    EMAIL_CONFIRMATION_PENDING_KEY,
    registerRecruiter,
    registerStudent,
    resendEmailConfirmation,
} from '../../services/authApi.js';
import {
    isUsernameTakenError,
    normalizePhoneNumber,
    usernameFromName,
    usernameWithSuffix,
} from '../../utils/registrationIdentity.js';
import { patchStudentMe } from '../../services/accountApi.js';
import './registerForm.css';
import BackIcon from '../../assets/icons/vectorAuth.svg';
import LogoImage from '../../assets/logos/resume_logo_mini.png';
import EmailIcon from '../../assets/icons/email.svg';

const CAMPUS_OPTIONS = [
    'Москва', 'Санкт-Петербург', 'Казань', 'Новосибирск',
    'Екатеринбург', 'Нижний Новгород', 'Краснодар', 'Ростов-на-Дону',
    'Самара', 'Воронеж', 'Уфа', 'Пермь', 'Чебоксары', 'Челябинск', 'Онлайн',
];

const COURSE_OPTIONS = [1, 2, 3, 4];
const COURSE_API = {
    1: 'FIRST',
    2: 'SECOND',
    3: 'THIRD',
    4: 'FOURTH',
};
const CODE_LENGTH = 4;
const MESSAGE_TIMEOUT = 3000;
const MESSAGE_LEAVE_DURATION = 300;

const emailConfirmationPending = () =>
    sessionStorage.getItem(EMAIL_CONFIRMATION_PENDING_KEY) === '1';

const ASSIGNED_USERNAME_KEY = 'resume:registration-username';

const markEmailConfirmationPending = (email, username) => {
    sessionStorage.setItem(EMAIL_CONFIRMATION_PENDING_KEY, '1');
    sessionStorage.setItem(EMAIL_CONFIRMATION_EMAIL_KEY, email);
    sessionStorage.setItem(ASSIGNED_USERNAME_KEY, username);
};

const clearEmailConfirmationPending = () => {
    sessionStorage.removeItem(EMAIL_CONFIRMATION_PENDING_KEY);
    sessionStorage.removeItem(EMAIL_CONFIRMATION_EMAIL_KEY);
    sessionStorage.removeItem(ASSIGNED_USERNAME_KEY);
};

/** Логин из почты, пока ФИО ещё не собраны (код идёт сразу после email). */
const usernameFromEmail = (email) => {
    const local = String(email || '').split('@')[0] || '';
    return usernameFromName(local, 'user');
};

const RegisterForm = ({ role, onBack, onSuccess }) => {
    const isStudent = role === 'student';
    const pendingOnOpen = isStudent && emailConfirmationPending();
    // Студент: 1 email → 2 пароль+телефон → 3 код → 4 ФИО → 5 курс
    // Рекрутер: 1 email → 2 ФИО → 3 пароль → 4 компания
    const [step, setStep] = useState(pendingOnOpen ? 3 : 1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [studentAccountCreated, setStudentAccountCreated] = useState(pendingOnOpen);
    const [emailConfirmed, setEmailConfirmed] = useState(false);
    const [assignedUsername, setAssignedUsername] = useState(
        pendingOnOpen ? (sessionStorage.getItem(ASSIGNED_USERNAME_KEY) || '') : '',
    );
    const [code, setCode] = useState(['', '', '', '']);
    const codeRowRef = useRef(null);

    const [messageVisible, setMessageVisible] = useState(false);
    const [messageLeaving, setMessageLeaving] = useState(false);
    const [messageText, setMessageText] = useState('');
    const hideTimerRef = useRef(null);
    const removeTimerRef = useRef(null);

    const [formData, setFormData] = useState({
        email: pendingOnOpen ? (sessionStorage.getItem(EMAIL_CONFIRMATION_EMAIL_KEY) || '') : '',
        password: '',
        passwordConfirm: '',
        firstName: '',
        lastName: '',
        middleName: '',
        noMiddleName: false,
        birthDate: '',
        phoneNumber: '',
        course: '',
        campus: '',
        companyName: '',
        city: '',
    });

    const clearMessageTimers = () => {
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
        }
        if (removeTimerRef.current) {
            clearTimeout(removeTimerRef.current);
            removeTimerRef.current = null;
        }
    };

    const showMessage = (text) => {
        clearMessageTimers();
        setMessageText(text);
        setMessageLeaving(false);
        setMessageVisible(true);

        hideTimerRef.current = setTimeout(() => {
            setMessageLeaving(true);
            removeTimerRef.current = setTimeout(() => {
                setMessageVisible(false);
                setMessageLeaving(false);
            }, MESSAGE_LEAVE_DURATION);
        }, MESSAGE_TIMEOUT);
    };

    const clearMessage = () => {
        clearMessageTimers();
        setMessageVisible(false);
        setMessageLeaving(false);
        setMessageText('');
    };

    const setErrorAndShow = (text) => {
        setError(text);
        showMessage(text);
    };

    useEffect(() => {
        return () => clearMessageTimers();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        if (error) setError('');
        clearMessage();
    };

    const loginPreview = assignedUsername
        || (isStudent
            ? usernameFromEmail(formData.email)
            : usernameFromName(formData.lastName, formData.firstName));

    const accountPayload = (username) => ({
        username,
        password: formData.password,
        passwordConfirm: formData.passwordConfirm,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        middleName: formData.noMiddleName ? '' : formData.middleName.trim(),
        email: formData.email.trim(),
    });

    const registerWithFreeUsername = async (base, submit) => {
        let lastError = null;
        for (let attempt = 1; attempt <= 20; attempt += 1) {
            const username = usernameWithSuffix(base, attempt);
            try {
                await submit(username);
                setAssignedUsername(username);
                return username;
            } catch (err) {
                lastError = err;
                if (!isUsernameTakenError(err) || attempt === 20) throw err;
            }
        }
        throw lastError;
    };

    const registerStudentAndSendCode = async () => {
        setLoading(true);
        try {
            const email = formData.email.trim();
            const phoneNumber = normalizePhoneNumber(formData.phoneNumber);
            if (!studentAccountCreated) {
                const base = usernameFromEmail(email);
                const username = await registerWithFreeUsername(base, (login) => registerStudent({
                    username: login,
                    password: formData.password,
                    passwordConfirm: formData.passwordConfirm,
                    firstName: '',
                    lastName: '',
                    middleName: '',
                    email,
                    phoneNumber,
                }));
                markEmailConfirmationPending(email, username);
                setStudentAccountCreated(true);
            }
            setCode(['', '', '', '']);
            setStep(3);
        } catch (err) {
            const message = err.message || 'Не удалось отправить данные';
            setError(message);
            showMessage(message);
        } finally {
            setLoading(false);
        }
    };

    const submitRecruiter = async () => {
        setLoading(true);
        try {
            const base = usernameFromName(formData.lastName, formData.firstName);
            const username = await registerWithFreeUsername(base, (login) => registerRecruiter({
                ...accountPayload(login),
                companyName: formData.companyName.trim(),
                city: formData.city.trim(),
            }));
            onSuccess(role, username);
        } catch (err) {
            const message = err.message || 'Не удалось отправить данные';
            setError(message);
            showMessage(message);
        } finally {
            setLoading(false);
        }
    };

    const confirmStudentEmail = async () => {
        const fullCode = code.join('').trim();
        if (!/^\d{4}$/.test(fullCode)) {
            setErrorAndShow('Введите код из 4 цифр');
            return;
        }

        setLoading(true);
        try {
            await confirmEmail(fullCode);
            clearEmailConfirmationPending();
            setEmailConfirmed(true);
            setStep(4);
        } catch (err) {
            const message = err.message || 'Неверный код';
            setError(message);
            showMessage(message);
        } finally {
            setLoading(false);
        }
    };

    const finishStudentProfile = async () => {
        setLoading(true);
        try {
            await patchStudentMe({
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                middleName: formData.noMiddleName ? '' : formData.middleName.trim(),
                birthDate: formData.birthDate,
                course: COURSE_API[Number(formData.course)],
                city: formData.campus,
            });
            onSuccess(role, assignedUsername || loginPreview);
        } catch (err) {
            const message = err.message || 'Не удалось сохранить профиль';
            setError(message);
            showMessage(message);
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setError('');
        clearMessage();
        setLoading(true);
        try {
            await resendEmailConfirmation();
            showMessage('Код отправлен повторно');
        } catch (err) {
            const message = err.message || 'Не удалось отправить код';
            setError(message);
            showMessage(message);
        } finally {
            setLoading(false);
        }
    };

    const focusCodeInput = (index) => {
        const el = document.getElementById(`registerForm-code-${index}`);
        if (el) el.focus();
    };

    const handleCodeChange = (index, value) => {
        const digitsOnly = value.replace(/\D/g, '');
        const next = [...code];

        if (!digitsOnly) {
            next[index] = '';
            setCode(next);
            if (error) setError('');
            clearMessage();
            return;
        }

        let cursor = index;
        for (let i = 0; i < digitsOnly.length && cursor < CODE_LENGTH; i++) {
            next[cursor] = digitsOnly[i];
            cursor++;
        }
        setCode(next);
        if (error) setError('');
        clearMessage();

        const lastFilled = Math.min(cursor, CODE_LENGTH) - 1;
        if (lastFilled < CODE_LENGTH - 1) {
            focusCodeInput(lastFilled + 1);
        } else {
            focusCodeInput(CODE_LENGTH - 1);
        }
    };

    const handleCodeKeyDown = (index, e) => {
        if (e.key === 'Backspace') {
            e.preventDefault();
            const next = [...code];
            if (next[index]) {
                next[index] = '';
                setCode(next);
            } else if (index > 0) {
                next[index - 1] = '';
                setCode(next);
                focusCodeInput(index - 1);
            }
            if (error) setError('');
            clearMessage();
            return;
        }
        if (e.key === 'ArrowLeft' && index > 0) {
            e.preventDefault();
            focusCodeInput(index - 1);
        }
        if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
            e.preventDefault();
            focusCodeInput(index + 1);
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            handleNextStep();
        }
    };

    const handleCodeRowClick = () => {
        const firstEmpty = code.findIndex((d) => !d);
        const target = firstEmpty === -1 ? CODE_LENGTH - 1 : firstEmpty;
        focusCodeInput(target);
    };

    const handleCodePaste = (e) => {
        e.preventDefault();
        const pasted = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, CODE_LENGTH);
        if (!pasted) return;

        const next = ['', '', '', ''];
        for (let i = 0; i < pasted.length; i++) {
            next[i] = pasted[i];
        }
        setCode(next);
        if (error) setError('');
        clearMessage();

        const lastIndex = Math.min(pasted.length, CODE_LENGTH - 1);
        focusCodeInput(lastIndex);
    };

    const validateStudentPassword = () => {
        if (formData.password.length < 12) {
            setErrorAndShow('Пароль должен быть не короче 12 символов');
            return false;
        }
        const hasLetter = [...formData.password].some((ch) => /\p{L}/u.test(ch));
        const hasDigit = [...formData.password].some((ch) => /\d/.test(ch));
        if (!hasLetter || !hasDigit) {
            setErrorAndShow('Пароль должен содержать букву и цифру');
            return false;
        }
        if (formData.password !== formData.passwordConfirm) {
            setErrorAndShow('Пароли не совпадают');
            return false;
        }
        return true;
    };

    const handleNextStep = () => {
        setError('');
        clearMessage();

        if (!isStudent) {
            if (step === 1) {
                if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                    setErrorAndShow('Введите корректный email');
                    return;
                }
                setStep(2);
                return;
            }
            if (step === 2) {
                if (!formData.firstName.trim() || !formData.lastName.trim()) {
                    setErrorAndShow('Заполните имя и фамилию');
                    return;
                }
                if (!formData.noMiddleName && !formData.middleName.trim()) {
                    setErrorAndShow('Заполните отчество или отметьте галочку "Нет отчества"');
                    return;
                }
                setStep(3);
                return;
            }
            if (step === 3) {
                if (formData.password.length < 4) {
                    setErrorAndShow('Пароль должен быть не менее 4 символов');
                    return;
                }
                if (formData.password !== formData.passwordConfirm) {
                    setErrorAndShow('Пароли не совпадают');
                    return;
                }
                setStep(4);
                return;
            }
            if (step === 4) {
                if (!formData.companyName.trim()) { setErrorAndShow('Укажите название компании'); return; }
                if (!formData.city.trim()) { setErrorAndShow('Укажите город'); return; }
                submitRecruiter();
            }
            return;
        }

        // student
        if (step === 1) {
            if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                setErrorAndShow('Введите корректный email');
                return;
            }
            setStep(2);
            return;
        }

        if (step === 2) {
            if (!normalizePhoneNumber(formData.phoneNumber)) {
                setErrorAndShow('Введите телефон: от 7 до 15 цифр, можно с + в начале');
                return;
            }
            if (!validateStudentPassword()) return;
            registerStudentAndSendCode();
            return;
        }

        if (step === 3) {
            confirmStudentEmail();
            return;
        }

        if (step === 4) {
            if (!formData.firstName.trim() || !formData.lastName.trim()) {
                setErrorAndShow('Заполните имя и фамилию');
                return;
            }
            if (!formData.noMiddleName && !formData.middleName.trim()) {
                setErrorAndShow('Заполните отчество или отметьте галочку "Нет отчества"');
                return;
            }
            if (!formData.birthDate) {
                setErrorAndShow('Укажите дату рождения');
                return;
            }
            setStep(5);
            return;
        }

        if (step === 5) {
            if (!formData.course) { setErrorAndShow('Выберите курс'); return; }
            if (!formData.campus) { setErrorAndShow('Выберите кампус'); return; }
            finishStudentProfile();
        }
    };

    const handlePrevStep = () => {
        if (step > 1) {
            // После создания аккаунта не даём уйти с кода «назад» на пароль без сброса сессии
            if (isStudent && step === 3 && studentAccountCreated) {
                setErrorAndShow('Подтвердите почту кодом из письма');
                return;
            }
            if (isStudent && step === 4 && emailConfirmed) {
                setStep(3);
                setError('');
                clearMessage();
                return;
            }
            setStep((prev) => prev - 1);
            setError('');
            clearMessage();
            return;
        }
        onBack();
    };

    const renderStepContent = () => {
        if (!isStudent) {
            switch (step) {
                case 1:
                    return (
                        <>
                            <h2 className="registerForm__heading">Регистрация</h2>
                            <p className="registerForm__subheading">
                                Введите почту для аккаунта
                            </p>
                            <div className="registerForm__emailRow">
                                <div className="registerForm__emailIcon" aria-hidden="true">
                                    <img src={EmailIcon} alt="" className="registerForm__emailIconImg" />
                                </div>
                                <input
                                    id="registerForm-email"
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="youremail@example.com"
                                    disabled={loading}
                                    className={
                                        'registerForm__emailInput' +
                                        (error ? ' registerForm__emailInput--error' : '')
                                    }
                                />
                            </div>
                        </>
                    );
                case 2:
                    return (
                        <>
                            <h2 className="registerForm__heading registerForm__heading--step">Шаг 1 из 3</h2>
                            <div className="registerForm__inputGroup">
                                <label>Имя</label>
                                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} disabled={loading} />
                            </div>
                            <div className="registerForm__inputGroup">
                                <label>Фамилия</label>
                                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} disabled={loading} />
                            </div>
                            <div className="registerForm__inputGroup">
                                <label>Отчество</label>
                                <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} disabled={loading || formData.noMiddleName} />
                                <div className="registerForm__checkboxWrap">
                                    <input type="checkbox" id="noMiddleName" name="noMiddleName" checked={formData.noMiddleName} onChange={handleChange} disabled={loading} />
                                    <label htmlFor="noMiddleName">Нет отчества</label>
                                </div>
                            </div>
                        </>
                    );
                case 3:
                    return (
                        <>
                            <h2 className="registerForm__heading registerForm__heading--step">Шаг 2 из 3</h2>
                            <div className="registerForm__inputGroup">
                                <label>Пароль</label>
                                <input type="password" name="password" value={formData.password} onChange={handleChange} disabled={loading} />
                            </div>
                            <div className="registerForm__inputGroup">
                                <label>Повтор пароля</label>
                                <input type="password" name="passwordConfirm" value={formData.passwordConfirm} onChange={handleChange} disabled={loading} />
                            </div>
                        </>
                    );
                case 4:
                    return (
                        <>
                            <h2 className="registerForm__heading registerForm__heading--step">Шаг 3 из 3</h2>
                            <div className="registerForm__inputGroup">
                                <label>Официальное название компании</label>
                                <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} disabled={loading} />
                            </div>
                            <div className="registerForm__inputGroup">
                                <label>Город</label>
                                <input type="text" name="city" value={formData.city} onChange={handleChange} disabled={loading} />
                            </div>
                        </>
                    );
                default:
                    return null;
            }
        }

        switch (step) {
            case 1:
                return (
                    <>
                        <h2 className="registerForm__heading">Регистрация</h2>
                        <p className="registerForm__subheading">
                            Введите почту, на которую придёт письмо с кодом
                        </p>
                        <div className="registerForm__emailRow">
                            <div className="registerForm__emailIcon" aria-hidden="true">
                                <img src={EmailIcon} alt="" className="registerForm__emailIconImg" />
                            </div>
                            <input
                                id="registerForm-email"
                                type="email"
                                name="email"
                                autoComplete="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="youremail@example.com"
                                disabled={loading || studentAccountCreated}
                                className={
                                    'registerForm__emailInput' +
                                    (error ? ' registerForm__emailInput--error' : '')
                                }
                            />
                        </div>
                    </>
                );
            case 2:
                return (
                    <>
                        <h2 className="registerForm__heading">Данные для входа</h2>
                        <p className="registerForm__subheading">
                            Пароль и телефон нужны, чтобы создать аккаунт и отправить код на {formData.email}
                        </p>
                        <div className="registerForm__inputGroup">
                            <label htmlFor="registerForm-phone">Телефон</label>
                            <input
                                id="registerForm-phone"
                                type="tel"
                                name="phoneNumber"
                                autoComplete="tel"
                                inputMode="tel"
                                placeholder="+79991234567"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                disabled={loading || studentAccountCreated}
                            />
                        </div>
                        <div className="registerForm__inputGroup">
                            <label>Пароль</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                disabled={loading || studentAccountCreated}
                            />
                        </div>
                        <div className="registerForm__inputGroup">
                            <label>Повтор пароля</label>
                            <input
                                type="password"
                                name="passwordConfirm"
                                value={formData.passwordConfirm}
                                onChange={handleChange}
                                disabled={loading || studentAccountCreated}
                            />
                        </div>
                    </>
                );
            case 3:
                return (
                    <>
                        <h2 className="registerForm__heading">Введите код из письма</h2>
                        <p className="registerForm__subheading">
                            Отправили на почтовый ящик {formData.email}, если входящих нет, проверьте спам
                        </p>
                        <div
                            className="registerForm__codeRow"
                            ref={codeRowRef}
                            onClick={handleCodeRowClick}
                        >
                            {code.map((digit, index) => (
                                <input
                                    key={index}
                                    id={`registerForm-code-${index}`}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleCodeChange(index, e.target.value)}
                                    onKeyDown={(e) => handleCodeKeyDown(index, e)}
                                    onPaste={handleCodePaste}
                                    onFocus={(e) => e.target.select()}
                                    disabled={loading}
                                    className={
                                        'registerForm__codeInput' +
                                        (digit ? ' registerForm__codeInput--filled' : '') +
                                        (error ? ' registerForm__codeInput--error' : '')
                                    }
                                    autoComplete="one-time-code"
                                />
                            ))}
                        </div>
                    </>
                );
            case 4:
                return (
                    <>
                        <h2 className="registerForm__heading registerForm__heading--step">Шаг 1 из 2</h2>
                        <div className="registerForm__inputGroup">
                            <label>Имя</label>
                            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} disabled={loading} />
                        </div>
                        <div className="registerForm__inputGroup">
                            <label>Фамилия</label>
                            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} disabled={loading} />
                        </div>
                        <div className="registerForm__inputGroup">
                            <label>Отчество</label>
                            <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} disabled={loading || formData.noMiddleName} />
                            <div className="registerForm__checkboxWrap">
                                <input type="checkbox" id="noMiddleName" name="noMiddleName" checked={formData.noMiddleName} onChange={handleChange} disabled={loading} />
                                <label htmlFor="noMiddleName">Нет отчества</label>
                            </div>
                        </div>
                        <div className="registerForm__inputGroup">
                            <label>Дата рождения</label>
                            <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} disabled={loading} />
                        </div>
                    </>
                );
            case 5:
                return (
                    <>
                        <h2 className="registerForm__heading registerForm__heading--step">Шаг 2 из 2</h2>
                        <div className="registerForm__inputGroup">
                            <label>Курс</label>
                            <select name="course" value={formData.course} onChange={handleChange} disabled={loading}>
                                <option value="">Выберите курс</option>
                                {COURSE_OPTIONS.map((c) => (
                                    <option key={c} value={c}>{c} курс</option>
                                ))}
                            </select>
                        </div>
                        <div className="registerForm__inputGroup">
                            <label>Кампус</label>
                            <select name="campus" value={formData.campus} onChange={handleChange} disabled={loading}>
                                <option value="">Выберите кампус</option>
                                {CAMPUS_OPTIONS.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    const messageSlotClass =
        'registerForm__messageSlot' +
        (messageLeaving ? ' registerForm__messageSlot--leaving' : '');

    const showStepsCard = isStudent
        ? step === 2 || step === 4 || step === 5
        : step >= 2;

    const primaryLabel = () => {
        if (loading) return 'Отправка…';
        if (isStudent) {
            if (step === 3) return 'Подтвердить';
            if (step === 5) return 'Завершить';
            if (step === 2) return 'Получить код';
            return 'Далее';
        }
        if (step === 4) return 'Зарегистрироваться';
        return 'Далее';
    };

    return (
        <div className="registerForm__overlay">
            <div className={`registerForm__card${showStepsCard ? ' registerForm__card--steps' : ''}`}>
                <button
                    type="button"
                    className="registerForm__backBtn"
                    onClick={handlePrevStep}
                    aria-label="Назад"
                >
                    <img src={BackIcon} alt="Назад" className="registerForm__backIcon" />
                </button>

                <div className="registerForm__logoWrap">
                    <img src={LogoImage} alt="Resume Singularity" className="registerForm__logoImage" />
                </div>

                <div className="registerForm__form">
                    {renderStepContent()}

                    {((isStudent && step >= 2) || (!isStudent && step >= 3)) && loginPreview ? (
                        <p className="registerForm__subheading">
                            Логин для входа: {loginPreview}
                        </p>
                    ) : null}

                    <button
                        type="button"
                        className="registerForm__primaryBtn"
                        onClick={handleNextStep}
                        disabled={loading}
                    >
                        {primaryLabel()}
                    </button>

                    {isStudent && step === 3 ? (
                        <button
                            type="button"
                            className="registerForm__primaryBtn registerForm__primaryBtn--secondary"
                            onClick={handleResendCode}
                            disabled={loading}
                        >
                            Получить новый код
                        </button>
                    ) : null}
                </div>
            </div>

            {messageVisible && messageText ? (
                <div className={messageSlotClass}>
                    <div className="registerForm__inlineMessage" role="alert">
                        {messageText}
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default RegisterForm;
