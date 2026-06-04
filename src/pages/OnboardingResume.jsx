import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import Footer from '../components/footer/Footer.jsx';
import { completeStudentResumeOnboarding } from '../services/onboardingApi.js';
import {
    getRegistrationSpecialities,
    getRegistrationSkills,
    catalogRows,
} from '../services/registrationCatalogApi.js';
import GuidedHints from '../components/common/GuidedHints.jsx';
import './accountPage.css';

const BUSYNESS_OPTIONS = [
    { value: 'FREE', label: 'Свободен' },
    { value: 'FREELANCE', label: 'Фриланс' },
    { value: 'EMPLOYED', label: 'Занят' },
];

const emptyForm = () => ({
    firstName: '',
    lastName: '',
    email: '',
    city: '',
    hhLink: '',
    birthDate: '',
    bio: '',
    busyness: 'FREE',
    phoneNumber: '',
    telegramUsername: '',
    specialityId: '',
    skillsIds: [],
});

const OnboardingResume = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState(emptyForm);
    const [specialities, setSpecialities] = useState([]);
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [ok, setOk] = useState('');

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
        setForm((prev) => {
            const ids = prev.skillsIds.includes(id)
                ? prev.skillsIds.filter((x) => x !== id)
                : [...prev.skillsIds, id];
            return { ...prev, skillsIds: ids };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setOk('');
        if (!form.specialityId) {
            setError('Выберите специальность');
            return;
        }
        setSaving(true);
        try {
            await completeStudentResumeOnboarding({
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                email: form.email.trim(),
                city: form.city.trim() || undefined,
                hhLink: form.hhLink.trim() || undefined,
                birthDate: form.birthDate,
                bio: form.bio.trim() || undefined,
                busyness: form.busyness,
                phoneNumber: form.phoneNumber.trim() || undefined,
                telegramUsername: form.telegramUsername.trim().replace(/^@/, '') || undefined,
                specialityId: Number(form.specialityId),
                skillsIds: form.skillsIds.length ? form.skillsIds : undefined,
            });
            setOk('Резюме сохранено. Профиль появится у рекрутеров после модерации.');
            setTimeout(() => navigate('/settings', { replace: true }), 1200);
        } catch (err) {
            setError(err.message || 'Не удалось сохранить резюме');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Header />
            <main className="accountPage">
                <div className="accountPage__inner">
                    <h1 className="accountPage__title">Заполнение резюме</h1>
                    <p className="accountPage__lead">
                        Обязательные поля отмечены. Курс на сервере будет NEW до модерации администратором.
                    </p>

                    {loading && <p className="accountPage__muted">Загрузка…</p>}

                    {!loading && (
                        <section className="accountPage__card">
                            <GuidedHints formId="resume" title="Подсказки по резюме" />
                            <form className="accountPage__form" onSubmit={handleSubmit}>
                                <div className="accountPage__grid2">
                                    <label className="accountPage__field">
                                        <span>Имя *</span>
                                        <input
                                            value={form.firstName}
                                            onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                                            required
                                        />
                                    </label>
                                    <label className="accountPage__field">
                                        <span>Фамилия *</span>
                                        <input
                                            value={form.lastName}
                                            onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                                            required
                                        />
                                    </label>
                                </div>
                                <label className="accountPage__field">
                                    <span>Email *</span>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                                        required
                                    />
                                </label>
                                <label className="accountPage__field">
                                    <span>Дата рождения *</span>
                                    <input
                                        type="date"
                                        value={form.birthDate}
                                        onChange={(e) => setForm((p) => ({ ...p, birthDate: e.target.value }))}
                                        required
                                    />
                                </label>
                                <div className="accountPage__grid2">
                                    <label className="accountPage__field">
                                        <span>Город</span>
                                        <input
                                            value={form.city}
                                            onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                                        />
                                    </label>
                                    <label className="accountPage__field">
                                        <span>Занятость *</span>
                                        <select
                                            value={form.busyness}
                                            onChange={(e) => setForm((p) => ({ ...p, busyness: e.target.value }))}
                                        >
                                            {BUSYNESS_OPTIONS.map((o) => (
                                                <option key={o.value} value={o.value}>
                                                    {o.label}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                                <label className="accountPage__field">
                                    <span>Специальность *</span>
                                    <select
                                        value={form.specialityId}
                                        onChange={(e) => setForm((p) => ({ ...p, specialityId: e.target.value }))}
                                        required
                                    >
                                        <option value="">Выберите…</option>
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
                                                    checked={form.skillsIds.includes(sk.id)}
                                                    onChange={() => toggleSkill(sk.id)}
                                                />
                                                {sk.name || sk.title}
                                            </label>
                                        ))}
                                    </div>
                                </fieldset>
                                <label className="accountPage__field">
                                    <span>Ссылка HH</span>
                                    <input
                                        value={form.hhLink}
                                        onChange={(e) => setForm((p) => ({ ...p, hhLink: e.target.value }))}
                                    />
                                </label>
                                <label className="accountPage__field">
                                    <span>О себе</span>
                                    <textarea
                                        rows={4}
                                        value={form.bio}
                                        onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                                    />
                                </label>
                                <div className="accountPage__grid2">
                                    <label className="accountPage__field">
                                        <span>Телефон</span>
                                        <input
                                            value={form.phoneNumber}
                                            onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                                        />
                                    </label>
                                    <label className="accountPage__field">
                                        <span>Telegram</span>
                                        <input
                                            value={form.telegramUsername}
                                            onChange={(e) =>
                                                setForm((p) => ({ ...p, telegramUsername: e.target.value }))
                                            }
                                            placeholder="username"
                                        />
                                    </label>
                                </div>
                                {error ? (
                                    <div className="accountPage__error" role="alert">
                                        {error}
                                    </div>
                                ) : null}
                                {ok ? <div className="accountPage__ok">{ok}</div> : null}
                                <button type="submit" className="accountPage__submit" disabled={saving}>
                                    {saving ? 'Сохранение…' : 'Сохранить резюме'}
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

export default OnboardingResume;
