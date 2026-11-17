import React, { useState } from 'react';
import './studentRequestsSection.css';

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

const statusTone = (result) => {
    if (result === 'SUCCESS' || result === 'STUDENT_CONFIRMED' || result === 'RECRUITER_CONFIRMED') {
        return 'success';
    }
    if (result === 'REFUSAL') return 'danger';
    if (result === 'WAITING' || result === 'EXPECTATION' || result === 'CREATION') return 'pending';
    return 'muted';
};

const StudentRequestsSection = ({ studentId: _studentId }) => {
    const [requests] = useState([]);
    const [recruiters] = useState({});
    const [loading] = useState(false);
    const [error, setError] = useState('');
    const [busyId, setBusyId] = useState(null);
    const [comments, setComments] = useState({});

    const handleDecision = async (requestId) => {
        setBusyId(requestId);
        setError('Ответ по заявке временно недоступен.');
        setBusyId(null);
    };

    return (
        <section className="studentRequests" aria-labelledby="student-requests-title">
            <div className="studentRequests__header">
                <h2 id="student-requests-title" className="studentRequests__title">
                    <svg className="studentRequests__titleIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                    </svg>
                    Заявки от работодателей
                </h2>
                {!loading && requests.length > 0 ? (
                    <span className="studentRequests__count">{requests.length}</span>
                ) : null}
            </div>

            {loading && <p className="studentRequests__muted">Загрузка…</p>}
            {error ? (
                <div className="studentRequests__error" role="alert">
                    {error}
                </div>
            ) : null}

            {!loading && requests.length === 0 && (
                <div className="studentRequests__empty">
                    <p>Пока нет входящих заявок</p>
                    <span>Когда работодатель откликнется, заявка появится здесь</span>
                </div>
            )}

            <ul className="studentRequests__list">
                {requests.map((req) => {
                    const recruiter = recruiters[req.recruiterId];
                    const company = recruiter?.companyName || '';
                    const person = [recruiter?.firstName, recruiter?.lastName].filter(Boolean).join(' ');
                    const recruiterLabel = company || person || 'Рекрутер';
                    const status = RESULT_LABELS[req.result] || req.result || '—';
                    const tone = statusTone(req.result);
                    const showActions = canDecide(req.result);

                    return (
                        <li key={req.id} className="studentRequests__card">
                            <div className="studentRequests__cardTop">
                                <div className="studentRequests__who">
                                    <strong>{recruiterLabel}</strong>
                                    {company && person ? (
                                        <span className="studentRequests__whoSub">{person}</span>
                                    ) : null}
                                </div>
                                <span className={`studentRequests__status studentRequests__status--${tone}`}>
                                    {status}
                                </span>
                            </div>

                            {req.createdAt ? (
                                <time className="studentRequests__date" dateTime={req.createdAt}>
                                    {new Date(req.createdAt).toLocaleString('ru-RU')}
                                </time>
                            ) : null}

                            {req.studentResponseText ? (
                                <p className="studentRequests__reply">
                                    Ваш ответ: {req.studentResponseText}
                                </p>
                            ) : null}

                            {showActions ? (
                                <div className="studentRequests__decide">
                                    <label className="studentRequests__field">
                                        <span>Комментарий (необязательно)</span>
                                        <textarea
                                            rows={2}
                                            value={comments[req.id] || ''}
                                            onChange={(e) =>
                                                setComments((prev) => ({ ...prev, [req.id]: e.target.value }))
                                            }
                                            placeholder="Короткий ответ работодателю"
                                        />
                                    </label>
                                    <div className="studentRequests__actions">
                                        <button
                                            type="button"
                                            className="studentRequests__btn studentRequests__btn--accept"
                                            disabled={busyId === req.id}
                                            onClick={() => handleDecision(req.id, true)}
                                        >
                                            Принять
                                        </button>
                                        <button
                                            type="button"
                                            className="studentRequests__btn studentRequests__btn--decline"
                                            disabled={busyId === req.id}
                                            onClick={() => handleDecision(req.id, false)}
                                        >
                                            Отклонить
                                        </button>
                                    </div>
                                </div>
                            ) : null}

                            {req.appChatId ? (
                                <span className="studentRequests__chatLink studentRequests__chatLink--wip">
                                    Чат в разработке
                                </span>
                            ) : null}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
};

export default StudentRequestsSection;
