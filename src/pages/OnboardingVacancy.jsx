import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import Footer from '../components/footer/Footer.jsx';
import { createRecruiterFirstVacancy } from '../services/onboardingApi.js';
import {
    getRegistrationSpecialities,
    getRegistrationSkills,
    catalogRows,
} from '../services/registrationCatalogApi.js';
import GuidedHints from '../components/common/GuidedHints.jsx';
import './accountPage.css';

const WORK_FORMATS = [
    { value: 'REMOTE', label: 'Удалённо' },
    { value: 'OFFICE', label: 'Офис' },
    { value: 'HYBRID', label: 'Гибрид' },
];

const EMPLOYMENT_TYPES = [
    { value: 'INTERNSHIP', label: 'Стажировка' },
    { value: 'PART_TIME', label: 'Частичная' },
    { value: 'FULL_TIME', label: 'Полная' },
];

const OnboardingVacancy = () => {
    const navigate = useNavigate();
    const [specialities, setSpecialities] = useState([]);
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        title: '',
        description: '',
        city: '',
        workFormat: 'HYBRID',
        employmentType: 'INTERNSHIP',
        specialityId: '',
        skillIds: [],
        visibleToAnonymous: false,
    });

    useEffect(() => {
        (async () => {
            try {
                const [specRes, skillRes] = await Promise.all([
                    getRegistrationSpecialities(0, 100),
                    getRegistrationSkills(0, 200),
                ]);
                setSpecialities(catalogRows(specRes));
                setSkills(catalogRows(skillRes));
            } catch (e) {
                setError(e.message || 'Не удалось загрузить справочники');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const toggleSkill = (id) => {
        setForm((prev) => ({
            ...prev,
            skillIds: prev.skillIds.includes(id)
                ? prev.skillIds.filter((x) => x !== id)
                : [...prev.skillIds, id],
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            await createRecruiterFirstVacancy({
                title: form.title.trim(),
                description: form.description.trim() || undefined,
                city: form.city.trim() || undefined,
                workFormat: form.workFormat,
                employmentType: form.employmentType,
                specialityId: form.specialityId ? Number(form.specialityId) : undefined,
                skillIds: form.skillIds.length ? form.skillIds : undefined,
                visibleToAnonymous: form.visibleToAnonymous,
            });
            navigate('/vacancies/mine', { replace: true });
        } catch (err) {
            setError(err.message || 'Не удалось создать вакансию');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Header />
            <main className="accountPage">
                <div className="accountPage__inner">
                    <h1 className="accountPage__title">Первая вакансия</h1>
                    <p className="accountPage__lead">
                        Создайте черновик вакансии. После онбординга отправьте её на модерацию в разделе «Мои вакансии».
                    </p>
                    {loading && <p className="accountPage__muted">Загрузка…</p>}
                    {!loading && (
                        <section className="accountPage__card">
                            <GuidedHints formId="vacancy" title="Подсказки по вакансии" />
                            <form className="accountPage__form" onSubmit={handleSubmit}>
                                <label className="accountPage__field">
                                    <span>Название *</span>
                                    <input
                                        value={form.title}
                                        onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                                        required
                                    />
                                </label>
                                <label className="accountPage__field">
                                    <span>Описание</span>
                                    <textarea
                                        rows={5}
                                        value={form.description}
                                        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                                    />
                                </label>
                                <label className="accountPage__field">
                                    <span>Город</span>
                                    <input
                                        value={form.city}
                                        onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                                    />
                                </label>
                                <div className="accountPage__grid2">
                                    <label className="accountPage__field">
                                        <span>Формат работы</span>
                                        <select
                                            value={form.workFormat}
                                            onChange={(e) => setForm((p) => ({ ...p, workFormat: e.target.value }))}
                                        >
                                            {WORK_FORMATS.map((o) => (
                                                <option key={o.value} value={o.value}>
                                                    {o.label}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="accountPage__field">
                                        <span>Тип занятости</span>
                                        <select
                                            value={form.employmentType}
                                            onChange={(e) => setForm((p) => ({ ...p, employmentType: e.target.value }))}
                                        >
                                            {EMPLOYMENT_TYPES.map((o) => (
                                                <option key={o.value} value={o.value}>
                                                    {o.label}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                                <label className="accountPage__field">
                                    <span>Специальность</span>
                                    <select
                                        value={form.specialityId}
                                        onChange={(e) => setForm((p) => ({ ...p, specialityId: e.target.value }))}
                                    >
                                        <option value="">Не указана</option>
                                        {specialities.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name || s.title}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <fieldset className="accountPage__field">
                                    <span>Навыки</span>
                                    <div className="accountPage__skillsChips">
                                        {skills.map((sk) => (
                                            <label key={sk.id} className="accountPage__skillChip">
                                                <input
                                                    type="checkbox"
                                                    checked={form.skillIds.includes(sk.id)}
                                                    onChange={() => toggleSkill(sk.id)}
                                                />
                                                {sk.name || sk.title}
                                            </label>
                                        ))}
                                    </div>
                                </fieldset>
                                <label className="accountPage__field accountPage__field--checkbox">
                                    <input
                                        type="checkbox"
                                        checked={form.visibleToAnonymous}
                                        onChange={(e) =>
                                            setForm((p) => ({ ...p, visibleToAnonymous: e.target.checked }))
                                        }
                                    />
                                    <span>Показывать вакансию без регистрации на сайте</span>
                                </label>
                                {error ? (
                                    <div className="accountPage__error" role="alert">
                                        {error}
                                    </div>
                                ) : null}
                                <button type="submit" className="accountPage__submit" disabled={saving}>
                                    {saving ? 'Создание…' : 'Создать вакансию'}
                                </button>
                            </form>
                        </section>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
};

export default OnboardingVacancy;
