import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import Footer from '../components/footer/Footer.jsx';
import {
    closeVacancy,
    deleteVacancy,
    listMyVacancies,
    submitVacancyForReview,
} from '../services/vacancyApi.js';
import { buildVacancyMetaParts, getVacancyStatusLabel } from '../utils/vacancyEnums.js';
import './vacanciesPage.css';

const MyVacancies = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const reload = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await listMyVacancies();
            setItems(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(e.message || 'Не удалось загрузить вакансии');
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        reload();
    }, []);

    const runAction = async (action) => {
        try {
            await action();
            await reload();
        } catch (e) {
            setError(e.message || 'Ошибка операции');
        }
    };

    return (
        <>
            <Header />
            <main className="vacanciesPage">
                <div className="vacanciesPage__inner">
                    <div className="vacanciesPage__toolbar">
                        <h1 className="vacanciesPage__title">Мои вакансии</h1>
                        <div className="vacanciesPage__actions">
                            <Link to="/vacancies/new" className="vacanciesPage__navLink">
                                Создать
                            </Link>
                            <Link to="/vacancies" className="vacanciesPage__navLink">
                                Каталог
                            </Link>
                        </div>
                    </div>

                    {loading ? <p className="vacanciesPage__hint">Загрузка…</p> : null}
                    {error ? <p className="vacanciesPage__error">{error}</p> : null}

                    <ul className="vacanciesPage__list">
                        {items.map((v) => (
                            <li key={v.id} className="vacanciesPage__item vacanciesPage__card--static">
                                <div className="vacanciesPage__cardHead">
                                    <h2>{v.title}</h2>
                                    <span className="vacanciesPage__badge">
                                        {getVacancyStatusLabel(v.status)}
                                    </span>
                                </div>
                                <p className="vacanciesPage__meta">
                                    {buildVacancyMetaParts(v).length > 0 ? (
                                        <span className="vacanciesPage__itemTags">
                                            {buildVacancyMetaParts(v).map((part) => (
                                                <span key={part} className="vacanciesPage__itemTag">
                                                    {part}
                                                </span>
                                            ))}
                                        </span>
                                    ) : (
                                        v.city || '—'
                                    )}
                                </p>
                                <div className="vacanciesPage__cardActions">
                                    <Link to={`/vacancies/${v.id}/edit`} className="vacanciesPage__linkBtn">
                                        Редактировать
                                    </Link>
                                    {v.status === 'DRAFT' || v.status === 'REJECTED' ? (
                                        <button
                                            type="button"
                                            className="vacanciesPage__linkBtn"
                                            onClick={() => runAction(() => submitVacancyForReview(v.id))}
                                        >
                                            На модерацию
                                        </button>
                                    ) : null}
                                    {v.status === 'PUBLISHED' ? (
                                        <button
                                            type="button"
                                            className="vacanciesPage__linkBtn"
                                            onClick={() => runAction(() => closeVacancy(v.id))}
                                        >
                                            Закрыть
                                        </button>
                                    ) : null}
                                    {v.status === 'DRAFT' ? (
                                        <button
                                            type="button"
                                            className="vacanciesPage__linkBtn"
                                            onClick={() => runAction(() => deleteVacancy(v.id))}
                                        >
                                            Удалить
                                        </button>
                                    ) : null}
                                </div>
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
