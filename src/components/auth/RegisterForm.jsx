import React, { useState, useEffect, useRef } from 'react';
import {
    changePassword,
    clearRegistrationDraft,
    confirmEmail,
    EMAIL_CONFIRMATION_EMAIL_KEY,
    EMAIL_CONFIRMATION_PENDING_KEY,
    logoutServer,
    REGISTRATION_TEMP_PASSWORD_KEY,
    REGISTRATION_USERNAME_KEY,
    registerRecruiter,
    registerStudent,
    resendEmailConfirmation,
} from '../../services/authApi.js';
import {
    formatRuPhoneInput,
    isEmailTakenError,
    isUsernameTakenError,
    isValidEmail,
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
const TAKEN_EMAILS_KEY = 'resume:taken-emails';

const emailConfirmationPending = () =>
    sessionStorage.getItem(EMAIL_CONFIRMATION_PENDING_KEY) === '1';

const readTakenEmails = () => {
    try {
        const raw = sessionStorage.getItem(TAKEN_EMAILS_KEY);
        const list = raw ? JSON.parse(raw) : [];
        return new Set(Array.isArray(list) ? list.map((e) => String(e).toLowerCase()) : []);
    } catch {
        return new Set();
    }
};

const rememberTakenEmail = (email) => {
    const set = readTakenEmails();
    set.add(String(email || '').trim().toLowerCase());
    sessionStorage.setItem(TAKEN_EMAILS_KEY, JSON.stringify([...set]));
};

const markEmailConfirmationPending = (email, username, tempPassword) => {
    sessionStorage.setItem(EMAIL_CONFIRMATION_PENDING_KEY, '1');
    sessionStorage.setItem(EMAIL_CONFIRMATION_EMAIL_KEY, email);
    sessionStorage.setItem(REGISTRATION_USERNAME_KEY, username);
    if (tempPassword) {
        sessionStorage.setItem(REGISTRATION_TEMP_PASSWORD_KEY, tempPassword);
    }
};

const randomTempPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let out = 'Aa1';
    for (let i = 0; i < 18; i += 1) {
        out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
};

const randomTempPhone = () => {
    let tail = '';
    for (let i = 0; i < 9; i += 1) {
        tail += Math.floor(Math.random() * 10);
    }
    return `+79${tail}`;
};

const usernameFromEmail = (email) => {
    const local = String(email || '').split('@')[0] || '';
    return usernameFromName(local, 'user');
};

const RegisterForm = ({ role, onBack, onSuccess }) => {
    const isStudent = role === 'student';
    const hadPendingOnOpen = isStudent && emailConfirmationPending();

    // Студент: 0 выбор продолжения → 1 email (проверка занятости) → 2 код → 3 пароль+телефон → 4 ФИО → 5 курс
    const [step, setStep] = useState(hadPendingOnOpen ? 0 : 1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [studentAccountCreated, setStudentAccountCreated] = useState(hadPendingOnOpen);
    const [emailConfirmed, setEmailConfirmed] = useState(false);
    const [emailTouched, setEmailTouched] = useState(false);
    const [emailChecking, setEmailChecking] = useState(false);
    const [assignedUsername, setAssignedUsername] = useState(
        hadPendingOnOpen ? (sessionStorage.getItem(REGISTRATION_USERNAME_KEY) || '') : '',
    );
    const [pendingEmail] = useState(
        hadPendingOnOpen ? (sessionStorage.getItem(EMAIL_CONFIRMATION_EMAIL_KEY) || '') : '',
    );
    const [code, setCode] = useState(['', '', '', '']);
    const codeRowRef = useRef(null);
    const emailCheckSeq = useRef(0);

    const [messageVisible, setMessageVisible] = useState(false);
    const [messageLeaving, setMessageLeaving] = useState(false);
    const [messageText, setMessageText] = useState('');
    const hideTimerRef = useRef(null);
    const removeTimerRef = useRef(null);

    const [formData, setFormData] = useState({
        email: '',
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

    const startFresh = async () => {
        clearRegistrationDraft();
        await logoutServer().catch(() => {});
        setStudentAccountCreated(false);
        setEmailConfirmed(false);
        setAssignedUsername('');
        setCode(['', '', '', '']);
        setEmailTouched(false);
        setError('');
        clearMessage();
        setFormData((prev) => ({
            ...prev,
            email: '',
            password: '',
            passwordConfirm: '',
            phoneNumber: '',
            firstName: '',
            lastName: '',
            middleName: '',
            noMiddleName: false,
            birthDate: '',
            course: '',
            campus: '',
        }));
        setStep(1);
    };

    const continuePending = () => {
        setFormData((prev) => ({
            ...prev,
            email: pendingEmail || prev.email,
        }));
        setStudentAccountCreated(true);
        setAssignedUsername(sessionStorage.getItem(REGISTRATION_USERNAME_KEY) || '');
        setStep(2);
    };

    const emailErrorText = (value = formData.email) => {
        const email = String(value || '').trim();
        if (!email) return 'Введите email';
        if (!isValidEmail(email)) return 'Введите корректный email';
        if (readTakenEmails().has(email.toLowerCase())) {
            return 'Эта почта уже используется';
        }
        return '';
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let nextValue = type === 'checkbox' ? checked : value;

        if (name === 'phoneNumber') {
            nextValue = formatRuPhoneInput(value);
        }

        setFormData((prev) => ({
            ...prev,
            [name]: nextValue,
        }));

        if (name === 'email') {
            setEmailTouched(true);
            const trimmed = String(nextValue || '').trim();
            if (!trimmed) {
                setError('Введите email');
            } else if (!isValidEmail(trimmed)) {
                setError('Введите корректный email');
            } else if (readTakenEmails().has(trimmed.toLowerCase())) {
                setError('Эта почта уже используется');
            } else {
                setError('');
                clearMessage();
            }
            return;
        }

        if (error) setError('');
        clearMessage();
    };

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
                if (isEmailTakenError(err)) throw err;
                if (!isUsernameTakenError(err) || attempt === 20) throw err;
            }
        }
        throw lastError;
    };

    /**
     * Проверка занятости почты через register-student (отдельного check-email в API нет).
     * При успехе аккаунт создаётся с временным паролем/телефоном → дальше код.
     */
    const checkEmailAndCreateStudent = async (email) => {
        const tempPassword = randomTempPassword();
        const tempPhone = randomTempPhone();
        const base = usernameFromEmail(email);
        const username = await registerWithFreeUsername(base, (login) => registerStudent({
            username: login,
            password: tempPassword,
            passwordConfirm: tempPassword,
            firstName: '',
            lastName: '',
            middleName: '',
            email,
            phoneNumber: tempPhone,
        }));
        markEmailConfirmationPending(email, username, tempPassword);
        setStudentAccountCreated(true);
        return username;
    };

    const verifyEmailAvailability = async (email, { advanceOnSuccess } = { advanceOnSuccess: false }) => {
        const formatMsg = emailErrorText(email);
        if (formatMsg) {
            setErrorAndShow(formatMsg);
            return false;
        }

        if (studentAccountCreated) {
            if (advanceOnSuccess) setStep(2);
            return true;
        }

        const seq = ++emailCheckSeq.current;
        setEmailChecking(true);
        setLoading(true);
        try {
            await checkEmailAndCreateStudent(email.trim());
            if (seq !== emailCheckSeq.current) return false;
            setError('');
            clearMessage();
            if (advanceOnSuccess) {
                setCode(['', '', '', '']);
                setStep(2);
            }
            return true;
        } catch (err) {
            if (seq !== emailCheckSeq.current) return false;
            if (isEmailTakenError(err)) {
                rememberTakenEmail(email);
                setErrorAndShow('Эта почта уже используется');
                setStep(1);
                return false;
            }
            const message = err.message || 'Не удалось проверить почту';
            setError(message);
            showMessage(message);
            return false;
        } finally {
            if (seq === emailCheckSeq.current) {
                setEmailChecking(false);
                setLoading(false);
            }
        }
    };

    const handleEmailBlur = () => {
        setEmailTouched(true);
        const email = formData.email.trim();
        const formatMsg = emailErrorText(email);
        if (formatMsg) {
            setError(formatMsg);
            showMessage(formatMsg);
            return;
        }
        // Занятость проверяем на «Далее» (register-student): на blur не создаём аккаунт из‑за опечаток
        setError('');
        clearMessage();
    };

    const loginPreview = assignedUsername;

    const accountPayload = (username) => ({
        username,
        password: formData.password,
        passwordConfirm: formData.passwordConfirm,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        middleName: formData.noMiddleName ? '' : formData.middleName.trim(),
        email: formData.email.trim(),
    });

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
            const message = isEmailTakenError(err)
                ? 'Эта почта уже используется'
                : (err.message || 'Не удалось отправить данные');
            if (isEmailTakenError(err)) {
                rememberTakenEmail(formData.email);
                setStep(1);
            }
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
            setEmailConfirmed(true);
            setStep(3);
        } catch (err) {
            const message = err.message || 'Неверный код';
            setError(message);
            showMessage(message);
        } finally {
            setLoading(false);
        }
    };

    const saveStudentCredentials = async () => {
        const phoneNumber = normalizePhoneNumber(formData.phoneNumber);
        if (!phoneNumber) {
            setErrorAndShow('Телефон: формат +79991234567 (ровно 11 цифр)');
            return;
        }
        if (formData.password.length < 12) {
            setErrorAndShow('Пароль должен быть не короче 12 символов');
            return;
        }
        const hasLetter = [...formData.password].some((ch) => /\p{L}/u.test(ch));
        const hasDigit = [...formData.password].some((ch) => /\d/.test(ch));
        if (!hasLetter || !hasDigit) {
            setErrorAndShow('Пароль должен содержать букву и цифру');
            return;
        }
        if (formData.password !== formData.passwordConfirm) {
            setErrorAndShow('Пароли не совпадают');
            return;
        }

        const tempPassword = sessionStorage.getItem(REGISTRATION_TEMP_PASSWORD_KEY);
        if (!tempPassword) {
            setErrorAndShow('Сессия регистрации сброшена. Начните заново.');
            await startFresh();
            return;
        }

        setLoading(true);
        try {
            await changePassword(tempPassword, formData.password);
            await patchStudentMe({ phoneNumber });
            sessionStorage.removeItem(REGISTRATION_TEMP_PASSWORD_KEY);
            setStep(4);
        } catch (err) {
            const message = err.message || 'Не удалось сохранить пароль и телефон';
            setError(message);
            showMessage(message);
        } finally {
            setLoading(false);
        }
    };

    const saveStudentStepFio = async () => {
        setLoading(true);
        try {
            await patchStudentMe({
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                middleName: formData.noMiddleName ? '' : formData.middleName.trim(),
                birthDate: formData.birthDate,
            });
            setStep(5);
        } catch (err) {
            const message = err.message || 'Не удалось сохранить данные';
            setError(message);
            showMessage(message);
        } finally {
            setLoading(false);
        }
    };

    const saveStudentStepCourse = async () => {
        setLoading(true);
        try {
            await patchStudentMe({
                course: COURSE_API[Number(formData.course)],
                city: formData.campus,
            });
            clearRegistrationDraft();
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

    const handleNextStep = async () => {
        setError('');
        clearMessage();

        if (!isStudent) {
            if (step === 1) {
                setEmailTouched(true);
                const msg = emailErrorText();
                if (msg) { setErrorAndShow(msg); return; }
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

        if (step === 0) return;

        if (step === 1) {
            setEmailTouched(true);
            await verifyEmailAvailability(formData.email.trim(), { advanceOnSuccess: true });
            return;
        }

        if (step === 2) {
            confirmStudentEmail();
            return;
        }

        if (step === 3) {
            saveStudentCredentials();
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
            saveStudentStepFio();
            return;
        }

        if (step === 5) {
            if (!formData.course) { setErrorAndShow('Выберите курс'); return; }
            if (!formData.campus) { setErrorAndShow('Выберите кампус'); return; }
            saveStudentStepCourse();
        }
    };

    const handlePrevStep = () => {
        setError('');
        clearMessage();

        if (isStudent && step === 0) {
            onBack();
            return;
        }

        if (step <= 1) {
            onBack();
            return;
        }

        if (isStudent && step === 2) {
            setStep(1);
            return;
        }

        if (isStudent && step === 3 && emailConfirmed) {
            setStep(2);
            return;
        }

        setStep((prev) => prev - 1);
    };

    const emailInputClass = () => {
        const invalid = emailTouched && Boolean(emailErrorText());
        return 'registerForm__emailInput' + (invalid || (error && step === 1) ? ' registerForm__emailInput--error' : '');
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
                                    onBlur={handleEmailBlur}
                                    placeholder="youremail@example.com"
                                    disabled={loading}
                                    className={emailInputClass()}
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

        if (step === 0) {
            return (
                <>
                    <h2 className="registerForm__heading">Продолжить регистрацию?</h2>
                    <p className="registerForm__subheading">
                        Найдена незавершённая регистрация
                        {pendingEmail ? ` для ${pendingEmail}` : ''}. Можно подтвердить код или начать заново.
                    </p>
                </>
            );
        }

        switch (step) {
            case 1:
                return (
                    <>
                        <h2 className="registerForm__heading">Регистрация</h2>
                        <p className="registerForm__subheading">
                            Введите почту — проверим, свободна ли она
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
                                onBlur={handleEmailBlur}
                                placeholder="youremail@example.com"
                                disabled={loading || emailChecking || studentAccountCreated}
                                className={emailInputClass()}
                            />
                        </div>
                    </>
                );
            case 2:
                return (
                    <>
                        <h2 className="registerForm__heading">Введите код из письма</h2>
                        <p className="registerForm__subheading">
                            Отправили на почтовый ящик {formData.email || pendingEmail}, если входящих нет, проверьте спам
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
            case 3:
                return (
                    <>
                        <h2 className="registerForm__heading registerForm__heading--step">Шаг 1 из 3</h2>
                        <p className="registerForm__subheading">
                            Задайте пароль и телефон для входа
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
                                maxLength={12}
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>
                        <div className="registerForm__inputGroup">
                            <label>Пароль</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>
                        <div className="registerForm__inputGroup">
                            <label>Повтор пароля</label>
                            <input
                                type="password"
                                name="passwordConfirm"
                                value={formData.passwordConfirm}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>
                    </>
                );
            case 4:
                return (
                    <>
                        <h2 className="registerForm__heading registerForm__heading--step">Шаг 2 из 3</h2>
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
                        <h2 className="registerForm__heading registerForm__heading--step">Шаг 3 из 3</h2>
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
        ? step === 3 || step === 4 || step === 5
        : step >= 2;

    const primaryLabel = () => {
        if (loading || emailChecking) return 'Проверка…';
        if (isStudent) {
            if (step === 0) return null;
            if (step === 2) return 'Подтвердить';
            if (step === 5) return 'Завершить';
            if (step === 1) return studentAccountCreated ? 'К коду' : 'Далее';
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

                    {assignedUsername && step >= 2 && step !== 0 ? (
                        <p className="registerForm__subheading">
                            Логин для входа: {assignedUsername}
                        </p>
                    ) : null}

                    {isStudent && step === 0 ? (
                        <>
                            <button
                                type="button"
                                className="registerForm__primaryBtn"
                                onClick={continuePending}
                                disabled={loading}
                            >
                                Продолжить
                            </button>
                            <button
                                type="button"
                                className="registerForm__primaryBtn registerForm__primaryBtn--secondary"
                                onClick={startFresh}
                                disabled={loading}
                            >
                                Начать заново
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            className="registerForm__primaryBtn"
                            onClick={handleNextStep}
                            disabled={loading || emailChecking}
                        >
                            {primaryLabel()}
                        </button>
                    )}

                    {isStudent && step === 2 ? (
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
