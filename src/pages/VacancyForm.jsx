import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import Footer from '../components/footer/Footer.jsx';
import { createVacancy, updateVacancy } from '../services/vacancyApi.js';
import { isRecruiterRole } from '../services/authApi.js';
import { assertVacancyOwnership } from '../utils/vacancyOwnership.js';
import {
    WORK_FORMAT_OPTIONS,
    EMPLOYMENT_TYPE_OPTIONS,
    WORK_FORMAT_LABELS,
    EMPLOYMENT_TYPE_LABELS,
    extractWorkFormats,
    extractEmploymentTypes,
} from '../utils/vacancyEnums.js';
import './vacanciesPage.css';

const emptyForm = () => ({
    title: '',
    companyName: '',
    city: '',
    description: '',
    workFormats: ['REMOTE'],
    employmentTypes: ['FULL_TIME'],
});

const toggleListValue = (list, value) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

const VacancyForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [accessDenied, setAccessDenied] = useState(false);

    useEffect(() => {
        if (!isRecruiterRole()) {
            navigate('/vacancies', { replace: true });
        }
    }, [navigate]);

    useEffect(() => {
        if (!isEdit) return undefined;
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError('');
            setAccessDenied(false);
            try {
                const { vacancy: data } = await assertVacancyOwnership(id, { forceMineList: true });
                if (!cancelled) {
                    const workFormats = extractWorkFormats(data);
                    const employmentTypes = extractEmploymentTypes(data);
                    setForm({
                        title: data.title || '',
                        companyName: data.companyName || '',
                        city: data.city || '',
                        description: data.description || '',
                        workFormats: workFormats.length ? workFormats : ['REMOTE'],
                        employmentTypes: employmentTypes.length ? employmentTypes : ['FULL_TIME'],
                    });
                }
            } catch (e) {
                if (!cancelled) {
                    if (e.status === 403) {
                        setAccessDenied(true);
                        setError(e.message || 'Нет доступа к этой вакансии');
                    } else {
                        setError(e.message || 'Не удалось загрузить вакансию');
                    }
                }
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
        if (!form.workFormats.length || !form.employmentTypes.length) {
            setError('Выберите хотя бы один формат работы и один тип занятости');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const body = {
                title: form.title.trim(),
                companyName: form.companyName.trim() || undefined,
                city: form.city.trim() || undefined,
                description: form.description.trim() || undefined,
                workFormats: form.workFormats,
                employmentTypes: form.employmentTypes,
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
            {accessDenied ? (
                <p className="vacanciesPage__hint">
                    <Link to="/vacancies" className="vacanciesPage__navLink">
                        Вернуться к каталогу
                    </Link>
                </p>
            ) : null}
            {!loading && !accessDenied ? (
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
                                <span className="vacanciesPage__groupLabel">Формат работы</span>
                                <div className="vacanciesPage__checkboxGroup">
                                    {WORK_FORMAT_OPTIONS.map((value) => (
                                        <label key={value} className="vacanciesPage__checkboxLabel">
                                            <input
                                                type="checkbox"
                                                checked={form.workFormats.includes(value)}
                                                onChange={() =>
                                                    setField(
                                                        'workFormats',
                                                        toggleListValue(form.workFormats, value),
                                                    )
                                                }
                                            />
                                            {WORK_FORMAT_LABELS[value]}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="vacanciesPage__filterGroup">
                                <span className="vacanciesPage__groupLabel">Занятость</span>
                                <div className="vacanciesPage__checkboxGroup">
                                    {EMPLOYMENT_TYPE_OPTIONS.map((value) => (
                                        <label key={value} className="vacanciesPage__checkboxLabel">
                                            <input
                                                type="checkbox"
                                                checked={form.employmentTypes.includes(value)}
                                                onChange={() =>
                                                    setField(
                                                        'employmentTypes',
                                                        toggleListValue(form.employmentTypes, value),
                                                    )
                                                }
                                            />
                                            {EMPLOYMENT_TYPE_LABELS[value]}
                                        </label>
                                    ))}
                                </div>
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
