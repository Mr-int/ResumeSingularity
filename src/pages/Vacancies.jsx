import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import Footer from '../components/footer/Footer.jsx';
import { listVacancies, vacancyPageRows } from '../services/vacancyApi.js';
import { isStudentRole, isRecruiterRole } from '../services/authApi.js';
import './vacanciesPage.css';

const WORK_LABELS = { REMOTE: 'Удалённо', OFFICE: 'Офис', HYBRID: 'Гибрид' };
const EMP_LABELS = {
    INTERNSHIP: 'Стажировка',
    PART_TIME: 'Частичная',
    FULL_TIME: 'Полная',
    PROJECT: 'Проект',
};

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
                <div className="vacanciesPage__toolbar">
                    <h1 className="vacanciesPage__title">Вакансии</h1>
                    <div className="vacanciesPage__actions">
                        {isStudent ? (
                            <Link to="/vacancies/applications/mine" className="vacanciesPage__linkBtn">
                                Мои отклики
                            </Link>
                        ) : null}
                        {isRecruiter ? (
                            <Link to="/vacancies/mine" className="vacanciesPage__linkBtn">
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
                    <input
                        className="vacanciesPage__input"
                        placeholder="Поиск"
                        value={findString}
                        onChange={(e) => setFindString(e.target.value)}
                    />
                    <input
                        className="vacanciesPage__input"
                        placeholder="Город"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                    />
                    <button type="submit" className="vacanciesPage__submit">
                        Найти
                    </button>
                </form>

                {loading ? <p className="vacanciesPage__hint">Загрузка…</p> : null}
                {error ? <p className="vacanciesPage__error">{error}</p> : null}

                {!loading && !error && items.length === 0 ? (
                    <p className="vacanciesPage__hint">Вакансий пока нет</p>
                ) : null}

                <ul className="vacanciesPage__list">
                    {items.map((v) => (
                        <li key={v.id}>
                            <Link to={`/vacancies/${v.id}`} className="vacanciesPage__card">
                                <div className="vacanciesPage__cardHead">
                                    <h2>{v.title}</h2>
                                    {v.hasApplied ? <span className="vacanciesPage__badge">Откликнулись</span> : null}
                                </div>
                                <p className="vacanciesPage__company">{v.companyName || 'Компания'}</p>
                                <p className="vacanciesPage__meta">
                                    {[v.city, WORK_LABELS[v.workFormat], EMP_LABELS[v.employmentType]]
                                        .filter(Boolean)
                                        .join(' · ')}
                                </p>
                                {v.summary ? <p className="vacanciesPage__summary">{v.summary}</p> : null}
                            </Link>
                        </li>
                    ))}
                </ul>
            </main>
            <Footer />
        </>
    );
};

export default Vacancies;
