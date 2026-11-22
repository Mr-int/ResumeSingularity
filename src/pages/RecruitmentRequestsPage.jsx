import { useCallback, useEffect, useState } from 'react';
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
    const isRecruiter = getStoredRole() === 'RECRUITER';
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(0);
    const [result, setResult] = useState(null);
    const [specialities, setSpecialities] = useState([]);
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState(emptyRequestForm);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [pageResult, specialityRows, cityRows] = await Promise.all([
                filterRecruitmentRequests({
                    status: isRecruiter ? status || undefined : undefined,
                    page,
                    size: PAGE_SIZE,
                }),
                getAllSpecialities(),
                listCatalogCities(),
            ]);
            setResult(pageResult);
            setSpecialities(specialityRows || []);
            setCities(cityRows || []);
        } catch (err) {
            setError(err.message || 'Не удалось загрузить заявки');
            setResult(null);
        } finally {
            setLoading(false);
        }
    }, [isRecruiter, page, status]);

    useEffect(() => {
        load();
    }, [load]);

    async function handleCreate(event) {
        event.preventDefault();
        setNotice('');
        setSaving(true);
        try {
            await createRecruitmentRequest(payloadFromForm(form));
            setForm(emptyRequestForm());
            setCreating(false);
            setNotice('Заявка создана');
            if (page === 0 && !status) await load();
            else {
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
                    <div>
                        <p className="catalog__eyebrow">Набор</p>
                        <h1>{isRecruiter ? 'Мои заявки' : 'Заявки'}</h1>
                        <p className="catalog__lead">
                            {isRecruiter
                                ? 'Заявки вашей компании: открытые, закрытые и архив.'
                                : 'Открытые заявки, на которые можно откликнуться.'}
                        </p>
                    </div>
                    {isRecruiter ? (
                        <button type="button" className="catalog__btn catalog__btn--ghost" onClick={() => setCreating((value) => !value)}>
                            {creating ? 'Скрыть форму' : 'Новая заявка'}
                        </button>
                    ) : null}
                </header>

                {notice ? <p className="catalog__ok">{notice}</p> : null}
                {error ? <p className="catalog__error" role="alert">{error}</p> : null}

                {isRecruiter && creating ? (
                    <section className="catalog__block">
                        <h2>Новая заявка</h2>
                        <form onSubmit={handleCreate}>
                            <RecruitmentRequestForm
                                form={form}
                                onChange={setForm}
                                specialities={specialities}
                                cities={cities}
                                disabled={saving}
                            />
                            <button type="submit" className="catalog__btn" disabled={saving} style={{ marginTop: 14 }}>
                                {saving ? 'Создание…' : 'Создать'}
                            </button>
                        </form>
                    </section>
                ) : null}

                {isRecruiter ? (
                    <div className="catalog__filters" style={{ margin: '18px 0' }}>
                        {FILTERS.map((item) => (
                            <button
                                key={item.id || 'all'}
                                type="button"
                                className={`catalog__btn catalog__btn--ghost${status === item.id ? ' is-on' : ''}`}
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

                {loading ? <p className="catalog__note">Загрузка…</p> : null}
                {!loading && !error && rows.length === 0 ? (
                    <p className="catalog__note">Заявок нет.</p>
                ) : null}

                <div className="catalog__list">
                    {rows.map((row) => (
                        <Link key={row.id} className="catalog__row" to={`/recruitment-requests/${row.id}`}>
                            <div>
                                <h2>{row.companyName || 'Компания'}</h2>
                                <p className="catalog__meta">
                                    Нужно {row.studentCount}. {namesById(row.cityIds, cities)}
                                </p>
                                <p className="catalog__meta">{namesById(row.specialityIds, specialities)}</p>
                            </div>
                            <span className={`catalog__status catalog__status--${row.status}`}>
                                {labelOf(REQUEST_STATUS, row.status)}
                            </span>
                            <span className="catalog__meta">Открыть</span>
                        </Link>
                    ))}
                </div>

                {(result?.totalPages || 0) > 1 ? (
                    <div className="catalog__pager">
                        <button type="button" className="catalog__btn catalog__btn--ghost" disabled={page <= 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>
                            Назад
                        </button>
                        <span>Стр. {(result?.page ?? page) + 1} из {result.totalPages} · {result.totalElements}</span>
                        <button type="button" className="catalog__btn catalog__btn--ghost" disabled={page >= result.totalPages - 1} onClick={() => setPage((value) => value + 1)}>
                            Дальше
                        </button>
                    </div>
                ) : null}
            </main>
        </div>
    );
};

export default RecruitmentRequestsPage;
