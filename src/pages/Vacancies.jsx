import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import Footer from '../components/footer/Footer.jsx';
import { listVacancies, vacancyPageRows } from '../services/vacancyApi.js';
import { isAuthenticated } from '../services/authApi.js';
import './vacanciesPage.css';

const WORK_LABELS = { REMOTE: 'Удалённо', OFFICE: 'Офис', HYBRID: 'Гибрид' };
const EMP_LABELS = {
    INTERNSHIP: 'Стажировка',
    PART_TIME: 'Частичная',
    FULL_TIME: 'Полная',
};

const Vacancies = () => {
    const [items, setItems] = useState([]);
    const [findString, setFindString] = useState('');
    const [city, setCity] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const authed = isAuthenticated();

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await listVacancies(
                {
                    findString: findString.trim() || undefined,
                    city: city.trim() || undefined,
                },
                0,
                50,
            );
            setItems(vacancyPageRows(res));
        } catch (e) {
            setError(e.message || 'Не удалось загрузить вакансии');
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [findString, city]);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <>
            <Header />
            <main className="vacanciesPage">
                <div className="vacanciesPage__inner">
                    <h1 className="vacanciesPage__title">Вакансии</h1>
                    <p className="vacanciesPage__lead">
                        Опубликованные вакансии работодателей.{' '}
                        {authed ? (
                            <>
                                <Link to="/vacancies/applications/mine">Мои отклики</Link>
                                {' · '}
                                <Link to="/vacancies/mine">Мои вакансии</Link>
                            </>
                        ) : (
                            'Войдите, чтобы откликаться.'
                        )}
                    </p>

                    <div className="vacanciesPage__toolbar">
                        <input
                            placeholder="Поиск по названию"
                            value={findString}
                            onChange={(e) => setFindString(e.target.value)}
                        />
                        <input placeholder="Город" value={city} onChange={(e) => setCity(e.target.value)} />
                        <button type="button" className="accountPage__submit" onClick={load}>
                            Найти
                        </button>
                    </div>

                    {loading && <p className="accountPage__muted">Загрузка…</p>}
                    {error ? (
                        <div className="accountPage__error" role="alert">
                            {error}
                        </div>
                    ) : null}

                    {!loading && !error && items.length === 0 && (
                        <p className="accountPage__text">Вакансий пока нет.</p>
                    )}

                    <ul className="vacanciesPage__list">
                        {items.map((v) => (
                            <li key={v.id}>
                                <Link to={`/vacancies/${v.id}`} className="vacanciesPage__card">
                                    <h2 className="vacanciesPage__cardTitle">{v.title}</h2>
                                    <p className="vacanciesPage__cardMeta">
                                        {[v.companyName, v.city, v.specialityName].filter(Boolean).join(' · ')}
                                    </p>
                                    {v.summary ? (
                                        <p className="vacanciesPage__cardMeta">{v.summary}</p>
                                    ) : null}
                                    <p className="vacanciesPage__cardMeta">
                                        {WORK_LABELS[v.workFormat] || v.workFormat}{' '}
                                        {EMP_LABELS[v.employmentType] || v.employmentType}
                                    </p>
                                    {v.hasApplied ? (
                                        <span className="vacanciesPage__badge">Вы откликались</span>
                                    ) : null}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </main>
            <Footer />
        </>
    );
};

export default Vacancies;
