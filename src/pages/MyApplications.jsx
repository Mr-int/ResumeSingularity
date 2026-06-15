import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import Footer from '../components/footer/Footer.jsx';
import { listMyApplications, vacancyPageRows, withdrawApplication } from '../services/vacancyApi.js';
import {
    syncAuthSession,
    canStudentApplyToVacancies,
    isAccountPending,
    getAccountStatus,
} from '../services/authApi.js';
import { formatApiUserMessage, PENDING_APPROVAL_MESSAGE } from '../utils/apiErrors.js';
import { getApplicationStatusLabel } from '../utils/vacancyEnums.js';
import './vacanciesPage.css';

const MyApplications = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const reload = async () => {
        setLoading(true);
        setError('');
        try {
            await syncAuthSession();
            if (!canStudentApplyToVacancies()) {
                setItems([]);
                setError(
                    isAccountPending(getAccountStatus())
                        ? PENDING_APPROVAL_MESSAGE
                        : 'Отклики доступны только студентам с одобренным аккаунтом.',
                );
                return;
            }
            const res = await listMyApplications(0, 50);
            setItems(vacancyPageRows(res));
        } catch (e) {
            setError(formatApiUserMessage(e) || 'Не удалось загрузить отклики');
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
                <div className="vacanciesPage__inner">
                    <div className="vacanciesPage__toolbar">
                        <h1 className="vacanciesPage__title">Мои отклики</h1>
                        <Link to="/vacancies" className="vacanciesPage__navLink">
                            Каталог
                        </Link>
                    </div>

                    {loading ? <p className="vacanciesPage__hint">Загрузка…</p> : null}
                    {error ? <p className="vacanciesPage__error">{error}</p> : null}

                    <ul className="vacanciesPage__list">
                        {items.map((a) => (
                            <li key={a.id} className="vacanciesPage__item">
                                <div className="vacanciesPage__itemRow--static">
                                    <div className="vacanciesPage__itemMain">
                                        <h2 className="vacanciesPage__itemName">{a.vacancyTitle || 'Вакансия'}</h2>
                                        <p className="vacanciesPage__itemMeta">
                                            {a.vacancyId ? (
                                                <Link to={`/vacancies/${a.vacancyId}`} className="vacanciesPage__navLink">
                                                    Открыть вакансию
                                                </Link>
                                            ) : null}
                                            {a.appChatId ? (
                                                <>
                                                    {' · '}
                                                    <Link
                                                        to={`/chats?chatId=${a.appChatId}`}
                                                        className="vacanciesPage__navLink"
                                                    >
                                                        Чат
                                                    </Link>
                                                </>
                                            ) : null}
                                        </p>
                                        {a.status === 'SUBMITTED' ? (
                                            <div className="vacanciesPage__itemActions">
                                                <button
                                                    type="button"
                                                    className="vacanciesPage__linkBtn"
                                                    onClick={async () => {
                                                        try {
                                                            await withdrawApplication(a.id);
                                                            await reload();
                                                        } catch (e) {
                                                            setError(formatApiUserMessage(e) || 'Не удалось отозвать');
                                                        }
                                                    }}
                                                >
                                                    Отозвать
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>
                                    <span
                                        className={`vacanciesPage__itemStatus vacanciesPage__itemStatus--muted${
                                            a.status === 'ACCEPTED' || a.status === 'TU_APPROVED'
                                                ? ' vacanciesPage__itemStatus--ok'
                                                : ''
                                        }`}
                                    >
                                        {getApplicationStatusLabel(a.status)}
                                    </span>
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

export default MyApplications;
