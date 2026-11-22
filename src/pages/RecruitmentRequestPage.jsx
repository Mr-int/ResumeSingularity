import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import RecruitmentRequestForm from '../components/recruitment/RecruitmentRequestForm.jsx';
import { getStoredRole } from '../services/authApi.js';
import { getAllSpecialities } from '../services/studentApi.js';
import {
    acceptRecruitmentResponse,
    archiveRecruitmentRequest,
    closeRecruitmentRequest,
    getRecruitmentRequest,
    listCatalogCities,
    listRecruitmentResponses,
    rejectRecruitmentResponse,
    respondToRecruitment,
    updateRecruitmentRequest,
} from '../services/recruitmentApi.js';
import {
    COOPERATION_FORMAT,
    REQUEST_STATUS,
    RESPONSE_STATUS,
    formFromRequest,
    formatWhen,
    labelOf,
    namesById,
    payloadFromForm,
} from './catalogFormat.js';
import './catalog.css';

const readyLabel = (value) => {
    if (value === true) return 'Да';
    if (value === false) return 'Нет';
    return 'Не указано';
};

const RecruitmentRequestPage = () => {
    const { id } = useParams();
    const isRecruiter = getStoredRole() === 'RECRUITER';
    const [request, setRequest] = useState(null);
    const [form, setForm] = useState(null);
    const [responses, setResponses] = useState([]);
    const [specialities, setSpecialities] = useState([]);
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [saving, setSaving] = useState(false);
    const [busyId, setBusyId] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [row, responseRows, specialityRows, cityRows] = await Promise.all([
                getRecruitmentRequest(id),
                listRecruitmentResponses(id),
                getAllSpecialities(),
                listCatalogCities(),
            ]);
            setRequest(row);
            setForm(formFromRequest(row));
            setResponses(responseRows);
            setSpecialities(specialityRows || []);
            setCities(cityRows || []);
        } catch (err) {
            setError(err.message || 'Заявка не найдена');
            setRequest(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    async function handleSave(event) {
        event.preventDefault();
        setSaving(true);
        setNotice('');
        setError('');
        try {
            const saved = await updateRecruitmentRequest(id, payloadFromForm(form));
            setRequest(saved);
            setForm(formFromRequest(saved));
            setNotice('Заявка сохранена');
        } catch (err) {
            setError(err.message || 'Не удалось сохранить');
        } finally {
            setSaving(false);
        }
    }

    async function handleClose() {
        setSaving(true);
        setNotice('');
        setError('');
        try {
            await closeRecruitmentRequest(id);
            setNotice('Заявка закрыта. Уже принятые отклики остаются.');
            await load();
        } catch (err) {
            setError(err.message || 'Не удалось закрыть заявку');
        } finally {
            setSaving(false);
        }
    }

    async function handleArchive() {
        setSaving(true);
        setNotice('');
        setError('');
        try {
            await archiveRecruitmentRequest(id);
            setNotice('Заявка в архиве');
            await load();
        } catch (err) {
            setError(err.message || 'Не удалось отправить в архив');
        } finally {
            setSaving(false);
        }
    }

    async function handleRespond() {
        setSaving(true);
        setNotice('');
        setError('');
        try {
            const created = await respondToRecruitment(id);
            setResponses([created]);
            setNotice('Отклик отправлен');
        } catch (err) {
            if (err.status === 409) {
                setNotice('Отклик на эту заявку уже есть');
            } else {
                setError(err.message || 'Не удалось откликнуться');
            }
        } finally {
            setSaving(false);
        }
    }

    async function handleDecision(responseId, accept) {
        setBusyId(responseId);
        setNotice('');
        setError('');
        try {
            const updated = accept
                ? await acceptRecruitmentResponse(id, responseId)
                : await rejectRecruitmentResponse(id, responseId);
            setResponses((rows) => rows.map((row) => (row.id === updated.id ? updated : row)));
            setNotice(accept ? 'Отклик принят. Заявка остаётся открытой.' : 'Отклик отклонён');
        } catch (err) {
            setError(err.message || 'Не удалось обновить отклик');
        } finally {
            setBusyId(null);
        }
    }

    const accepted = responses.filter((row) => row.status === 'ACCEPTED').length;
    const ownResponse = !isRecruiter ? responses[0] : null;
    const archived = request?.status === 'ARCHIVED';

    return (
        <div className="catalog">
            <Header />
            <main className="catalog__main">
                <p><Link className="catalog__back" to="/recruitment-requests">К заявкам</Link></p>
                {loading ? <p className="catalog__note">Загрузка…</p> : null}
                {notice ? <p className="catalog__ok">{notice}</p> : null}
                {error ? <p className="catalog__error" role="alert">{error}</p> : null}
                {request ? (
                    <article className="catalog__article">
                        <header className="catalog__head">
                            <div>
                                <p className="catalog__eyebrow">{labelOf(REQUEST_STATUS, request.status)}</p>
                                <h1>{request.companyName || 'Заявка'}</h1>
                                <p className="catalog__lead">
                                    Нужно {request.studentCount}. Принято {accepted}. Формат: {labelOf(COOPERATION_FORMAT, request.cooperationFormat)}. Готовы запросить: {readyLabel(request.readyToRequestStudents)}.
                                </p>
                                <p className="catalog__meta">
                                    Публикация: {formatWhen(request.publishedFrom)} — {formatWhen(request.publishedTo)}
                                </p>
                            </div>
                            {isRecruiter ? (
                                <div className="catalog__actions">
                                    {request.status === 'OPEN' ? (
                                        <button type="button" className="catalog__btn catalog__btn--ghost" disabled={saving} onClick={handleClose}>
                                            Закрыть
                                        </button>
                                    ) : null}
                                    {request.status === 'OPEN' || request.status === 'CLOSED' ? (
                                        <button type="button" className="catalog__btn catalog__btn--quiet" disabled={saving} onClick={handleArchive}>
                                            В архив
                                        </button>
                                    ) : null}
                                </div>
                            ) : null}
                        </header>

                        <section className="catalog__block">
                            <h2>Задачи</h2>
                            <p className="catalog__prose">{request.tasks}</p>
                        </section>
                        <section className="catalog__block">
                            <h2>Требования</h2>
                            <p className="catalog__prose">{request.qualificationRequirements}</p>
                        </section>
                        <section className="catalog__block">
                            <h2>Условия</h2>
                            <p className="catalog__prose">{request.workConditions}</p>
                        </section>
                        <p className="catalog__meta">Города: {namesById(request.cityIds, cities)}</p>
                        <p className="catalog__meta">Специальности: {namesById(request.specialityIds, specialities)}</p>
                        {request.scheduleNote ? <p className="catalog__prose">{request.scheduleNote}</p> : null}
                        {request.extraInfo ? <p className="catalog__prose">{request.extraInfo}</p> : null}

                        {!isRecruiter ? (
                            <div className="catalog__actions">
                                {ownResponse ? (
                                    <span className={`catalog__status catalog__status--${ownResponse.status}`}>
                                        {labelOf(RESPONSE_STATUS, ownResponse.status)}
                                    </span>
                                ) : (
                                    <button type="button" className="catalog__btn" disabled={saving || request.status !== 'OPEN'} onClick={handleRespond}>
                                        Откликнуться
                                    </button>
                                )}
                            </div>
                        ) : null}

                        {isRecruiter && !archived && form ? (
                            <section className="catalog__block">
                                <h2>Правка</h2>
                                <form onSubmit={handleSave}>
                                    <RecruitmentRequestForm
                                        form={form}
                                        onChange={setForm}
                                        specialities={specialities}
                                        cities={cities}
                                        disabled={saving}
                                    />
                                    <button type="submit" className="catalog__btn" disabled={saving} style={{ marginTop: 14 }}>
                                        {saving ? 'Сохранение…' : 'Сохранить'}
                                    </button>
                                </form>
                            </section>
                        ) : null}

                        {isRecruiter ? (
                            <section className="catalog__block">
                                <h2>Отклики · принято {accepted}</h2>
                                {responses.length === 0 ? <p className="catalog__meta">Откликов нет.</p> : null}
                                {responses.map((row) => {
                                    const name = `${row.firstName || ''} ${row.lastName || ''}`.trim() || 'Студент';
                                    return (
                                        <div key={row.id} className="catalog__response">
                                            <div>
                                                {row.studentId ? <Link to={`/profile/${row.studentId}`}>{name}</Link> : name}
                                                <p className="catalog__meta">{row.speciality || '—'}</p>
                                            </div>
                                            <span className={`catalog__status catalog__status--${row.status}`}>
                                                {labelOf(RESPONSE_STATUS, row.status)}
                                            </span>
                                            <div className="catalog__actions">
                                                <button type="button" className="catalog__btn" disabled={busyId === row.id || row.status === 'ACCEPTED'} onClick={() => handleDecision(row.id, true)}>
                                                    Принять
                                                </button>
                                                <button type="button" className="catalog__btn catalog__btn--quiet" disabled={busyId === row.id || row.status === 'REJECTED'} onClick={() => handleDecision(row.id, false)}>
                                                    Отказать
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </section>
                        ) : null}
                    </article>
                ) : null}
            </main>
        </div>
    );
};

export default RecruitmentRequestPage;
