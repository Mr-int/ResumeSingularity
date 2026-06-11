import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import Footer from '../components/footer/Footer.jsx';
import { listMyApplications, vacancyPageRows, withdrawApplication } from '../services/vacancyApi.js';
import './vacanciesPage.css';

const MyApplications = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const reload = async () => {
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
    };

    useEffect(() => {
        reload();
    }, []);

    return (
        <>
            <Header />
            <main className="vacanciesPage">
                <div className="vacanciesPage__toolbar">
                    <h1 className="vacanciesPage__title">Мои отклики</h1>
                    <Link to="/vacancies" className="vacanciesPage__linkBtn">
                        Каталог
                    </Link>
                </div>

                {loading ? <p className="vacanciesPage__hint">Загрузка…</p> : null}
                {error ? <p className="vacanciesPage__error">{error}</p> : null}

                <ul className="vacanciesPage__list">
                    {items.map((a) => (
                        <li key={a.id} className="vacanciesPage__card vacanciesPage__card--static">
                            <h2>{a.vacancyTitle || 'Вакансия'}</h2>
                            <p className="vacanciesPage__meta">Статус: {a.status}</p>
                            <div className="vacanciesPage__cardActions">
                                {a.vacancyId ? (
                                    <Link to={`/vacancies/${a.vacancyId}`} className="vacanciesPage__linkBtn">
                                        Вакансия
                                    </Link>
                                ) : null}
                                {a.appChatId ? (
                                    <Link to={`/chats?chatId=${a.appChatId}`} className="vacanciesPage__linkBtn">
                                        Чат
                                    </Link>
                                ) : null}
                                {a.status === 'SUBMITTED' ? (
                                    <button
                                        type="button"
                                        className="vacanciesPage__linkBtn"
                                        onClick={async () => {
                                            try {
                                                await withdrawApplication(a.id);
                                                await reload();
                                            } catch (e) {
                                                setError(e.message || 'Не удалось отозвать');
                                            }
                                        }}
                                    >
                                        Отозвать
                                    </button>
                                ) : null}
                            </div>
                        </li>
                    ))}
                </ul>
            </main>
            <Footer />
        </>
    );
};

export default MyApplications;
