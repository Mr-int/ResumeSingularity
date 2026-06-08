import React from 'react';
import { formatPhoneDisplay, phoneToLocalDigits } from '../../utils/phoneFormat.js';
import '../auth/loginModal.css';

/**
 * Поле телефона в стиле регистрации: флаг +7 и маска ввода.
 * value — нормализованный номер (+7...) или локальные цифры; onChange получает нормализованный +7...
 */
const PhoneNumberField = ({
    value = '',
    onChange,
    disabled = false,
    required = false,
    id,
    className = '',
    inputClassName = 'loginModal__phoneInput',
}) => {
    const localDigits = phoneToLocalDigits(value);

    const handleChange = (e) => {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
        if (!digits) {
            onChange?.('');
            return;
        }
        const normalized = digits.length >= 10 ? `+7${digits}` : `+7${digits}`;
        onChange?.(normalized);
    };

    return (
        <div className={`loginModal__phoneRow ${className}`.trim()}>
            <div className="loginModal__phonePrefix" aria-hidden="true">
                <span className="loginModal__phonePrefixFlag">🇷🇺</span>
                <span>+7</span>
            </div>
            <input
                id={id}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                className={inputClassName}
                placeholder="999 123-45-67"
                value={formatPhoneDisplay(localDigits)}
                onChange={handleChange}
                disabled={disabled}
                required={required}
            />
        </div>
    );
};

export default PhoneNumberField;
