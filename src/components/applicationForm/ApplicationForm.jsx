import React, { useState } from 'react';
import './applicationForm.css';
import exclamationIcon from "../../assets/icons/exclamationIcon.svg";
import mailIcon from "../../assets/icons/mailIcon.svg";
import sunIcon from "../../assets/other/sun.png";
import cloudMailIcon from "../../assets/other/cloudMail.png";
import { apiClientJson } from '../../utils/apiClient.js';

const ApplicationForm = ({ studentName, studentId, onClose, onSubmit }) => {
    const hasStudent = Boolean(studentId);
    const [formData, setFormData] = useState({
        name: '',
        company: '',
        email: '',
        telegram: '',
        phone: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [telegramBotLink, setTelegramBotLink] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
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

    const isPhoneValid = (phone) => {
        if (!phone.trim()) return true;
        return /^[\d\s+()-]+$/.test(phone.trim());
    };

    const getFriendlyError = (err) => {
        const body = err?.responseBody;
        const msg = (body?.message || err?.message || '').toLowerCase();
        if (err?.status === 401) return 'Ошибка авторизации. Пожалуйста, войдите в систему.';
        if (err?.status === 403) return 'Доступ запрещён.';
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
        setTelegramBotLink('');

        const emptyName = !formData.name.trim();
        const emptyCompany = !formData.company.trim();
        const emptyContact = !formData.telegram.trim() && !formData.email.trim() && !formData.phone.trim();
        if (emptyName || emptyCompany || emptyContact) {
            setError('Некоторые поля пустые. Заполните все обязательные поля.');
            return;
        }
        if (!isPhoneValid(formData.phone)) {
            setError('Укажите номер телефона в верном формате (только цифры, плюс, скобки или дефис).');
            return;
        }

        if (!hasStudent) {
            setError('Заявка возможна только при выборе студента. Откройте карточку студента и нажмите «Связаться».');
            return;
        }

        setLoading(true);
        try {
            const { firstName, lastName } = splitFullName(formData.name);

            const requestData = {
                companyName: formData.company.trim(),
                firstName: firstName || '',
                lastName: lastName || '',
                email: formData.email?.trim() || '',
                phoneNumber: formData.phone?.trim() || '',
                telegramUsername: formData.telegram?.trim() || '',
                studentId
            };

            const response = await apiClientJson('request', {
                method: 'POST',
                body: JSON.stringify(requestData)
            });

            if (response?.recruiterId) {
                setTelegramBotLink(`https://t.me/singularity_resume_robot?start=re_${response.recruiterId}`);
            }
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

                {success ? (
                    <div className="applicationForm__successWindow">
                        <h2 className="applicationForm__successWindow-title">Заявка оставлена</h2>
                        <p className="applicationForm__successWindow-text">
                            Студент ответит вам в течение 24 часов. Для связи перейдите в телеграм бота.
                        </p>
                        {telegramBotLink && (
                            <a
                                href={telegramBotLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="applicationForm__successWindow-tgLink"
                            >
                                Перейти в Telegram бота
                            </a>
                        )}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="applicationForm__form">
                        <div className="applicationForm__field">
                            <label htmlFor="name">Имя Фамилия</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                placeholder="Иван Иванов"
                            />
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
                            <input
                                id="telegram"
                                name="telegram"
                                type="text"
                                value={formData.telegram}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="@Username"
                            />
                        </div>

                        <div className="applicationForm__field">
                            <label htmlFor="email">Ваша почта</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="example@mail.com"
                            />
                        </div>

                        <div className="applicationForm__field">
                            <label htmlFor="phone">Номер телефона</label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="+7 123 456-78-90"
                            />
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
                )}
                <img src={cloudMailIcon} alt="" className="applicationForm__cloudMailIcon"/>
                </div>
            </div>
        </div>
    );
};

export default ApplicationForm;