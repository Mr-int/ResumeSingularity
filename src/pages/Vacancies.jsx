import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import Footer from '../components/footer/Footer.jsx';
import GradientButton from '../components/common/gradientButton/GradientButton.jsx';
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
                    <div className="vacanciesPage__panel">
                        <h1 className="vacanciesPage__title">
                            <span className="vacanciesPage__titleAccent">Вакансии</span>
                        </h1>
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
                                type="search"
                                placeholder="Поиск по названию"
                                value={findString}
                                onChange={(e) => setFindString(e.target.value)}
                                aria-label="Поиск по названию"
                            />
                            <input
                                type="text"
                                placeholder="Город"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                aria-label="Город"
                            />
                            <GradientButton
                                type="button"
                                className="vacanciesPage__searchBtn"
                                onClick={load}
                            >
                                Найти
                            </GradientButton>
                        </div>

                        {loading && <p className="vacanciesPage__status">Загрузка…</p>}
                        {error ? (
                            <div className="vacanciesPage__error" role="alert">
                                {error}
                            </div>
                        ) : null}

                        {!loading && !error && items.length === 0 && (
                            <p className="vacanciesPage__empty">Вакансий пока нет.</p>
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
                                        <div className="vacanciesPage__cardTags">
                                            {v.workFormat ? (
                                                <span className="vacanciesPage__tag">
                                                    {WORK_LABELS[v.workFormat] || v.workFormat}
                                                </span>
                                            ) : null}
                                            {v.employmentType ? (
                                                <span className="vacanciesPage__tag">
                                                    {EMP_LABELS[v.employmentType] || v.employmentType}
                                                </span>
                                            ) : null}
                                        </div>
                                        {v.hasApplied ? (
                                            <span className="vacanciesPage__badge">Вы откликались</span>
                                        ) : null}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
};

export default Vacancies;
