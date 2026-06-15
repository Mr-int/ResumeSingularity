import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import Footer from '../components/footer/Footer.jsx';
import {
    applyToVacancy,
    acceptApplication,
    rejectApplication,
    getVacancy,
    listVacancyApplications,
    vacancyPageRows,
} from '../services/vacancyApi.js';
import {
    syncAuthSession,
    isStudentRole,
    isRecruiterRole,
    canStudentApplyToVacancies,
    isAccountPending,
    getAccountStatus,
} from '../services/authApi.js';
import { buildVacancyMetaLine, getApplicationStatusLabel } from '../utils/vacancyEnums.js';
import { formatApiUserMessage, PENDING_APPROVAL_MESSAGE } from '../utils/apiErrors.js';
import './vacanciesPage.css';

const VacancyDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [vacancy, setVacancy] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [coverLetter, setCoverLetter] = useState('');
    const [applying, setApplying] = useState(false);
    const [appChatId, setAppChatId] = useState(null);
    const [canApply, setCanApply] = useState(false);
    const isStudent = isStudentRole();
    const isRecruiter = isRecruiterRole();

    const loadVacancy = async () => {
        const data = await getVacancy(id);
        setVacancy(data);
        return data;
    };

    const loadApplications = async () => {
        if (!isRecruiter) return;
        try {
            const res = await listVacancyApplications(id, 0, 50);
            setApplications(vacancyPageRows(res));
        } catch {
            setApplications([]);
        }
    };

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError('');
            try {
                await syncAuthSession();
                if (!cancelled) {
                    setCanApply(canStudentApplyToVacancies());
                }
                await loadVacancy();
                if (!cancelled && isRecruiter) await loadApplications();
            } catch (e) {
                if (!cancelled) setError(formatApiUserMessage(e) || 'Вакансия не найдена');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [id, isRecruiter]);

    const handleApply = async (e) => {
        e.preventDefault();
        setApplying(true);
        setError('');
        try {
            await syncAuthSession();
            if (!canStudentApplyToVacancies()) {
                setError(PENDING_APPROVAL_MESSAGE);
                return;
            }
            const result = await applyToVacancy(id, { coverLetter: coverLetter.trim() || undefined });
            const chatId = result?.appChatId || result?.chatId || null;
            setAppChatId(chatId);
            await loadVacancy();
            if (chatId) {
                navigate(`/chats?chatId=${encodeURIComponent(chatId)}`);
            }
        } catch (err) {
            setError(formatApiUserMessage(err) || 'Не удалось откликнуться');
        } finally {
            setApplying(false);
        }
    };

    const runApplicationAction = async (action) => {
        try {
            await action();
            await loadApplications();
        } catch (e) {
            setError(e.message || 'Не удалось выполнить действие');
        }
    };

    return (
        <>
            <Header />
            <main className="vacanciesPage vacanciesPage--detail">
                <div className="vacanciesPage__inner">
                    <Link to="/vacancies" className="vacanciesPage__back">
                        ← К списку
                    </Link>

                    {loading ? <p className="vacanciesPage__hint">Загрузка…</p> : null}
                    {error && !vacancy ? <p className="vacanciesPage__error">{error}</p> : null}

                    {vacancy ? (
                        <article className="vacanciesPage__detail">
                            <h1>{vacancy.title}</h1>
                            <p className="vacanciesPage__company">{vacancy.companyName}</p>
                            <p className="vacanciesPage__meta">{buildVacancyMetaLine(vacancy, { includeStatus: true })}</p>
                            {vacancy.description ? (
                                <div className="vacanciesPage__description">{vacancy.description}</div>
                            ) : null}

                            {isRecruiter ? (
                                <div className="vacanciesPage__cardActions">
                                    <Link to={`/vacancies/${id}/edit`} className="vacanciesPage__linkBtn">
                                        Редактировать
                                    </Link>
                                </div>
                            ) : null}

                            {isStudent && !vacancy.hasApplied && canApply ? (
                                <form className="vacanciesPage__applyForm" onSubmit={handleApply}>
                                    <div className="vacanciesPage__filterGroup">
                                        <label htmlFor="cover-letter">Сопроводительное письмо</label>
                                        <textarea
                                            id="cover-letter"
                                            className="vacanciesPage__textarea"
                                            value={coverLetter}
                                            onChange={(e) => setCoverLetter(e.target.value)}
                                            rows={4}
                                            placeholder="Кратко о себе и мотивации"
                                        />
                                    </div>
                                    <div className="vacanciesPage__btnContainer">
                                        <button type="submit" className="vacanciesPage__submit" disabled={applying}>
                                            {applying ? 'Отправка…' : 'Откликнуться'}
                                        </button>
                                    </div>
                                </form>
                            ) : null}

                            {isStudent && !vacancy.hasApplied && !canApply ? (
                                <p className="vacanciesPage__hint vacanciesPage__hint--pending">
                                    {isAccountPending(getAccountStatus())
                                        ? PENDING_APPROVAL_MESSAGE
                                        : 'Откликнуться на вакансию могут только студенты с одобренным аккаунтом.'}
                                </p>
                            ) : null}

                            {vacancy.hasApplied ? (
                                <p className="vacanciesPage__hint">
                                    Вы уже откликнулись на эту вакансию.{' '}
                                    <Link to="/vacancies/applications/mine" className="vacanciesPage__navLink">
                                        Мои отклики
                                    </Link>
                                </p>
                            ) : null}

                            {appChatId ? (
                                <p className="vacanciesPage__hint">
                                    <Link to={`/chats?chatId=${encodeURIComponent(appChatId)}`} className="vacanciesPage__navLink">
                                        Перейти в чат с работодателем
                                    </Link>
                                </p>
                            ) : null}

                            {isRecruiter ? (
                                <section className="vacanciesPage__applications">
                                    <h2 className="vacanciesPage__applicationsTitle">Отклики</h2>
                                    {applications.length === 0 ? (
                                        <p className="vacanciesPage__hint">Пока нет откликов</p>
                                    ) : (
                                        applications.map((app) => (
                                            <div key={app.id} className="vacanciesPage__applicationRow">
                                                <div>
                                                    <strong>{app.studentName || 'Студент'}</strong>
                                                    <p className="vacanciesPage__meta">{getApplicationStatusLabel(app.status)}</p>
                                                    {app.coverLetter ? (
                                                        <p className="vacanciesPage__description">{app.coverLetter}</p>
                                                    ) : null}
                                                </div>
                                                <div className="vacanciesPage__applicationActions">
                                                    {app.status === 'SUBMITTED' ? (
                                                        <>
                                                            <button
                                                                type="button"
                                                                className="vacanciesPage__linkBtn"
                                                                onClick={() =>
                                                                    runApplicationAction(() =>
                                                                        acceptApplication(id, app.id),
                                                                    )
                                                                }
                                                            >
                                                                Принять
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="vacanciesPage__linkBtn"
                                                                onClick={() =>
                                                                    runApplicationAction(() =>
                                                                        rejectApplication(id, app.id, {
                                                                            rejectionReason: 'Не подходит',
                                                                        }),
                                                                    )
                                                                }
                                                            >
                                                                Отклонить
                                                            </button>
                                                        </>
                                                    ) : null}
                                                    {app.appChatId ? (
                                                        <Link
                                                            to={`/chats?chatId=${encodeURIComponent(app.appChatId)}`}
                                                            className="vacanciesPage__linkBtn"
                                                        >
                                                            Чат
                                                        </Link>
                                                    ) : null}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </section>
                            ) : null}

                            {error && vacancy ? <p className="vacanciesPage__error">{error}</p> : null}
                        </article>
                    ) : null}
                </div>
            </main>
            <Footer />
        </>
    );
};

export default VacancyDetail;
