import React, { useState } from 'react';
import StudentProfileMetaFooter from './StudentProfileMetaFooter.jsx';
import { changePassword } from '../../services/authApi.js';
import { validateRegistrationPassword } from '../../utils/passwordPolicy.js';

const StudentAccountSettings = ({
    profile,
    portfolioCount = 0,
    publicProfileConsent,
    onConsentChange,
    consentSaving,
    consentError,
}) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordOk, setPasswordOk] = useState('');

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordOk('');

        const check = validateRegistrationPassword(newPassword);
        if (!check.ok) {
            setPasswordError(check.message);
            return;
        }
        if (newPassword !== newPasswordConfirm) {
            setPasswordError('Новые пароли не совпадают');
            return;
        }

        setPasswordSaving(true);
        try {
            await changePassword(currentPassword, newPassword);
            setCurrentPassword('');
            setNewPassword('');
            setNewPasswordConfirm('');
            setPasswordOk('Пароль успешно изменён');
        } catch (err) {
            setPasswordError(err.message || 'Не удалось сменить пароль');
        } finally {
            setPasswordSaving(false);
        }
    };

    return (
        <section className="accountPage__card accountPage__card--settings">
            <h2 className="accountPage__cardTitle">Настройки аккаунта</h2>

            <StudentProfileMetaFooter
                profile={profile}
                portfolioCount={portfolioCount}
                publicProfileConsent={publicProfileConsent}
                onConsentChange={onConsentChange}
                consentSaving={consentSaving}
                consentError={consentError}
            />

            <form className="accountPage__passwordForm" onSubmit={handlePasswordSubmit}>
                <h3 className="accountPage__subsectionTitle">Смена пароля</h3>
                <p className="accountPage__hint">
                    Укажите текущий пароль и новый — минимум 8 символов, буква и цифра.
                </p>
                <label className="accountPage__field">
                    <span>Текущий пароль</span>
                    <input
                        type="password"
                        autoComplete="current-password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                    />
                </label>
                <div className="accountPage__grid2">
                    <label className="accountPage__field">
                        <span>Новый пароль</span>
                        <input
                            type="password"
                            autoComplete="new-password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </label>
                    <label className="accountPage__field">
                        <span>Повторите новый пароль</span>
                        <input
                            type="password"
                            autoComplete="new-password"
                            value={newPasswordConfirm}
                            onChange={(e) => setNewPasswordConfirm(e.target.value)}
                            required
                        />
                    </label>
                </div>
                {passwordError ? (
                    <div className="accountPage__error" role="alert">
                        {passwordError}
                    </div>
                ) : null}
                {passwordOk ? (
                    <div className="accountPage__ok" role="status">
                        {passwordOk}
                    </div>
                ) : null}
                <button type="submit" className="accountPage__submit" disabled={passwordSaving}>
                    {passwordSaving ? 'Сохранение…' : 'Сменить пароль'}
                </button>
            </form>
        </section>
    );
};

export default StudentAccountSettings;
