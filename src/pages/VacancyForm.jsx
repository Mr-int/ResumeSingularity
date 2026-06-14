import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import Footer from '../components/footer/Footer.jsx';
import { createVacancy, getVacancy, updateVacancy } from '../services/vacancyApi.js';
import './vacanciesPage.css';

const WORK_FORMATS = ['REMOTE', 'OFFICE', 'HYBRID'];
const EMPLOYMENT_TYPES = ['INTERNSHIP', 'PART_TIME', 'FULL_TIME', 'PROJECT'];

const emptyForm = () => ({
    title: '',
    companyName: '',
    city: '',
    description: '',
    workFormat: 'REMOTE',
    employmentType: 'FULL_TIME',
});

const VacancyForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isEdit) return undefined;
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError('');
            try {
                const data = await getVacancy(id);
                if (!cancelled) {
                    setForm({
                        title: data.title || '',
                        companyName: data.companyName || '',
                        city: data.city || '',
                        description: data.description || '',
                        workFormat: data.workFormat || 'REMOTE',
                        employmentType: data.employmentType || 'FULL_TIME',
                    });
                }
            } catch (e) {
                if (!cancelled) setError(e.message || 'Не удалось загрузить вакансию');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [id, isEdit]);

    const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const body = {
                title: form.title.trim(),
                companyName: form.companyName.trim() || undefined,
                city: form.city.trim() || undefined,
                description: form.description.trim() || undefined,
                workFormat: form.workFormat,
                employmentType: form.employmentType,
            };
            if (isEdit) {
                await updateVacancy(id, body);
                navigate(`/vacancies/${id}`);
            } else {
                const created = await createVacancy(body);
                navigate(created?.id ? `/vacancies/${created.id}` : '/vacancies/mine');
            }
        } catch (err) {
            setError(err.message || 'Не удалось сохранить вакансию');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Header />
            <main className="vacanciesPage vacanciesPage--detail">
                <div className="vacanciesPage__inner">
                    <Link to="/vacancies/mine" className="vacanciesPage__back">
                        ← Мои вакансии
                    </Link>
                    <h1 className="vacanciesPage__title">{isEdit ? 'Редактирование вакансии' : 'Новая вакансия'}</h1>
                    {loading ? <p className="vacanciesPage__hint">Загрузка…</p> : null}
                    {error ? <p className="vacanciesPage__error">{error}</p> : null}
                    {!loading ? (
                        <form className="vacanciesPage__applyForm" onSubmit={handleSubmit}>
                            <div className="vacanciesPage__filterGroup">
                                <label htmlFor="vacancy-title">Название</label>
                                <input
                                    id="vacancy-title"
                                    className="vacanciesPage__input"
                                    value={form.title}
                                    onChange={(e) => setField('title', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="vacanciesPage__filterGroup">
                                <label htmlFor="vacancy-company">Компания</label>
                                <input
                                    id="vacancy-company"
                                    className="vacanciesPage__input"
                                    value={form.companyName}
                                    onChange={(e) => setField('companyName', e.target.value)}
                                />
                            </div>
                            <div className="vacanciesPage__filterGroup">
                                <label htmlFor="vacancy-city">Город</label>
                                <input
                                    id="vacancy-city"
                                    className="vacanciesPage__input"
                                    value={form.city}
                                    onChange={(e) => setField('city', e.target.value)}
                                />
                            </div>
                            <div className="vacanciesPage__filterGroup">
                                <label htmlFor="vacancy-work">Формат</label>
                                <select
                                    id="vacancy-work"
                                    className="vacanciesPage__input"
                                    value={form.workFormat}
                                    onChange={(e) => setField('workFormat', e.target.value)}
                                >
                                    {WORK_FORMATS.map((v) => (
                                        <option key={v} value={v}>
                                            {v}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="vacanciesPage__filterGroup">
                                <label htmlFor="vacancy-employment">Занятость</label>
                                <select
                                    id="vacancy-employment"
                                    className="vacanciesPage__input"
                                    value={form.employmentType}
                                    onChange={(e) => setField('employmentType', e.target.value)}
                                >
                                    {EMPLOYMENT_TYPES.map((v) => (
                                        <option key={v} value={v}>
                                            {v}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="vacanciesPage__filterGroup">
                                <label htmlFor="vacancy-description">Описание</label>
                                <textarea
                                    id="vacancy-description"
                                    className="vacanciesPage__textarea"
                                    rows={8}
                                    value={form.description}
                                    onChange={(e) => setField('description', e.target.value)}
                                />
                            </div>
                            <div className="vacanciesPage__btnContainer">
                                <button type="submit" className="vacanciesPage__submit" disabled={saving}>
                                    {saving ? 'Сохранение…' : 'Сохранить'}
                                </button>
                            </div>
                        </form>
                    ) : null}
                </div>
            </main>
            <Footer />
        </>
    );
};

export default VacancyForm;
