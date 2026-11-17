import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const RESULT_LABELS = {
    CREATION: 'Создана',
    SYNC: 'Синхронизация',
    WAITING: 'Ожидание',
    EXPECTATION: 'Ожидает ответа',
    STUDENT_CONFIRMED: 'Подтверждена студентом',
    RECRUITER_CONFIRMED: 'Подтверждена рекрутером',
    SUCCESS: 'Успешно',
    REFUSAL: 'Отклонена',
};

const RecruiterRequestsSection = ({ recruiterId: _recruiterId }) => {
    const [requests] = useState([]);
    const [students] = useState({});
    const [loading] = useState(false);
    const [error] = useState('');

    return (
        <section className="accountPage__card">
            <h2 className="accountPage__cardTitle">Мои заявки студентам</h2>
            {loading && <p className="accountPage__muted">Загрузка…</p>}
            {error ? (
                <div className="accountPage__error" role="alert">
                    {error}
                </div>
            ) : null}
            {!loading && requests.length === 0 && (
                <p className="accountPage__text">Заявок пока нет.</p>
            )}
            <ul className="accountPage__requestList">
                {requests.map((req) => {
                    const s = students[req.studentId];
                    const name = s
                        ? `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Студент'
                        : 'Студент';
                    return (
                        <li key={req.id} className="accountPage__requestItem">
                            <div className="accountPage__requestHead">
                                <strong>{name}</strong>
                                <span className="accountPage__requestStatus">
                                    {RESULT_LABELS[req.result] || req.result || '—'}
                                </span>
                            </div>
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

export default RecruiterRequestsSection;
