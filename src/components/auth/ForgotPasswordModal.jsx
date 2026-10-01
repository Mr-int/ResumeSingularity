import React, { useState, useEffect, useRef } from 'react';
import './forgotPasswordModal.css';
import BackIcon from '../../assets/icons/vectorAuth.svg';
import LogoImage from '../../assets/logos/resume_logo_mini.png';
import EmailIcon from '../../assets/icons/email.svg';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_LENGTH = 4;
const MESSAGE_TIMEOUT = 3000;
const MESSAGE_LEAVE_DURATION = 300;

const ForgotPasswordModal = ({ onBack, onClose }) => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState(['', '', '', '']);
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [loading, setLoading] = useState(false);

    const [messageVisible, setMessageVisible] = useState(false);
    const [messageLeaving, setMessageLeaving] = useState(false);
    const [messagePayload, setMessagePayload] = useState({ type: null, text: '' });

    const hideTimerRef = useRef(null);
    const removeTimerRef = useRef(null);
    const codeRowRef = useRef(null);

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

    const showMessage = (type, text) => {
        clearMessageTimers();
        setMessagePayload({ type, text });
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

    useEffect(() => {
        return () => clearMessageTimers();
    }, []);

    const setErrorAndShow = (text) => {
        setError(text);
        setInfo('');
        showMessage('error', text);
    };

    const setInfoAndShow = (text) => {
        setInfo(text);
        setError('');
        showMessage('success', text);
    };

    const clearMessages = () => {
        clearMessageTimers();
        setMessageVisible(false);
        setMessageLeaving(false);
        setMessagePayload({ type: null, text: '' });
        if (error) setError('');
        if (info) setInfo('');
    };

    const handleSendInstruction = async () => {
        setError('');
        setInfo('');

        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            setErrorAndShow('Введите email');
            return;
        }
        if (!EMAIL_REGEX.test(trimmedEmail)) {
            setErrorAndShow('Некорректный email');
            return;
        }

        setLoading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 600));
            setStep(2);
            setCode(['', '', '', '']);
            setInfoAndShow(`Код отправлен на ${trimmedEmail}`);
        } catch (err) {
            const message =
                (err && err.message && String(err.message).trim()) ||
                'Не удалось отправить код';
            setErrorAndShow(message);
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setError('');
        setInfo('');
        setLoading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 600));
            setInfoAndShow(`Код повторно отправлен на ${email}`);
        } catch (err) {
            const message =
                (err && err.message && String(err.message).trim()) ||
                'Не удалось отправить код';
            setErrorAndShow(message);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmCode = async (codeArray) => {
        setError('');
        setInfo('');

        const source = codeArray || code;
        const fullCode = source.join('').trim();

        if (fullCode.length < CODE_LENGTH) {
            setErrorAndShow('Введите код полностью');
            return;
        }

        setLoading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 600));
            setStep(3);
            setInfoAndShow('Код подтверждён. Придумайте новый пароль.');
        } catch (err) {
            const message =
                (err && err.message && String(err.message).trim()) ||
                'Неверный код';
            setErrorAndShow(message);
        } finally {
            setLoading(false);
        }
    };

    const handleSavePassword = async () => {
        setError('');
        setInfo('');

        if (password.length < 4) {
            setErrorAndShow('Пароль должен быть не менее 4 символов');
            return;
        }
        if (password !== passwordConfirm) {
            setErrorAndShow('Пароли не совпадают');
            return;
        }

        setLoading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 600));
            setInfoAndShow('Пароль успешно изменён. Теперь войдите с новым паролем.');
            setTimeout(() => {
                if (onBack) onBack();
                else if (onClose) onClose();
            }, 1800);
        } catch (err) {
            const message =
                (err && err.message && String(err.message).trim()) ||
                'Не удалось сохранить пароль';
            setErrorAndShow(message);
        } finally {
            setLoading(false);
        }
    };

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
        clearMessages();
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
        clearMessages();
    };

    const handlePasswordConfirmChange = (e) => {
        setPasswordConfirm(e.target.value);
        clearMessages();
    };

    const focusCodeInput = (index) => {
        const el = document.getElementById(`forgotModal-code-${index}`);
        if (el) el.focus();
    };

    const handleCodeChange = (index, value) => {
        const digitsOnly = value.replace(/\D/g, '');
        const next = [...code];

        if (!digitsOnly) {
            next[index] = '';
            setCode(next);
            clearMessages();
            return;
        }

        let cursor = index;
        for (let i = 0; i < digitsOnly.length && cursor < CODE_LENGTH; i++) {
            next[cursor] = digitsOnly[i];
            cursor++;
        }
        setCode(next);
        clearMessages();

        const lastFilled = Math.min(cursor, CODE_LENGTH) - 1;
        if (lastFilled < CODE_LENGTH - 1) {
            focusCodeInput(lastFilled + 1);
        } else {
            focusCodeInput(CODE_LENGTH - 1);
            handleConfirmCode(next);
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
            clearMessages();
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
            handleConfirmCode();
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
        clearMessages();

        if (pasted.length === CODE_LENGTH) {
            focusCodeInput(CODE_LENGTH - 1);
            handleConfirmCode(next);
        } else {
            focusCodeInput(Math.min(pasted.length, CODE_LENGTH - 1));
        }
    };

    const handleBack = () => {
        if (step === 3) {
            setStep(2);
            setCode(['', '', '', '']);
            setPassword('');
            setPasswordConfirm('');
            clearMessages();
            return;
        }
        if (step === 2) {
            setStep(1);
            setCode(['', '', '', '']);
            clearMessages();
            return;
        }
        if (onBack) onBack();
        else if (onClose) onClose();
    };

    const messageSlotClass =
        'forgotModal__messageSlot' +
        (messageLeaving ? ' forgotModal__messageSlot--leaving' : '');

    return (
        <div className="forgotModal__overlay">
            <div className="forgotModal__card">
                <button
                    type="button"
                    className="forgotModal__backBtn"
                    onClick={handleBack}
                    aria-label="Назад"
                >
                    <img
                        src={BackIcon}
                        alt="Назад"
                        className="forgotModal__backIcon"
                    />
                </button>

                <div className="forgotModal__logoWrap">
                    <img
                        src={LogoImage}
                        alt="Resume Singularity"
                        className="forgotModal__logoImage"
                    />
                </div>

                {step === 1 ? (
                    <>
                        <h2 className="forgotModal__heading">Восстановление пароля</h2>
                        <p className="forgotModal__subheading">
                            Введите почтовый ящик, который вы использовали при регистрации,
                            и мы отправим письмо с кодом
                        </p>

                        <div className="forgotModal__form">
                            <div className="forgotModal__emailRow">
                                <div className="forgotModal__emailIcon" aria-hidden="true">
                                    <img
                                        src={EmailIcon}
                                        alt=""
                                        className="forgotModal__emailIconImg"
                                    />
                                </div>
                                <input
                                    id="forgotModal-email"
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={handleEmailChange}
                                    disabled={loading}
                                    placeholder="youremail@example.com"
                                    className={
                                        'forgotModal__emailInput' +
                                        (error ? ' forgotModal__emailInput--error' : '')
                                    }
                                />
                            </div>

                            <button
                                type="button"
                                className="forgotModal__primaryBtn"
                                onClick={handleSendInstruction}
                                disabled={loading}
                            >
                                {loading ? 'Отправка…' : 'Отправить код'}
                            </button>
                        </div>

                        <span className="forgotModal__policy">
                            Нажимая «Далее», вы принимаете{' '}
                            <a
                                href="#"
                                className="forgotModal__policyLink"
                                onClick={(e) => e.preventDefault()}
                            >
                                политику конфиденциальности
                            </a>{' '}
                            и{' '}
                            <a
                                href="#"
                                className="forgotModal__policyLink"
                                onClick={(e) => e.preventDefault()}
                            >
                                правила сервиса
                            </a>
                        </span>
                    </>
                ) : step === 2 ? (
                    <>
                        <h2 className="forgotModal__heading">Введите код из письма</h2>
                        <p className="forgotModal__subheading">
                            Если почтовый ящик зарегистрирован, мы отправили код на{' '}
                            <span className="forgotModal__codeEmail">{email}</span>,
                            {' '}если входящих нет, проверьте спам
                        </p>

                        <div className="forgotModal__form">
                            <div
                                className="forgotModal__codeRow"
                                ref={codeRowRef}
                                onClick={handleCodeRowClick}
                            >
                                {code.map((digit, index) => (
                                    <input
                                        key={index}
                                        id={`forgotModal-code-${index}`}
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
                                            'forgotModal__codeInput' +
                                            (digit ? ' forgotModal__codeInput--filled' : '') +
                                            (error ? ' forgotModal__codeInput--error' : '')
                                        }
                                        autoComplete="one-time-code"
                                    />
                                ))}
                            </div>

                            <button
                                type="button"
                                className="forgotModal__primaryBtn forgotModal__primaryBtn--resend"
                                onClick={handleResendCode}
                                disabled={loading}
                            >
                                Получить новый код
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h2 className="forgotModal__heading">Новый пароль</h2>
                        <p className="forgotModal__subheading">
                            Придумайте новый пароль для входа в аккаунт
                        </p>

                        <div className="forgotModal__form">
                            <div className="forgotModal__inputGroup">
                                <label
                                    htmlFor="forgotModal-password"
                                    className={error ? 'forgotModal__label--error' : undefined}
                                >
                                    Новый пароль
                                </label>
                                <div className="forgotModal__inputWrap">
                                    <input
                                        id="forgotModal-password"
                                        type="password"
                                        autoComplete="new-password"
                                        value={password}
                                        onChange={handlePasswordChange}
                                        disabled={loading}
                                        className={error ? 'forgotModal__input--error' : undefined}
                                    />
                                </div>
                            </div>

                            <div className="forgotModal__inputGroup">
                                <label
                                    htmlFor="forgotModal-password-confirm"
                                    className={error ? 'forgotModal__label--error' : undefined}
                                >
                                    Повторите пароль
                                </label>
                                <div className="forgotModal__inputWrap">
                                    <input
                                        id="forgotModal-password-confirm"
                                        type="password"
                                        autoComplete="new-password"
                                        value={passwordConfirm}
                                        onChange={handlePasswordConfirmChange}
                                        disabled={loading}
                                        className={error ? 'forgotModal__input--error' : undefined}
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                className="forgotModal__primaryBtn"
                                onClick={handleSavePassword}
                                disabled={loading}
                            >
                                {loading ? 'Сохранение…' : 'Сохранить пароль'}
                            </button>
                        </div>
                    </>
                )}
            </div>

            {messageVisible && messagePayload.type ? (
                <div className={messageSlotClass}>
                    <div
                        className={
                            'forgotModal__inlineMessage forgotModal__inlineMessage--' +
                            messagePayload.type
                        }
                        role={messagePayload.type === 'error' ? 'alert' : 'status'}
                    >
                        {messagePayload.text}
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default ForgotPasswordModal;