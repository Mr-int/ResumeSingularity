import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import Footer from '../components/footer/Footer.jsx';
import { getVacancyById, applyToVacancy } from '../services/vacancyApi.js';
import { getStudentMe } from '../services/getApi.js';
import { isAuthenticated, isStudentRole, isRecruiterRole } from '../services/authApi.js';
import AnonymousApplyCTA from '../components/common/AnonymousApplyCTA.jsx';
import GradientButton from '../components/common/gradientButton/GradientButton.jsx';
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
    const [canApply, setCanApply] = useState(false);
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
            if (isAuthenticated() && isStudentRole()) {
                try {
                    await getStudentMe();
                    setCanApply(true);
                } catch {
                    setCanApply(false);
                }
            } else {
                setCanApply(false);
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
                    <div className="vacanciesPage__panel">
                        <nav className="vacanciesPage__nav">
                            <Link to="/vacancies">← К списку вакансий</Link>
                        </nav>

                        {loading && <p className="vacanciesPage__status">Загрузка…</p>}
                        {error && !vacancy ? (
                            <div className="vacanciesPage__error" role="alert">
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
                                        <span className="vacanciesPage__badge">
                                            {STATUS_LABELS[vacancy.status] || vacancy.status}
                                        </span>
                                    ) : null}
                                    {vacancy.description ? <p>{vacancy.description}</p> : null}
                                    {vacancy.skills?.length ? (
                                        <div className="vacanciesPage__cardTags">
                                            {vacancy.skills.map((s) => (
                                                <span key={s.id || s.name} className="vacanciesPage__tag">
                                                    {s.name}
                                                </span>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>

                                {vacancy.status === 'PUBLISHED' && !vacancy.hasApplied && (
                                    <section className="vacanciesPage__applyCard">
                                        <h3 className="vacanciesPage__applyTitle">Отклик</h3>
                                        {canApply ? (
                                            <>
                                                <label className="vacanciesPage__field">
                                                    <span>Сопроводительное письмо</span>
                                                    <textarea
                                                        rows={4}
                                                        value={coverLetter}
                                                        onChange={(e) => setCoverLetter(e.target.value)}
                                                    />
                                                </label>
                                                {error ? (
                                                    <div className="vacanciesPage__error" role="alert">
                                                        {error}
                                                    </div>
                                                ) : null}
                                                {ok ? <div className="vacanciesPage__ok">{ok}</div> : null}
                                                <GradientButton
                                                    type="button"
                                                    className="vacanciesPage__applyBtn"
                                                    disabled={applying}
                                                    onClick={handleApply}
                                                >
                                                    {applying ? 'Отправка…' : 'Откликнуться'}
                                                </GradientButton>
                                            </>
                                        ) : (
                                            <AnonymousApplyCTA
                                                target="vacancy"
                                                message={
                                                    isRecruiterRole()
                                                        ? 'Рекрутеры не откликаются на вакансии'
                                                        : 'Зарегистрируйтесь, чтобы откликнуться'
                                                }
                                            />
                                        )}
                                    </section>
                                )}

                                {vacancy.hasApplied && (
                                    <p className="vacanciesPage__ok">Вы уже откликнулись на эту вакансию.</p>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
};

export default VacancyDetail;
