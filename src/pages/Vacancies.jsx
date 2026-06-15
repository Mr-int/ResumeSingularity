import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import Footer from '../components/footer/Footer.jsx';
import { listVacancies, vacancyPageRows } from '../services/vacancyApi.js';
import { isStudentRole, isRecruiterRole } from '../services/authApi.js';
import { buildVacancyMetaParts } from '../utils/vacancyEnums.js';
import './vacanciesPage.css';

const Vacancies = () => {
    const [items, setItems] = useState([]);
    const [findString, setFindString] = useState('');
    const [city, setCity] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const isStudent = isStudentRole();
    const isRecruiter = isRecruiterRole();

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
                    <div className="vacanciesPage__toolbar">
                        <h1 className="vacanciesPage__title">Вакансии</h1>
                        <div className="vacanciesPage__actions">
                            {isStudent ? (
                                <Link to="/vacancies/applications/mine" className="vacanciesPage__navLink">
                                    Мои отклики
                                </Link>
                            ) : null}
                            {isRecruiter ? (
                                <Link to="/vacancies/mine" className="vacanciesPage__navLink">
                                    Мои вакансии
                                </Link>
                            ) : null}
                        </div>
                    </div>

                    <form
                        className="vacanciesPage__filters"
                        onSubmit={(e) => {
                            e.preventDefault();
                            load();
                        }}
                    >
                        <div className="vacanciesPage__filterGroup">
                            <label htmlFor="vacancy-search">Поиск</label>
                            <input
                                id="vacancy-search"
                                className="vacanciesPage__input"
                                placeholder="Название или описание"
                                value={findString}
                                onChange={(e) => setFindString(e.target.value)}
                            />
                        </div>
                        <div className="vacanciesPage__filterGroup">
                            <label htmlFor="vacancy-city">Город</label>
                            <input
                                id="vacancy-city"
                                className="vacanciesPage__input"
                                placeholder="Не указан"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                            />
                        </div>
                        <div className="vacanciesPage__btnContainer">
                            <button type="submit" className="vacanciesPage__submit">
                                Найти
                            </button>
                        </div>
                    </form>

                    {loading ? <p className="vacanciesPage__hint">Загрузка…</p> : null}
                    {error ? <p className="vacanciesPage__error">{error}</p> : null}

                    {!loading && !error && items.length === 0 ? (
                        <p className="vacanciesPage__hint">Вакансий пока нет</p>
                    ) : null}

                    <ul className="vacanciesPage__list">
                        {items.map((v) => {
                            const metaParts = buildVacancyMetaParts(v);
                            return (
                                <li key={v.id} className="vacanciesPage__item">
                                    <Link to={`/vacancies/${v.id}`} className="vacanciesPage__itemLink">
                                        <div className="vacanciesPage__itemMain">
                                            <h2 className="vacanciesPage__itemName">{v.title}</h2>
                                            {metaParts.length > 0 ? (
                                                <div className="vacanciesPage__itemTags">
                                                    {metaParts.map((part) => (
                                                        <span key={part} className="vacanciesPage__itemTag">
                                                            {part}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : null}
                                            {v.summary ? (
                                                <p className="vacanciesPage__itemSummary">{v.summary}</p>
                                            ) : null}
                                        </div>
                                        <div className="vacanciesPage__itemAside">
                                            {v.hasApplied ? (
                                                <span className="vacanciesPage__itemStatus vacanciesPage__itemStatus--applied">
                                                    Откликнулись
                                                </span>
                                            ) : null}
                                            <span className="vacanciesPage__itemArrow" aria-hidden="true">
                                                →
                                            </span>
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </main>
            <Footer />
        </>
    );
};

export default Vacancies;
