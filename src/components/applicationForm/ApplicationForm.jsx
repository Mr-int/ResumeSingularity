import React, { useState } from 'react';
import './applicationForm.css';
import exclamationIcon from "../../assets/icons/exclamationIcon.svg";
import mailIcon from "../../assets/icons/mailIcon.svg";
import sunIcon from "../../assets/other/sun.png";
import cloudMailIcon from "../../assets/other/cloudMail.png";
import { apiClientJson } from '../../utils/apiClient.js';

const ApplicationForm = ({ studentName, studentId, onClose, onSubmit }) => {
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

        // Валидация
        if (!formData.name.trim()) {
            setError('Пожалуйста, укажите ваше имя');
            return;
        }
        if (!formData.company.trim()) {
            setError('Пожалуйста, укажите компанию или проект');
            return;
        }
        if (!formData.telegram.trim() && !formData.email.trim() && !formData.phone.trim()) {
            setError('Пожалуйста, укажите телеграмм, почту или телефон для связи');
            return;
        }

        setLoading(true);
        try {
            // Подготовка данных для API
            const { firstName, lastName } = splitFullName(formData.name);
            const username = generateUsername();

            const requestData = {
                companyName: formData.company,
                firstName,
                lastName: lastName || firstName,
                username,
                email: formData.email || null,
                phoneNumber: formData.phone || null,
                telegramUsername: formData.telegram || null,
                ...(studentId && { studentId })
            };

            console.log('Sending application data:', requestData);

            // Определяем endpoint в зависимости от типа заявки
            const endpoint = studentId ? 'request/create' : 'recruiter/create';

            // Отправка через apiClientJson
            const response = await apiClientJson(endpoint, {
                method: 'POST',
                body: JSON.stringify(requestData)
            });

            console.log('Application submitted successfully:', response);

            setSuccess(true);

            // Если передан обработчик onSubmit, вызываем его
            if (onSubmit) {
                await onSubmit(requestData);
            }

            // Закрываем форму через 2 секунды после успешной отправки
            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (err) {
            console.error('Application form error:', err);
            if (err.message && err.message.includes('HTTP error! status: 401')) {
                setError('Ошибка авторизации. Пожалуйста, войдите в систему.');
            } else {
                setError(err.message || 'Ошибка при отправке заявки. Попробуйте еще раз.');
            }
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
    );
};

export default ApplicationForm;