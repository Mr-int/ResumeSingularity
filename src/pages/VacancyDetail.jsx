import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import Footer from '../components/footer/Footer.jsx';
import { applyToVacancy, getVacancy } from '../services/vacancyApi.js';
import { isStudentRole } from '../services/authApi.js';
import './vacanciesPage.css';

const VacancyDetail = () => {
    const { id } = useParams();
    const [vacancy, setVacancy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [coverLetter, setCoverLetter] = useState('');
    const [applying, setApplying] = useState(false);
    const isStudent = isStudentRole();

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError('');
            try {
                const data = await getVacancy(id);
                if (!cancelled) setVacancy(data);
            } catch (e) {
                if (!cancelled) setError(e.message || 'Вакансия не найдена');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [id]);

    const handleApply = async (e) => {
        e.preventDefault();
        setApplying(true);
        setError('');
        try {
            await applyToVacancy(id, { coverLetter: coverLetter.trim() || undefined });
            const refreshed = await getVacancy(id);
            setVacancy(refreshed);
        } catch (err) {
            setError(err.message || 'Не удалось откликнуться');
        } finally {
            setApplying(false);
        }
    };

    return (
        <>
            <Header />
            <main className="vacanciesPage vacanciesPage--detail">
                <Link to="/vacancies" className="vacanciesPage__back">
                    ← К списку
                </Link>

                {loading ? <p className="vacanciesPage__hint">Загрузка…</p> : null}
                {error && !vacancy ? <p className="vacanciesPage__error">{error}</p> : null}

                {vacancy ? (
                    <article className="vacanciesPage__detail">
                        <h1>{vacancy.title}</h1>
                        <p className="vacanciesPage__company">{vacancy.companyName}</p>
                        <p className="vacanciesPage__meta">
                            {[vacancy.city, vacancy.workFormat, vacancy.employmentType, vacancy.status]
                                .filter(Boolean)
                                .join(' · ')}
                        </p>
                        {vacancy.description ? (
                            <div className="vacanciesPage__description">{vacancy.description}</div>
                        ) : null}

                        {isStudent && !vacancy.hasApplied ? (
                            <form className="vacanciesPage__applyForm" onSubmit={handleApply}>
                                <label>
                                    Сопроводительное письмо
                                    <textarea
                                        className="vacanciesPage__textarea"
                                        value={coverLetter}
                                        onChange={(e) => setCoverLetter(e.target.value)}
                                        rows={4}
                                    />
                                </label>
                                <button type="submit" className="vacanciesPage__submit" disabled={applying}>
                                    {applying ? 'Отправка…' : 'Откликнуться'}
                                </button>
                            </form>
                        ) : null}

                        {vacancy.hasApplied ? (
                            <p className="vacanciesPage__hint">Вы уже откликнулись на эту вакансию</p>
                        ) : null}

                        {error && vacancy ? <p className="vacanciesPage__error">{error}</p> : null}
                    </article>
                ) : null}
            </main>
            <Footer />
        </>
    );
};

export default VacancyDetail;
