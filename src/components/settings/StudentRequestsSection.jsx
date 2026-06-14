import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { filterMyRequests, postStudentDecision, buildStudentDecisionBody, extractRequestRows, resolveRequestId } from '../../services/requestApi.js';
import { getRecruiterById } from '../../services/getApi.js';
import { formatApiUserMessage, isPendingApprovalError } from '../../utils/apiErrors.js';

const RESULT_LABELS = {
    CREATION: 'Создана',
    SYNC: 'Синхронизация',
    WAITING: 'Ожидание',
    EXPECTATION: 'Ожидает ответа студента',
    STUDENT_CONFIRMED: 'Подтверждена студентом',
    RECRUITER_CONFIRMED: 'Подтверждена работодателем',
    SUCCESS: 'Успешно',
    REFUSAL: 'Отклонена',
};

const canDecide = (result) =>
    result === 'WAITING' || result === 'EXPECTATION' || result === 'CREATION';

const statusClass = (result) => {
    if (result === 'SUCCESS' || result === 'STUDENT_CONFIRMED' || result === 'RECRUITER_CONFIRMED') {
        return 'accountPage__listItemStatus--ok';
    }
    if (result === 'REFUSAL') return '';
    return 'accountPage__listItemStatus--muted';
};

const StudentRequestsSection = ({ studentId }) => {
    const [requests, setRequests] = useState([]);
    const [recruiters, setRecruiters] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pendingNotice, setPendingNotice] = useState('');
    const [busyId, setBusyId] = useState(null);
    const [comments, setComments] = useState({});

    const load = useCallback(async () => {
        if (!studentId) return;
        setLoading(true);
        setError('');
        setPendingNotice('');
        try {
            const res = await filterMyRequests({}, 0, 50);
            const rows = extractRequestRows(res);
            setRequests(rows);
            const recruiterMap = {};
            await Promise.all(
                [...new Set(rows.map((r) => r.recruiterId).filter(Boolean))].map(async (rid) => {
                    try {
                        recruiterMap[rid] = await getRecruiterById(rid);
                    } catch {
                        recruiterMap[rid] = null;
                    }
                }),
            );
            setRecruiters(recruiterMap);
        } catch (e) {
            if (isPendingApprovalError(e)) {
                setPendingNotice(formatApiUserMessage(e));
                setError('');
            } else {
                setError(formatApiUserMessage(e));
            }
            setRequests([]);
        } finally {
            setLoading(false);
        }
    }, [studentId]);

    useEffect(() => {
        load();
    }, [load]);

    const handleDecision = async (requestRow, accepted) => {
        const requestId = resolveRequestId(requestRow);
        if (requestId == null) {
            setError('Не удалось определить номер заявки');
            return;
        }
        setBusyId(requestId);
        setError('');
        try {
            await postStudentDecision(
                requestId,
                buildStudentDecisionBody(accepted, comments[requestId]),
            );
            await load();
        } catch (e) {
            setError(formatApiUserMessage(e));
        } finally {
            setBusyId(null);
        }
    };

    return (
        <section className="accountPage__section">
            <h2 className="accountPage__sectionTitle">Заявки от работодателей</h2>
            {loading && <p className="accountPage__muted">Загрузка…</p>}
            {pendingNotice ? (
                <div className="accountPage__banner" role="status">
                    {pendingNotice}
                </div>
            ) : null}
            {error ? (
                <div className="accountPage__error" role="alert">
                    {error}
                </div>
            ) : null}
            {!loading && requests.length === 0 && (
                <p className="accountPage__text">Пока нет входящих заявок.</p>
            )}
            <ul className="accountPage__listItems">
                {requests.map((req) => {
                    const requestId = resolveRequestId(req);
                    const recruiter = recruiters[req.recruiterId];
                    const recruiterLabel = recruiter
                        ? [recruiter.companyName, recruiter.firstName, recruiter.lastName]
                              .filter(Boolean)
                              .join(' · ')
                        : 'Работодатель';
                    const status = RESULT_LABELS[req.result] || req.result || '—';
                    const showActions = canDecide(req.result) && requestId != null;
                    return (
                        <li key={requestId ?? req.appChatId ?? JSON.stringify(req)}>
                            <div className="accountPage__listItem">
                                <div className="accountPage__listItemMain">
                                    <div className="accountPage__listItemName">{recruiterLabel}</div>
                                    {req.appChatId ? (
                                        <Link
                                            to={`/chats?chatId=${encodeURIComponent(req.appChatId)}`}
                                            className="accountPage__linkChat"
                                        >
                                            Чат
                                        </Link>
                                    ) : null}
                                </div>
                                <span className={`accountPage__listItemStatus ${statusClass(req.result)}`}>
                                    {status}
                                </span>
                            </div>
                            {showActions ? (
                                <div className="accountPage__requestExtra">
                                    <label className="accountPage__formGroup accountPage__fullWidth">
                                        <span>Комментарий (необязательно)</span>
                                        <textarea
                                            rows={2}
                                            value={comments[requestId] || ''}
                                            onChange={(e) =>
                                                setComments((prev) => ({ ...prev, [requestId]: e.target.value }))
                                            }
                                        />
                                    </label>
                                    <div className="accountPage__requestActions">
                                        <button
                                            type="button"
                                            className="accountPage__submit"
                                            disabled={busyId === requestId}
                                            onClick={() => handleDecision(req, true)}
                                        >
                                            Принять
                                        </button>
                                        <button
                                            type="button"
                                            className="accountPage__submit accountPage__submit--secondary"
                                            disabled={busyId === requestId}
                                            onClick={() => handleDecision(req, false)}
                                        >
                                            Отклонить
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
};

export default StudentRequestsSection;
