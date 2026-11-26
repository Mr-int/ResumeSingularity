import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import RecruitmentRequestForm from '../components/recruitment/RecruitmentRequestForm.jsx';
import { getStoredRole } from '../services/authApi.js';
import { getAllSpecialities } from '../services/studentApi.js';
import {
    createRecruitmentRequest,
    filterRecruitmentRequests,
    listCatalogCities,
} from '../services/recruitmentApi.js';
import {
    REQUEST_STATUS,
    emptyRequestForm,
    labelOf,
    namesById,
    payloadFromForm,
} from './catalogFormat.js';
import './catalog.css';

const PAGE_SIZE = 20;
const FILTERS = [
    { id: '', label: 'Все' },
    { id: 'OPEN', label: 'Открытые' },
    { id: 'CLOSED', label: 'Закрытые' },
    { id: 'ARCHIVED', label: 'Архив' },
];

const RecruitmentRequestsPage = () => {
    const role = getStoredRole();
    const isRecruiter = role === 'RECRUITER';
    const isStudent = role === 'STUDENT';
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(0);
    const [result, setResult] = useState(null);
    const [specialities, setSpecialities] = useState([]);
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [dictionaryWarning, setDictionaryWarning] = useState('');
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState(emptyRequestForm);
    const [saving, setSaving] = useState(false);
    const generation = useRef(0);

    const load = useCallback(async () => {
        const token = generation.current + 1;
        generation.current = token;
        setLoading(true);
        setError('');

        // Справочники необязательны: их недоступность не должна ломать список.
        const [pageResult, specialityResult, cityResult] = await Promise.allSettled([
            filterRecruitmentRequests({
                status: isRecruiter ? status || undefined : 'OPEN',
                page,
                size: PAGE_SIZE,
            }),
            getAllSpecialities(),
            listCatalogCities(),
        ]);

        if (generation.current !== token) return;

        if (pageResult.status === 'fulfilled') {
            setResult(pageResult.value);
        } else {
            setResult(null);
            setError(pageResult.reason?.message || 'Не удалось загрузить заявки');
        }

        setSpecialities(specialityResult.status === 'fulfilled' ? specialityResult.value || [] : []);
        setCities(cityResult.status === 'fulfilled' ? cityResult.value || [] : []);
        setDictionaryWarning(
            specialityResult.status === 'rejected' || cityResult.status === 'rejected'
                ? 'Справочники специальностей и городов временно недоступны — часть полей формы может быть пустой.'
                : '',
        );
        setLoading(false);
    }, [isRecruiter, page, status]);

    useEffect(() => {
        load();
        return () => {
            generation.current += 1;
        };
    }, [load]);

    async function handleCreate(event) {
        event.preventDefault();
        setNotice('');
        setError('');
        setSaving(true);
        try {
            await createRecruitmentRequest(payloadFromForm(form));
            setForm(emptyRequestForm());
            setCreating(false);
            setNotice('Заявка создана');
            if (page === 0 && (!isRecruiter || !status)) {
                await load();
            } else {
                setPage(0);
                setStatus('');
            }
        } catch (err) {
            setError(err.message || 'Не удалось создать заявку');
        } finally {
            setSaving(false);
        }
    }

    const rows = result?.data || [];

    return (
        <div className="catalog">
            <Header />
            <main className="catalog__main">
                <header className="catalog__head">
                    <div className="catalog__headText">
                        <p className="catalog__eyebrow">Набор</p>
                        <h1 className="catalog__title">{isRecruiter ? 'Мои заявки' : 'Заявки'}</h1>
                        <p className="catalog__lead">
                            {isRecruiter
                                ? 'Заявки вашей компании: открытые, закрытые и архив.'
                                : isStudent
                                    ? 'Открытые заявки, на которые можно откликнуться.'
                                    : 'Открытые заявки.'}
                        </p>
                    </div>
                    {isRecruiter ? (
                        <button
                            type="button"
                            className="catalog__btn catalog__btn--ghost"
                            aria-expanded={creating}
                            onClick={() => setCreating((value) => !value)}
                        >
                            {creating ? 'Скрыть форму' : 'Новая заявка'}
                        </button>
                    ) : null}
                </header>

                {notice ? <p className="catalog__ok" role="status">{notice}</p> : null}
                {error ? <p className="catalog__error" role="alert">{error}</p> : null}

                {isRecruiter && creating ? (
                    <section className="catalog__block">
                        <h2 className="catalog__blockTitle">Новая заявка</h2>
                        {dictionaryWarning ? <p className="catalog__note">{dictionaryWarning}</p> : null}
                        <form onSubmit={handleCreate}>
                            <RecruitmentRequestForm
                                form={form}
                                onChange={setForm}
                                specialities={specialities}
                                cities={cities}
                                disabled={saving}
                            />
                            <div className="catalog__formActions">
                                <button type="submit" className="catalog__btn" disabled={saving}>
                                    {saving ? 'Создание…' : 'Создать'}
                                </button>
                            </div>
                        </form>
                    </section>
                ) : null}

                {isRecruiter ? (
                    <div className="catalog__filters catalog__filtersBlock" role="group" aria-label="Фильтр по статусу">
                        {FILTERS.map((item) => (
                            <button
                                key={item.id || 'all'}
                                type="button"
                                className={`catalog__btn catalog__btn--ghost${status === item.id ? ' is-on' : ''}`}
                                aria-pressed={status === item.id}
                                onClick={() => {
                                    setStatus(item.id);
                                    setPage(0);
                                }}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                ) : null}

                {loading ? <p className="catalog__note" role="status">Загрузка заявок…</p> : null}

                {!loading && error ? (
                    <div className="catalog__empty">
                        <button type="button" className="catalog__btn catalog__btn--ghost" onClick={load}>Повторить</button>
                    </div>
                ) : null}

                {!loading && !error && rows.length === 0 ? (
                    <div className="catalog__empty">
                        <p>Заявок нет.</p>
                        <button type="button" className="catalog__btn catalog__btn--ghost" onClick={load}>Обновить</button>
                    </div>
                ) : null}

                <div className="catalog__list">
                    {rows.map((row) => (
                        <Link key={row.id} className="catalog__row" to={`/recruitment-requests/${row.id}`}>
                            <div className="catalog__rowMain">
                                <h2 className="catalog__rowTitle">{row.companyName || 'Компания не указана'}</h2>
                                <p className="catalog__meta">Нужно студентов: {row.studentCount ?? '—'}</p>
                                <p className="catalog__meta">Города: {namesById(row.cityIds, cities)}</p>
                                <p className="catalog__meta">Специальности: {namesById(row.specialityIds, specialities)}</p>
                            </div>
                            <span className={`catalog__status catalog__status--${row.status || 'PENDING'}`}>
                                {labelOf(REQUEST_STATUS, row.status)}
                            </span>
                            <span className="catalog__more">Открыть →</span>
                        </Link>
                    ))}
                </div>

                {(result?.totalPages || 0) > 1 ? (
                    <div className="catalog__pager">
                        <button
                            type="button"
                            className="catalog__btn catalog__btn--ghost"
                            disabled={page <= 0}
                            onClick={() => setPage((value) => Math.max(0, value - 1))}
                        >
                            Назад
                        </button>
                        <span>Стр. {(result?.page ?? page) + 1} из {result.totalPages} · {result.totalElements}</span>
                        <button
                            type="button"
                            className="catalog__btn catalog__btn--ghost"
                            disabled={page >= result.totalPages - 1}
                            onClick={() => setPage((value) => value + 1)}
                        >
                            Дальше
                        </button>
                    </div>
                ) : null}
            </main>
        </div>
    );
};

export default RecruitmentRequestsPage;
