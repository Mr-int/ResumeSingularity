import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import Footer from '../components/footer/Footer.jsx';
import { listMyVacancies, submitVacancyForReview } from '../services/vacancyApi.js';
import './vacanciesPage.css';
import './accountPage.css';

const STATUS_LABELS = {
    DRAFT: 'Черновик',
    PENDING_REVIEW: 'На модерации',
    PUBLISHED: 'Опубликована',
    REJECTED: 'Отклонена',
    CLOSED: 'Закрыта',
    ARCHIVED: 'В архиве',
};

const MyVacancies = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busyId, setBusyId] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const rows = await listMyVacancies();
            setItems(Array.isArray(rows) ? rows : []);
        } catch (e) {
            setError(e.message || 'Не удалось загрузить вакансии');
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const handleSubmit = async (vacancyId) => {
        setBusyId(vacancyId);
        try {
            await submitVacancyForReview(vacancyId);
            await load();
        } catch (e) {
            setError(e.message || 'Не удалось отправить на модерацию');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <>
            <Header />
            <main className="vacanciesPage">
                <div className="vacanciesPage__inner">
                    <h1 className="vacanciesPage__title">Мои вакансии</h1>
                    <nav className="vacanciesPage__nav">
                        <Link to="/vacancies">Лента вакансий</Link>
                        <Link to="/onboarding/vacancy">Создать ещё</Link>
                    </nav>

                    {loading && <p className="accountPage__muted">Загрузка…</p>}
                    {error ? (
                        <div className="accountPage__error" role="alert">
                            {error}
                        </div>
                    ) : null}

                    {!loading && items.length === 0 && (
                        <p className="accountPage__text">У вас пока нет вакансий.</p>
                    )}

                    <ul className="vacanciesPage__list">
                        {items.map((v) => (
                            <li key={v.id} className="accountPage__card">
                                <h2 className="vacanciesPage__cardTitle">
                                    <Link to={`/vacancies/${v.id}`}>{v.title}</Link>
                                </h2>
                                <p className="vacanciesPage__cardMeta">
                                    {STATUS_LABELS[v.status] || v.status}
                                    {v.moderationRejectionReason
                                        ? ` · ${v.moderationRejectionReason}`
                                        : ''}
                                </p>
                                <p className="vacanciesPage__cardMeta">
                                    Откликов: {v.applicationsCount ?? 0}
                                </p>
                                {(v.status === 'DRAFT' || v.status === 'REJECTED') && (
                                    <button
                                        type="button"
                                        className="accountPage__submit"
                                        disabled={busyId === v.id}
                                        onClick={() => handleSubmit(v.id)}
                                    >
                                        {busyId === v.id ? 'Отправка…' : 'На модерацию'}
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </main>
            <Footer />
        </>
    );
};

export default MyVacancies;
