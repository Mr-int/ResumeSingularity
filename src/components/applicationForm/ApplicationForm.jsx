import React, { useState } from 'react';
import './applicationForm.css';
import exclamationIcon from "../../assets/icons/exclamationIcon.svg";
import mailIcon from "../../assets/icons/mailIcon.svg";
import sunIcon from "../../assets/other/sun.png";
import cloudMailIcon from "../../assets/other/cloudMail.png";

const ApplicationForm = ({ studentName, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        name: '',
        telegram: '',
        email: '',
        project: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.name.trim()) {
            setError('Пожалуйста, укажите ваше имя');
            return;
        }
        if (!formData.telegram.trim() && !formData.email.trim()) {
            setError('Пожалуйста, укажите телеграмм или почту для связи');
            return;
        }

        setLoading(true);
        try {
            console.log('Application form data:', { ...formData, studentName });
            if (onSubmit) {
                await onSubmit(formData);
            }
            onClose();
        } catch (err) {
            setError('Ошибка при отправке заявки. Попробуйте еще раз.');
            console.error('Application form error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getButtonText = () => {
        if (loading) return 'Отправка...';
        if (studentName) return 'Оставить заявку';
        return 'Связаться';
    };

    const showMailIcon = () => {
        return !loading && !studentName;
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
                        <label htmlFor="project">Компания или проект</label>
                        <input
                            id="project"
                            name="project"
                            type="text"
                            value={formData.project}
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

                    {error && <div className="applicationForm__error">{error}</div>}

                    <div className="applicationForm__button-container">
                        <button type="submit" className="applicationForm__submit" disabled={loading}>
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
                <img src={cloudMailIcon} alt="" className="applicationForm__cloudMailIcon"/>
            </div>
        </div>
    );
};

export default ApplicationForm;