import React, { useState } from 'react';
import './applicationForm.css';

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

        // Валидация
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
            // Здесь можно добавить отправку данных на сервер
            console.log('Application form data:', { ...formData, studentName });
            if (onSubmit) {
                await onSubmit(formData);
            }
            // Закрываем форму после успешной отправки
            onClose();
        } catch (err) {
            setError('Ошибка при отправке заявки. Попробуйте еще раз.');
            console.error('Application form error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="applicationForm__overlay" onClick={onClose}>
            <div className="applicationForm__content" onClick={(e) => e.stopPropagation()}>
                <button className="applicationForm__close" onClick={onClose}>×</button>
                <h2 className="applicationForm__title">
                    {studentName ? 'Оставить заявку' : 'Связаться с нами'}
                </h2>
                {studentName && (
                    <p className="applicationForm__subtitle">
                        Вы подаете заявку на студента: <strong>{studentName}</strong>
                    </p>
                )}
                <form onSubmit={handleSubmit} className="applicationForm__form">
                    <div className="applicationForm__field">
                        <label htmlFor="name">Ваше имя *</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            placeholder="Введите ваше имя"
                        />
                    </div>
                    <div className="applicationForm__field">
                        <label htmlFor="telegram">Телеграмм</label>
                        <input
                            id="telegram"
                            name="telegram"
                            type="text"
                            value={formData.telegram}
                            onChange={handleChange}
                            disabled={loading}
                            placeholder="@username"
                        />
                    </div>
                    <div className="applicationForm__field">
                        <label htmlFor="email">Почта</label>
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
                        <label htmlFor="project">Проект</label>
                        <textarea
                            id="project"
                            name="project"
                            value={formData.project}
                            onChange={handleChange}
                            disabled={loading}
                            placeholder="Опишите ваш проект или вопрос"
                            rows="4"
                        />
                    </div>
                    {error && <div className="applicationForm__error">{error}</div>}
                    <button type="submit" className="applicationForm__submit" disabled={loading}>
                        {loading ? 'Отправка...' : studentName ? 'Оставить заявку' : 'Связаться'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ApplicationForm;

