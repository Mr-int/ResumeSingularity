import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { filterRequests } from '../../services/requestApi.js';
import { getStudentById } from '../../services/studentApi.js';

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

const statusClass = (result) => {
    if (result === 'SUCCESS' || result === 'STUDENT_CONFIRMED' || result === 'RECRUITER_CONFIRMED') {
        return 'accountPage__listItemStatus--ok';
    }
    if (result === 'WAITING' || result === 'EXPECTATION' || result === 'CREATION') {
        return '';
    }
    if (result === 'REFUSAL') return '';
    return 'accountPage__listItemStatus--muted';
};

const RecruiterRequestsSection = ({ recruiterId }) => {
    const [requests, setRequests] = useState([]);
    const [students, setStudents] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        if (!recruiterId) return;
        setLoading(true);
        setError('');
        try {
            const res = await filterRequests({ recruiterId }, 0, 50);
            const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res?.content) ? res.content : [];
            setRequests(rows);
            const map = {};
            await Promise.all(
                [...new Set(rows.map((r) => r.studentId).filter(Boolean))].map(async (sid) => {
                    try {
                        map[sid] = await getStudentById(sid);
                    } catch {
                        map[sid] = null;
                    }
                }),
            );
            setStudents(map);
        } catch (e) {
            setError(e.message || 'Не удалось загрузить заявки');
            setRequests([]);
        } finally {
            setLoading(false);
        }
    }, [recruiterId]);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <section className="accountPage__section">
            <h2 className="accountPage__sectionTitle">Мои заявки студентам</h2>
            {loading && <p className="accountPage__muted">Загрузка…</p>}
            {error ? (
                <div className="accountPage__error" role="alert">
                    {error}
                </div>
            ) : null}
            {!loading && requests.length === 0 && (
                <p className="accountPage__text">Заявок пока нет.</p>
            )}
            <ul className="accountPage__listItems">
                {requests.map((req) => {
                    const s = students[req.studentId];
                    const name = s
                        ? `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Студент'
                        : 'Студент';
                    const status = RESULT_LABELS[req.result] || req.result || '—';
                    return (
                        <li key={req.id} className="accountPage__listItem">
                            <div className="accountPage__listItemMain">
                                <div className="accountPage__listItemName">{name}</div>
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
                        </li>
                    );
                })}
            </ul>
        </section>
    );
};

export default RecruiterRequestsSection;
