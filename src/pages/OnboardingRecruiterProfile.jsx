import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import Footer from '../components/footer/Footer.jsx';
import { getRecruiterMe } from '../services/getApi.js';
import { patchRecruiter } from '../services/accountApi.js';
import { setCachedOnboardingStatus } from '../services/onboardingApi.js';
import './accountPage.css';

const OnboardingRecruiterProfile = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [recruiterId, setRecruiterId] = useState(null);
    const [form, setForm] = useState({
        companyName: '',
        firstName: '',
        lastName: '',
        email: '',
        city: '',
    });

    useEffect(() => {
        (async () => {
            try {
                const profile = await getRecruiterMe();
                setRecruiterId(profile.id);
                setForm({
                    companyName: profile.companyName || '',
                    firstName: profile.firstName || '',
                    lastName: profile.lastName || '',
                    email: profile.email || '',
                    city: profile.city || '',
                });
            } catch (e) {
                setError(e.message || 'Не удалось загрузить профиль');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!recruiterId) return;
        setError('');
        setSaving(true);
        try {
            await patchRecruiter(recruiterId, {
                companyName: form.companyName.trim(),
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                email: form.email.trim(),
                city: form.city.trim(),
            });
            setCachedOnboardingStatus('recruiter', true);
            navigate('/students', { replace: true });
        } catch (err) {
            setError(err.message || 'Не удалось сохранить профиль');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Header />
            <main className="accountPage">
                <div className="accountPage__inner">
                    <h1 className="accountPage__title">Профиль работодателя</h1>
                    <p className="accountPage__lead">
                        Укажите данные компании и контакты — они понадобятся для работы с кандидатами.
                    </p>
                    {loading && <p className="accountPage__muted">Загрузка…</p>}
                    {!loading && (
                        <section className="accountPage__card">
                            <form className="accountPage__form" onSubmit={handleSubmit}>
                                <label className="accountPage__field">
                                    <span>Компания *</span>
                                    <input
                                        value={form.companyName}
                                        onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
                                        required
                                    />
                                </label>
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
                                    <span>Город *</span>
                                    <input
                                        value={form.city}
                                        onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                                        required
                                    />
                                </label>
                                {error ? (
                                    <div className="accountPage__error" role="alert">
                                        {error}
                                    </div>
                                ) : null}
                                <button type="submit" className="accountPage__submit" disabled={saving}>
                                    {saving ? 'Сохранение…' : 'Дальше'}
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

export default OnboardingRecruiterProfile;
