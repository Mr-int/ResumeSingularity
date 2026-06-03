import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import Footer from '../components/footer/Footer.jsx';
import { listMyApplications, vacancyPageRows, withdrawApplication } from '../services/vacancyApi.js';
import './vacanciesPage.css';
import './accountPage.css';

const APP_STATUS = {
    PENDING: 'На рассмотрении',
    ACCEPTED: 'Принят',
    REJECTED: 'Отклонён',
    WITHDRAWN: 'Отозван',
};

const MyApplications = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busyId, setBusyId] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await listMyApplications(0, 50);
            setItems(vacancyPageRows(res));
        } catch (e) {
            setError(e.message || 'Не удалось загрузить отклики');
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const handleWithdraw = async (applicationId) => {
        setBusyId(applicationId);
        try {
            await withdrawApplication(applicationId);
            await load();
        } catch (e) {
            setError(e.message || 'Не удалось отозвать отклик');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <>
            <Header />
            <main className="vacanciesPage">
                <div className="vacanciesPage__inner">
                    <h1 className="vacanciesPage__title">Мои отклики</h1>
                    <nav className="vacanciesPage__nav">
                        <Link to="/vacancies">Лента вакансий</Link>
                    </nav>

                    {loading && <p className="accountPage__muted">Загрузка…</p>}
                    {error ? (
                        <div className="accountPage__error" role="alert">
                            {error}
                        </div>
                    ) : null}

                    {!loading && items.length === 0 && (
                        <p className="accountPage__text">Откликов пока нет.</p>
                    )}

                    <ul className="vacanciesPage__list">
                        {items.map((a) => (
                            <li key={a.id} className="accountPage__card">
                                <h2 className="vacanciesPage__cardTitle">
                                    <Link to={`/vacancies/${a.vacancyId}`}>{a.vacancyTitle || 'Вакансия'}</Link>
                                </h2>
                                <p className="vacanciesPage__cardMeta">
                                    {APP_STATUS[a.status] || a.status}
                                    {a.createdAt
                                        ? ` · ${new Date(a.createdAt).toLocaleString('ru-RU')}`
                                        : ''}
                                </p>
                                {a.rejectionReason ? (
                                    <p className="accountPage__text">{a.rejectionReason}</p>
                                ) : null}
                                {a.status === 'PENDING' && (
                                    <button
                                        type="button"
                                        className="accountPage__submit accountPage__submit--secondary"
                                        disabled={busyId === a.id}
                                        onClick={() => handleWithdraw(a.id)}
                                    >
                                        {busyId === a.id ? 'Отзыв…' : 'Отозвать'}
                                    </button>
                                )}
                                {a.appChatId ? (
                                    <p>
                                        <Link
                                            to={`/chats?chatId=${encodeURIComponent(a.appChatId)}`}
                                            className="accountPage__settingsNavLink"
                                        >
                                            Открыть чат
                                        </Link>
                                    </p>
                                ) : null}
                            </li>
                        ))}
                    </ul>
                </div>
            </main>
            <Footer />
        </>
    );
};

export default MyApplications;
