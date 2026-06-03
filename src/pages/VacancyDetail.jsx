import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import Footer from '../components/footer/Footer.jsx';
import { getVacancyById, applyToVacancy } from '../services/vacancyApi.js';
import { getStudentMe } from '../services/getApi.js';
import './vacanciesPage.css';

const STATUS_LABELS = {
    DRAFT: 'Черновик',
    PENDING_REVIEW: 'На модерации',
    PUBLISHED: 'Опубликована',
    REJECTED: 'Отклонена',
    CLOSED: 'Закрыта',
    ARCHIVED: 'В архиве',
};

const VacancyDetail = () => {
    const { id } = useParams();
    const [vacancy, setVacancy] = useState(null);
    const [isStudent, setIsStudent] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [coverLetter, setCoverLetter] = useState('');
    const [applying, setApplying] = useState(false);
    const [ok, setOk] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const v = await getVacancyById(id);
            setVacancy(v);
            try {
                await getStudentMe();
                setIsStudent(true);
            } catch {
                setIsStudent(false);
            }
        } catch (e) {
            setError(e.message || 'Не удалось загрузить вакансию');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    const handleApply = async () => {
        setApplying(true);
        setError('');
        setOk('');
        try {
            await applyToVacancy(id, coverLetter.trim() ? { coverLetter: coverLetter.trim() } : undefined);
            setOk('Отклик отправлен');
            await load();
        } catch (e) {
            setError(e.message || 'Не удалось откликнуться');
        } finally {
            setApplying(false);
        }
    };

    return (
        <>
            <Header />
            <main className="vacanciesPage">
                <div className="vacanciesPage__inner">
                    <nav className="vacanciesPage__nav">
                        <Link to="/vacancies">← К списку вакансий</Link>
                    </nav>

                    {loading && <p className="accountPage__muted">Загрузка…</p>}
                    {error && !vacancy ? (
                        <div className="accountPage__error" role="alert">
                            {error}
                        </div>
                    ) : null}

                    {vacancy && (
                        <>
                            <div className="vacanciesPage__detailBody">
                                <h2>{vacancy.title}</h2>
                                <p>
                                    {[vacancy.companyName, vacancy.city, vacancy.specialityName]
                                        .filter(Boolean)
                                        .join(' · ')}
                                </p>
                                {vacancy.status ? (
                                    <p className="vacanciesPage__badge">
                                        {STATUS_LABELS[vacancy.status] || vacancy.status}
                                    </p>
                                ) : null}
                                {vacancy.description ? <p>{vacancy.description}</p> : null}
                                {vacancy.skills?.length ? (
                                    <p>Навыки: {vacancy.skills.map((s) => s.name).join(', ')}</p>
                                ) : null}
                            </div>

                            {isStudent && vacancy.status === 'PUBLISHED' && !vacancy.hasApplied && (
                                <section className="accountPage__card">
                                    <h3 className="accountPage__cardTitle">Отклик</h3>
                                    <label className="accountPage__field">
                                        <span>Сопроводительное письмо</span>
                                        <textarea
                                            rows={4}
                                            value={coverLetter}
                                            onChange={(e) => setCoverLetter(e.target.value)}
                                        />
                                    </label>
                                    {error ? (
                                        <div className="accountPage__error" role="alert">
                                            {error}
                                        </div>
                                    ) : null}
                                    {ok ? <div className="accountPage__ok">{ok}</div> : null}
                                    <button
                                        type="button"
                                        className="accountPage__submit"
                                        disabled={applying}
                                        onClick={handleApply}
                                    >
                                        {applying ? 'Отправка…' : 'Откликнуться'}
                                    </button>
                                </section>
                            )}

                            {vacancy.hasApplied && (
                                <p className="accountPage__ok">Вы уже откликнулись на эту вакансию.</p>
                            )}
                        </>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
};

export default VacancyDetail;
