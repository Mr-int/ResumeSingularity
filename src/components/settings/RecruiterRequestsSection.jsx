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
