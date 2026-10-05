import React, { useState, useEffect, useRef } from 'react';
import {
    confirmEmail,
    EMAIL_CONFIRMATION_EMAIL_KEY,
    EMAIL_CONFIRMATION_PENDING_KEY,
    registerRecruiter,
    registerStudent,
    resendEmailConfirmation,
} from '../../services/authApi.js';
import { getSpecialitiesForRegistration } from '../../services/getApi.js';
import './registerForm.css';
import BackIcon from '../../assets/icons/vectorAuth.svg';
import LogoImage from '../../assets/logos/resume_logo_mini.png';
import EmailIcon from '../../assets/icons/email.svg';

const CAMPUS_OPTIONS = [
    'Москва', 'Санкт-Петербург', 'Казань', 'Новосибирск',
    'Екатеринбург', 'Нижний Новгород', 'Краснодар', 'Ростов-на-Дону',
    'Самара', 'Воронеж', 'Уфа', 'Пермь', 'Чебоксары', 'Челябинск', 'Онлайн'
];

const COURSE_OPTIONS = [1, 2, 3, 4];
const CODE_LENGTH = 4;
const MESSAGE_TIMEOUT = 3000;
const MESSAGE_LEAVE_DURATION = 300;

const emailConfirmationPending = () =>
    sessionStorage.getItem(EMAIL_CONFIRMATION_PENDING_KEY) === '1';

const markEmailConfirmationPending = (email) => {
    sessionStorage.setItem(EMAIL_CONFIRMATION_PENDING_KEY, '1');
    sessionStorage.setItem(EMAIL_CONFIRMATION_EMAIL_KEY, email);
};

const clearEmailConfirmationPending = () => {
    sessionStorage.removeItem(EMAIL_CONFIRMATION_PENDING_KEY);
    sessionStorage.removeItem(EMAIL_CONFIRMATION_EMAIL_KEY);
};

const RegisterForm = ({ role, onBack, onSuccess }) => {
    const isStudent = role === 'student';
    const pendingOnOpen = isStudent && emailConfirmationPending();
    const [step, setStep] = useState(pendingOnOpen ? 5 : 1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [studentAccountCreated, setStudentAccountCreated] = useState(pendingOnOpen);
    const [specialties, setSpecialties] = useState([]);
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
        course: '',
        specialityId: '',
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

    useEffect(() => {
        if (role === 'student') {
            let cancelled = false;
            (async () => {
                try {
                    const data = await getSpecialitiesForRegistration();
                    if (cancelled) return;
                    const normalized = data
                        .map((item) => ({
                            id: String(item.id),
                            name: item.name || item.specialityName || `Специальность ${item.id}`,
                        }))
                        .filter((item) => item.id && item.name)
                        .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
                    setSpecialties(normalized);
                } catch (err) {
                    console.error('Failed to load specialities:', err);
                    if (!cancelled) setSpecialties([]);
                }
            })();
            return () => { cancelled = true; };
        }
    }, [role]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (error) setError('');
        clearMessage();
    };

    const accountPayload = () => ({
        username: formData.email.trim(),
        password: formData.password,
        passwordConfirm: formData.passwordConfirm,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        middleName: formData.noMiddleName ? '' : formData.middleName.trim(),
        email: formData.email.trim(),
    });

    const registerStudentAccount = async () => {
        if (studentAccountCreated) {
            setStep(5);
            return;
        }

        setLoading(true);
        try {
            const email = formData.email.trim();
            await registerStudent({
                ...accountPayload(),
                birthDate: formData.birthDate,
                campus: formData.campus,
                city: formData.campus,
                specialityId: Number(formData.specialityId),
                course: Number(formData.course),
            });
            markEmailConfirmationPending(email);
            setStudentAccountCreated(true);
            setCode(['', '', '', '']);
            setStep(5);
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
            await registerRecruiter({
                ...accountPayload(),
                companyName: formData.companyName.trim(),
                city: formData.city.trim(),
                phoneNumber: '',
            });
            onSuccess(role);
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
            onSuccess(role);
        } catch (err) {
            const message = err.message || 'Неверный код';
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

    const handleCodeRowClick = (e) => {
        if (e.target.closest('input')) return;
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

    const handleNextStep = () => {
        setError('');
        clearMessage();

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
            if (isStudent && !formData.birthDate) {
                setErrorAndShow('Укажите дату рождения');
                return;
            }
            setStep(3);
            return;
        }

        if (step === 3) {
            const minLength = isStudent ? 12 : 4;
            if (formData.password.length < minLength) {
                setErrorAndShow(
                    isStudent
                        ? 'Пароль должен быть не короче 12 символов'
                        : 'Пароль должен быть не менее 4 символов',
                );
                return;
            }
            if (isStudent) {
                const hasLetter = [...formData.password].some((ch) => /\p{L}/u.test(ch));
                const hasDigit = [...formData.password].some((ch) => /\d/.test(ch));
                if (!hasLetter || !hasDigit) {
                    setErrorAndShow('Пароль должен содержать букву и цифру');
                    return;
                }
            }
            if (formData.password !== formData.passwordConfirm) {
                setErrorAndShow('Пароли не совпадают');
                return;
            }
            setStep(4);
            return;
        }

        if (step === 4) {
            if (isStudent) {
                if (!formData.course) { setErrorAndShow('Выберите курс'); return; }
                if (!formData.specialityId) { setErrorAndShow('Выберите направление'); return; }
                if (!formData.campus) { setErrorAndShow('Выберите кампус'); return; }
                registerStudentAccount();
                return;
            }
            if (!formData.companyName.trim()) { setErrorAndShow('Укажите название компании'); return; }
            if (!formData.city.trim()) { setErrorAndShow('Укажите город'); return; }
            submitRecruiter();
            return;
        }

        if (step === 5 && isStudent) {
            confirmStudentEmail();
        }
    };

    const handlePrevStep = () => {
        if (step > 1) {
            setStep(prev => prev - 1);
            setError('');
            clearMessage();
            return;
        }
        onBack();
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <>
                        <h2 className="registerForm__heading">Регистрация</h2>
                        <p className="registerForm__subheading">
                            {isStudent
                                ? 'Введите почту для аккаунта. Код подтверждения придёт после заполнения анкеты'
                                : 'Введите почту для аккаунта'}
                        </p>

                        <div className="registerForm__emailRow">
                            <div className="registerForm__emailIcon" aria-hidden="true">
                                <img
                                    src={EmailIcon}
                                    alt=""
                                    className="registerForm__emailIconImg"
                                />
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
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>
                        <div className="registerForm__inputGroup">
                            <label>Фамилия</label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>

                        <div className="registerForm__inputGroup">
                            <label>Отчество</label>
                            <input
                                type="text"
                                name="middleName"
                                value={formData.middleName}
                                onChange={handleChange}
                                disabled={loading || formData.noMiddleName}
                            />
                            <div className="registerForm__checkboxWrap">
                                <input
                                    type="checkbox"
                                    id="noMiddleName"
                                    name="noMiddleName"
                                    checked={formData.noMiddleName}
                                    onChange={handleChange}
                                    disabled={loading}
                                />
                                <label htmlFor="noMiddleName">Нет отчества</label>
                            </div>
                        </div>

                        {isStudent && (
                            <div className="registerForm__inputGroup">
                                <label>Дата рождения</label>
                                <input
                                    type="date"
                                    name="birthDate"
                                    value={formData.birthDate}
                                    onChange={handleChange}
                                    disabled={loading}
                                />
                            </div>
                        )}
                    </>
                );
            case 3:
                return (
                    <>
                        <h2 className="registerForm__heading registerForm__heading--step">Шаг 2 из 3</h2>

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
                if (isStudent) {
                    return (
                        <>
                            <h2 className="registerForm__heading registerForm__heading--step">Шаг 3 из 3</h2>

                            <div className="registerForm__inputGroup">
                                <label>Курс</label>
                                <select name="course" value={formData.course} onChange={handleChange} disabled={loading}>
                                    <option value="">Выберите курс</option>
                                    {COURSE_OPTIONS.map(c => <option key={c} value={c}>{c} курс</option>)}
                                </select>
                            </div>

                            <div className="registerForm__inputGroup">
                                <label>Направление (Специальность)</label>
                                <select name="specialityId" value={formData.specialityId} onChange={handleChange} disabled={loading}>
                                    <option value="">Выберите направление</option>
                                    {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>

                            <div className="registerForm__inputGroup">
                                <label>Кампус</label>
                                <select name="campus" value={formData.campus} onChange={handleChange} disabled={loading}>
                                    <option value="">Выберите кампус</option>
                                    {CAMPUS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </>
                    );
                }
                return (
                    <>
                        <h2 className="registerForm__heading registerForm__heading--step">Шаг 3 из 3</h2>

                        <div className="registerForm__inputGroup">
                            <label>Официальное название компании</label>
                            <input
                                type="text"
                                name="companyName"
                                value={formData.companyName}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>

                        <div className="registerForm__inputGroup">
                            <label>Город</label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>
                    </>
                );
            case 5:
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
                                    onClick={(e) => e.stopPropagation()}
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

                        <button
                            type="button"
                            className="registerForm__primaryBtn"
                            onClick={handleResendCode}
                            disabled={loading}
                        >
                            Получить новый код
                        </button>
                    </>
                );
            default:
                return null;
        }
    };

    const messageSlotClass =
        'registerForm__messageSlot' +
        (messageLeaving ? ' registerForm__messageSlot--leaving' : '');

    return (
        <div className="registerForm__overlay">
            <div className={`registerForm__card${step >= 2 && step <= 4 ? ' registerForm__card--steps' : ''}`}>
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

                    <button
                        type="button"
                        className="registerForm__primaryBtn"
                        onClick={handleNextStep}
                        disabled={loading}
                    >
                        {loading
                            ? 'Отправка…'
                            : step === 5
                                ? 'Подтвердить'
                                : step === 4 && !(isStudent && studentAccountCreated)
                                    ? 'Зарегистрироваться'
                                    : 'Далее'}
                    </button>
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