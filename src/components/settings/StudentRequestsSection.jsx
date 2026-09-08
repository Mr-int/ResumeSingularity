import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { filterRequests, postStudentDecision } from '../../services/requestApi.js';
import { getRecruiterById } from '../../services/getApi.js';

const RESULT_LABELS = {
    CREATION: 'Создана',
    SYNC: 'Синхронизация',
    WAITING: 'Ожидание',
    EXPECTATION: 'Ожидает ответа студента',
    STUDENT_CONFIRMED: 'Подтверждена студентом',
    RECRUITER_CONFIRMED: 'Подтверждена рекрутером',
    SUCCESS: 'Успешно',
    REFUSAL: 'Отклонена',
};

const canDecide = (result) =>
    result === 'WAITING' || result === 'EXPECTATION' || result === 'CREATION';

const StudentRequestsSection = ({ studentId }) => {
    const [requests, setRequests] = useState([]);
    const [recruiters, setRecruiters] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busyId, setBusyId] = useState(null);
    const [comments, setComments] = useState({});

    const load = useCallback(async () => {
        if (!studentId) return;
        setLoading(true);
        setError('');
        try {
            const res = await filterRequests({ studentId }, 0, 50);
            const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res?.content) ? res.content : [];
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
            setError(e.message || 'Не удалось загрузить заявки');
            setRequests([]);
        } finally {
            setLoading(false);
        }
    }, [studentId]);

    useEffect(() => {
        load();
    }, [load]);

    const handleDecision = async (requestId, accepted) => {
        setBusyId(requestId);
        setError('');
        try {
            await postStudentDecision(requestId, {
                accepted,
                studentResponseText: (comments[requestId] || '').trim() || undefined,
            });
            await load();
        } catch (e) {
            setError(e.message || 'Не удалось отправить ответ');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <section className="accountPage__card">
            <h2 className="accountPage__cardTitle">Заявки от работодателей</h2>
            {loading && <p className="accountPage__muted">Загрузка…</p>}
            {error ? (
                <div className="accountPage__error" role="alert">
                    {error}
                </div>
            ) : null}
            {!loading && requests.length === 0 && (
                <p className="accountPage__text">Пока нет входящих заявок.</p>
            )}
            <ul className="accountPage__requestList">
                {requests.map((req) => {
                    const recruiter = recruiters[req.recruiterId];
                    const recruiterLabel = recruiter
                        ? [recruiter.companyName, recruiter.firstName, recruiter.lastName].filter(Boolean).join(' · ')
                        : 'Рекрутер';
                    const status = RESULT_LABELS[req.result] || req.result || '—';
                    const showActions = canDecide(req.result);
                    return (
                        <li key={req.id} className="accountPage__requestItem">
                            <div className="accountPage__requestHead">
                                <strong>{recruiterLabel}</strong>
                                <span className="accountPage__requestStatus">{status}</span>
                            </div>
                            {req.createdAt ? (
                                <p className="accountPage__hint">
                                    {new Date(req.createdAt).toLocaleString('ru-RU')}
                                </p>
                            ) : null}
                            {req.studentResponseText ? (
                                <p className="accountPage__text">Ваш ответ: {req.studentResponseText}</p>
                            ) : null}
                            {showActions ? (
                                <>
                                    <label className="accountPage__field">
                                        <span>Комментарий (необязательно)</span>
                                        <textarea
                                            rows={2}
                                            value={comments[req.id] || ''}
                                            onChange={(e) =>
                                                setComments((prev) => ({ ...prev, [req.id]: e.target.value }))
                                            }
                                        />
                                    </label>
                                    <div className="accountPage__requestActions">
                                        <button
                                            type="button"
                                            className="accountPage__submit"
                                            disabled={busyId === req.id}
                                            onClick={() => handleDecision(req.id, true)}
                                        >
                                            Принять
                                        </button>
                                        <button
                                            type="button"
                                            className="accountPage__submit accountPage__submit--secondary"
                                            disabled={busyId === req.id}
                                            onClick={() => handleDecision(req.id, false)}
                                        >
                                            Отклонить
                                        </button>
                                    </div>
                                </>
                            ) : null}
                            {req.appChatId ? (
                                <Link
                                    to={`/chats?chatId=${encodeURIComponent(req.appChatId)}`}
                                    className="accountPage__settingsNavLink"
                                >
                                    Открыть чат
                                </Link>
                            ) : null}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
};

export default StudentRequestsSection;
