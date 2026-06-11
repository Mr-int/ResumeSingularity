import React, { useRef, useState } from 'react';
import { confirmPhoneVerificationCode } from '../../services/verificationApi.js';

const OTP_LENGTH = 4;

const PhoneOtpConfirm = ({ verificationId, onConfirmed, onError }) => {
    const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
    const [submitting, setSubmitting] = useState(false);
    const inputsRef = useRef([]);

    const submitCode = async (code) => {
        if (!verificationId || code.length !== OTP_LENGTH) return;
        setSubmitting(true);
        try {
            const res = await confirmPhoneVerificationCode(verificationId, code);
            if (res.status === 'CONFIRMED') {
                onConfirmed();
            } else {
                onError?.('Код не принят');
            }
        } catch (err) {
            onError?.(err.message || 'Неверный код');
            setDigits(Array(OTP_LENGTH).fill(''));
            inputsRef.current[0]?.focus();
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (index, raw) => {
        const char = raw.replace(/\D/g, '').slice(-1);
        const next = [...digits];
        next[index] = char;
        setDigits(next);
        if (char && index < OTP_LENGTH - 1) {
            inputsRef.current[index + 1]?.focus();
        }
        if (next.every((d) => d !== '') && next.join('').length === OTP_LENGTH) {
            submitCode(next.join(''));
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    return (
        <div className="loginModal__otpRow" role="group" aria-label="Код подтверждения">
            {digits.map((digit, index) => (
                <input
                    key={index}
                    ref={(el) => {
                        inputsRef.current[index] = el;
                    }}
                    className={`loginModal__otpInput ${digit ? 'loginModal__otpInput--filled' : ''}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    disabled={submitting}
                    aria-label={`Цифра ${index + 1}`}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                />
            ))}
        </div>
    );
};

export default PhoneOtpConfirm;
