import React, { useState } from 'react';
import './applicationForm.css';
import exclamationIcon from "../../assets/icons/exclamationIcon.svg";
import mailIcon from "../../assets/icons/mailIcon.svg";
import sunIcon from "../../assets/other/sun.png";
import cloudMailIcon from "../../assets/other/cloudMail.png";

const ApplicationForm = ({ studentName, studentId, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        companyName: '',
        email: '',
        phoneNumber: '',
        telegramUsername: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

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

    const generateUsername = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 20; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (!formData.firstName.trim()) {
            setError('Пожалуйста, укажите ваше имя и фамилию');
            return;
        }
        if (!formData.companyName.trim()) {
            setError('Пожалуйста, укажите компанию или проект');
            return;
        }
        if (!formData.telegramUsername.trim() && !formData.email.trim() && !formData.phoneNumber.trim()) {
            setError('Пожалуйста, укажите хотя бы один способ связи: телеграм, почту или телефон');
            return;
        }

        setLoading(true);
        try {
            const { firstName, lastName } = splitFullName(formData.firstName);
            const username = generateUsername();

            const requestData = {
                companyName: formData.companyName,
                firstName,
                lastName: lastName || firstName,
                username,
                email: formData.email || null,
                phoneNumber: formData.phoneNumber || null,
                telegramUsername: formData.telegramUsername || null,
                ...(studentId && { studentId })
            };

            console.log('Sending request data:', requestData);

            const endpoint = studentId ? '/request' : '/recruiter/create';

            // Если у вас есть переменная окружения с URL API
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
            const url = `${API_BASE_URL}${endpoint}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const responseData = await response.json();
            console.log('Response:', responseData);

            setSuccess(true);

            if (onSubmit) {
                await onSubmit(responseData);
            }

            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (err) {
            console.error('Application form error:', err);
            setError(err.message || 'Ошибка при отправке заявки. Попробуйте еще раз.');
        } finally {
            setLoading(false);
        }
    };

    const getButtonText = () => {
        if (loading) return 'Отправка...';
        if (success) return 'Заявка отправлена!';
        if (studentName) return 'Оставить заявку';
        return 'Связаться';
    };

    const showMailIcon = () => {
        return !loading && !studentName && !success;
    };

    return (
        <div className="applicationForm__overlay" onClick={onClose}>
            <div className="applicationForm__content" onClick={(e) => e.stopPropagation()}>
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

                {studentName && (
                    <p className="applicationForm__subtitle">
                        Вы подаете заявку на студента: <strong>{studentName}</strong>
                    </p>
                )}

                {success ? (
                    <div className="applicationForm__success">
                        <h3>✅ Заявка успешно отправлена!</h3>
                        <p>Мы свяжемся с вами в течение 24 часов.</p>
                        <p>Форма закроется автоматически...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="applicationForm__form">
                        <div className="applicationForm__field">
                            <label htmlFor="firstName">Имя Фамилия *</label>
                            <input
                                id="firstName"
                                name="firstName"
                                type="text"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                placeholder="Иван Иванов"
                            />
                        </div>

                        <div className="applicationForm__field">
                            <label htmlFor="companyName">Компания или проект *</label>
                            <input
                                id="companyName"
                                name="companyName"
                                type="text"
                                value={formData.companyName}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                placeholder='ООО "Компания"'
                            />
                        </div>

                        <div className="applicationForm__field">
                            <label htmlFor="telegramUsername">Телеграм для связи</label>
                            <input
                                id="telegramUsername"
                                name="telegramUsername"
                                type="text"
                                value={formData.telegramUsername}
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
                            <label htmlFor="phoneNumber">Номер телефона</label>
                            <input
                                id="phoneNumber"
                                name="phoneNumber"
                                type="tel"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="+7 123 456-78-90"
                            />
                        </div>

                        <div className="applicationForm__note">
                            * Обязательные поля
                        </div>

                        {error && <div className="applicationForm__error">{error}</div>}

                        <div className="applicationForm__button-container">
                            <button
                                type="submit"
                                className={`applicationForm__submit ${success ? 'applicationForm__submit--success' : ''}`}
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
    );
};

export default ApplicationForm;