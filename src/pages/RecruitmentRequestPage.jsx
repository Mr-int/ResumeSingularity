import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import RecruitmentRequestForm from '../components/recruitment/RecruitmentRequestForm.jsx';
import { getStoredRole, getStoredUserId } from '../services/authApi.js';
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
    belongsToUser,
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
    const role = getStoredRole();
    const isRecruiter = role === 'RECRUITER';
    const isStudent = role === 'STUDENT';
    const userId = getStoredUserId();
    const [request, setRequest] = useState(null);
    const [form, setForm] = useState(null);
    const [responses, setResponses] = useState([]);
    const [specialities, setSpecialities] = useState([]);
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [responsesError, setResponsesError] = useState('');
    const [notice, setNotice] = useState('');
    const [saving, setSaving] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const generation = useRef(0);

    const load = useCallback(async () => {
        const token = generation.current + 1;
        generation.current = token;
        setLoading(true);
        setError('');
        setResponsesError('');

        // Заявка — обязательный запрос, остальные данные не должны ломать страницу.
        const [requestResult, responseResult, specialityResult, cityResult] = await Promise.allSettled([
            getRecruitmentRequest(id),
            listRecruitmentResponses(id, { skipAuthRedirect: true, skipSessionClearOn403: true }),
            getAllSpecialities(),
            listCatalogCities(),
        ]);

        if (generation.current !== token) return;

        if (requestResult.status !== 'fulfilled') {
            setRequest(null);
            setForm(null);
            setResponses([]);
            setError(requestResult.reason?.message || 'Заявка не найдена');
            setLoading(false);
            return;
        }

        const row = requestResult.value;
        setRequest(row);
        setForm(formFromRequest(row));
        setResponses(responseResult.status === 'fulfilled' ? responseResult.value || [] : []);
        setResponsesError(
            responseResult.status === 'rejected'
                ? 'Не удалось загрузить отклики. Обновите страницу, чтобы повторить.'
                : '',
        );
        setSpecialities(specialityResult.status === 'fulfilled' ? specialityResult.value || [] : []);
        setCities(cityResult.status === 'fulfilled' ? cityResult.value || [] : []);
        setLoading(false);
    }, [id]);

    useEffect(() => {
        load();
        return () => {
            generation.current += 1;
        };
    }, [load]);

    const canManage = isRecruiter && belongsToUser(request, userId);
    const archived = request?.status === 'ARCHIVED';
    const open = request?.status === 'OPEN';
    const needed = Number(request?.studentCount) || 0;
    const accepted = responses.filter((row) => row?.status === 'ACCEPTED').length;
    const hasPlaces = accepted < needed;

    const ownResponse = isStudent && responses.length
        ? responses.find((row) => row?.studentId != null && String(row.studentId) === String(userId))
            || (responses.length === 1 && responses[0]?.studentId == null ? responses[0] : null)
        : null;

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
        if (!isStudent || ownResponse || !open) return;
        setSaving(true);
        setNotice('');
        setError('');
        try {
            await respondToRecruitment(id);
            setNotice('Отклик отправлен');
            await load();
        } catch (err) {
            if (err?.status === 409) {
                setNotice('Отклик на эту заявку уже есть — статус обновлён');
                await load();
            } else {
                setError(err.message || 'Не удалось откликнуться');
            }
        } finally {
            setSaving(false);
        }
    }

    async function handleDecision(response, accept) {
        if (!canManage || !open || response?.status !== 'PENDING' || (accept && !hasPlaces)) return;
        setBusyId(response.id);
        setNotice('');
        setError('');
        try {
            if (accept) {
                await acceptRecruitmentResponse(id, response.id);
            } else {
                await rejectRecruitmentResponse(id, response.id);
            }
            setNotice(accept ? 'Отклик принят' : 'Отклик отклонён');
            await load();
        } catch (err) {
            setError(err.message || 'Не удалось обновить отклик');
        } finally {
            setBusyId(null);
        }
    }

    return (
        <div className="catalog">
            <Header />
            <main className="catalog__main">
                <p><Link className="catalog__back" to="/recruitment-requests">К заявкам</Link></p>

                {error ? <p className="catalog__error" role="alert">{error}</p> : null}
                {error ? (
                    <div className="catalog__empty">
                        <button type="button" className="catalog__btn catalog__btn--ghost" onClick={load}>Повторить</button>
                    </div>
                ) : null}
                {notice ? <p className="catalog__ok" role="status">{notice}</p> : null}
                {loading ? <p className="catalog__note" role="status">Загрузка заявки…</p> : null}

                {request ? (
                    <article className="catalog__article">
                        <header className="catalog__head">
                            <div className="catalog__headText">
                                <p className="catalog__eyebrow">{labelOf(REQUEST_STATUS, request.status)}</p>
                                <h1 className="catalog__title">{request.companyName || 'Заявка'}</h1>
                                <p className="catalog__lead">
                                    Нужно {needed} · принято {accepted} · формат: {labelOf(COOPERATION_FORMAT, request.cooperationFormat)}
                                </p>
                            </div>
                            {canManage && !archived ? (
                                <div className="catalog__actions">
                                    {open ? (
                                        <button
                                            type="button"
                                            className="catalog__btn catalog__btn--ghost"
                                            disabled={saving}
                                            onClick={handleClose}
                                        >
                                            Закрыть
                                        </button>
                                    ) : null}
                                    {open || request.status === 'CLOSED' ? (
                                        <button
                                            type="button"
                                            className="catalog__btn catalog__btn--quiet"
                                            disabled={saving}
                                            onClick={handleArchive}
                                        >
                                            В архив
                                        </button>
                                    ) : null}
                                </div>
                            ) : null}
                        </header>

                        <section className="catalog__block">
                            <h2 className="catalog__blockTitle">Условия и требования</h2>
                            <dl className="catalog__facts">
                                <div className="catalog__fact">
                                    <dt className="catalog__factLabel">Формат сотрудничества</dt>
                                    <dd className="catalog__factValue">{labelOf(COOPERATION_FORMAT, request.cooperationFormat)}</dd>
                                </div>
                                <div className="catalog__fact">
                                    <dt className="catalog__factLabel">Нужно студентов</dt>
                                    <dd className="catalog__factValue">{needed || '—'}</dd>
                                </div>
                                <div className="catalog__fact">
                                    <dt className="catalog__factLabel">Принято откликов</dt>
                                    <dd className="catalog__factValue">{accepted}</dd>
                                </div>
                                <div className="catalog__fact">
                                    <dt className="catalog__factLabel">Готовы запросить студентов</dt>
                                    <dd className="catalog__factValue">{readyLabel(request.readyToRequestStudents)}</dd>
                                </div>
                                <div className="catalog__fact">
                                    <dt className="catalog__factLabel">Публикация</dt>
                                    <dd className="catalog__factValue">
                                        {formatWhen(request.publishedFrom)} — {formatWhen(request.publishedTo)}
                                    </dd>
                                </div>
                                <div className="catalog__fact">
                                    <dt className="catalog__factLabel">Города</dt>
                                    <dd className="catalog__factValue">{namesById(request.cityIds, cities)}</dd>
                                </div>
                                <div className="catalog__fact">
                                    <dt className="catalog__factLabel">Специальности</dt>
                                    <dd className="catalog__factValue">{namesById(request.specialityIds, specialities)}</dd>
                                </div>
                            </dl>
                        </section>

                        <section className="catalog__block">
                            <h2 className="catalog__blockTitle">Задачи</h2>
                            <p className="catalog__blockText">{request.tasks || '—'}</p>
                        </section>
                        <section className="catalog__block">
                            <h2 className="catalog__blockTitle">Требования к квалификации</h2>
                            <p className="catalog__blockText">{request.qualificationRequirements || '—'}</p>
                        </section>
                        <section className="catalog__block">
                            <h2 className="catalog__blockTitle">Условия работы</h2>
                            <p className="catalog__blockText">{request.workConditions || '—'}</p>
                        </section>
                        {request.scheduleNote ? (
                            <section className="catalog__block">
                                <h2 className="catalog__blockTitle">Сроки работы</h2>
                                <p className="catalog__blockText">{request.scheduleNote}</p>
                            </section>
                        ) : null}
                        {request.extraInfo ? (
                            <section className="catalog__block">
                                <h2 className="catalog__blockTitle">Прочая информация</h2>
                                <p className="catalog__blockText">{request.extraInfo}</p>
                            </section>
                        ) : null}

                        {isStudent ? (
                            <section className="catalog__block">
                                <h2 className="catalog__blockTitle">Мой отклик</h2>
                                {ownResponse ? (
                                    <p>
                                        <span className={`catalog__status catalog__status--${ownResponse.status || 'PENDING'}`}>
                                            {labelOf(RESPONSE_STATUS, ownResponse.status)}
                                        </span>
                                    </p>
                                ) : (
                                    <>
                                        <p className="catalog__meta">
                                            {open ? 'Откликнитесь, если заявка вам подходит.' : 'Заявка недоступна для отклика.'}
                                        </p>
                                        <div className="catalog__formActions">
                                            <button
                                                type="button"
                                                className="catalog__btn"
                                                disabled={saving || !open}
                                                onClick={handleRespond}
                                            >
                                                {saving ? 'Отправка…' : 'Откликнуться'}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </section>
                        ) : null}

                        {canManage && !archived && form ? (
                            <section className="catalog__block">
                                <h2 className="catalog__blockTitle">Редактирование</h2>
                                <form onSubmit={handleSave}>
                                    <RecruitmentRequestForm
                                        form={form}
                                        onChange={setForm}
                                        specialities={specialities}
                                        cities={cities}
                                        disabled={saving}
                                    />
                                    <div className="catalog__formActions">
                                        <button type="submit" className="catalog__btn" disabled={saving}>
                                            {saving ? 'Сохранение…' : 'Сохранить'}
                                        </button>
                                    </div>
                                </form>
                            </section>
                        ) : null}

                        {canManage ? (
                            <section className="catalog__block">
                                <h2 className="catalog__blockTitle">Отклики · принято {accepted} из {needed || '—'}</h2>
                                {!open ? <p className="catalog__note">Заявка закрыта — новые решения недоступны.</p> : null}
                                {hasPlaces ? null : <p className="catalog__note">Все места заняты.</p>}
                                {responsesError ? <p className="catalog__error" role="alert">{responsesError}</p> : null}
                                {responses.length === 0 && !responsesError ? (
                                    <p className="catalog__meta">Откликов нет.</p>
                                ) : (
                                    <ul className="catalog__responses">
                                        {responses.map((row) => {
                                            const name = [row?.firstName, row?.lastName]
                                                .filter(Boolean)
                                                .join(' ')
                                                .trim() || 'Студент';
                                            const pending = row?.status === 'PENDING';
                                            const acceptDisabled = busyId === row?.id || !open || !pending || !hasPlaces;
                                            const rejectDisabled = busyId === row?.id || !open || !pending;
                                            return (
                                                <li key={row?.id || name} className="catalog__response">
                                                    <div>
                                                        {row?.studentId ? (
                                                            <Link className="catalog__responseName" to={`/profile/${row.studentId}`}>{name}</Link>
                                                        ) : (
                                                            <p className="catalog__personName">{name}</p>
                                                        )}
                                                        <p className="catalog__meta">{row?.speciality || '—'}</p>
                                                    </div>
                                                    <span className={`catalog__status catalog__status--${row?.status || 'PENDING'}`}>
                                                        {labelOf(RESPONSE_STATUS, row?.status)}
                                                    </span>
                                                    <div className="catalog__actions">
                                                        <button
                                                            type="button"
                                                            className="catalog__btn"
                                                            disabled={acceptDisabled}
                                                            title={!hasPlaces ? 'Все места заняты' : undefined}
                                                            onClick={() => handleDecision(row, true)}
                                                        >
                                                            Принять
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="catalog__btn catalog__btn--quiet"
                                                            disabled={rejectDisabled}
                                                            onClick={() => handleDecision(row, false)}
                                                        >
                                                            Отказать
                                                        </button>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </section>
                        ) : null}
                    </article>
                ) : null}
            </main>
        </div>
    );
};

export default RecruitmentRequestPage;
