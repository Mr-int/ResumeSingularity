import React, { useCallback, useEffect, useState } from 'react';
import Header from '../components/header/Header.jsx';
import Footer from '../components/footer/Footer.jsx';
import { getStudentMe, getRecruiterMe } from '../services/getApi.js';
import { patchStudent, patchRecruiter, uploadStudentPhoto } from '../services/accountApi.js';
import { getImageUrl } from '../config/api.js';
import './accountPage.css';

const COURSE_OPTIONS = ['NEW', 'FIRST', 'SECOND', 'THIRD', 'FOURTH'];
const BUSYNESS_OPTIONS = ['FREE', 'FREELANCE', 'EMPLOYED'];

const parseSkillsIds = (raw) =>
    String(raw ?? '')
        .split(/[\s,;]+/)
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n) && n > 0);

const normalizePhone = (raw) => {
    const digits = String(raw ?? '').replace(/\D/g, '');
    if (!digits) return '';
    const trimmed = String(raw ?? '').trim();
    if (trimmed.startsWith('+')) return `+${digits}`;
    return digits;
};

const emptyStudentForm = () => ({
    firstName: '',
    lastName: '',
    city: '',
    bio: '',
    hhLink: '',
    birthDate: '',
    course: 'FIRST',
    busyness: 'FREE',
    email: '',
    phoneNumber: '',
    telegramUsername: '',
    specialityId: '',
    skillsIds: '',
});

const studentToForm = (s) => ({
    firstName: s.firstName || '',
    lastName: s.lastName || '',
    city: s.city || '',
    bio: s.bio || '',
    hhLink: s.hhLink || '',
    birthDate: s.birthDate || '',
    course: s.course || 'FIRST',
    busyness: s.busyness || 'FREE',
    email: s.email || '',
    phoneNumber: s.phoneNumber || '',
    telegramUsername: s.telegramUsername || '',
    specialityId: s.specialityId != null ? String(s.specialityId) : '',
    skillsIds: Array.isArray(s.skills) ? s.skills.map((sk) => sk.id).filter(Boolean).join(', ') : '',
});

const emptyRecruiterForm = () => ({
    companyName: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    telegramUsername: '',
});

const recruiterToForm = (r) => ({
    companyName: r.companyName || '',
    firstName: r.firstName || '',
    lastName: r.lastName || '',
    email: r.email || '',
    phoneNumber: r.phoneNumber || '',
    telegramUsername: r.telegramUsername || '',
});

const AccountPage = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [role, setRole] = useState(null);
    const [profile, setProfile] = useState(null);
    const [studentForm, setStudentForm] = useState(emptyStudentForm());
    const [recruiterForm, setRecruiterForm] = useState(emptyRecruiterForm());
    const [saveOk, setSaveOk] = useState('');
    const [saving, setSaving] = useState(false);
    const [photoBusy, setPhotoBusy] = useState(false);

    const loadProfile = useCallback(async () => {
        setLoading(true);
        setError('');
        setSaveOk('');
        try {
            try {
                const s = await getStudentMe();
                setRole('student');
                setProfile(s);
                setStudentForm(studentToForm(s));
                return;
            } catch (e) {
                if (e.status !== 404 && e.status !== 403) throw e;
            }
            try {
                const r = await getRecruiterMe();
                setRole('recruiter');
                setProfile(r);
                setRecruiterForm(recruiterToForm(r));
            } catch (e2) {
                if (e2.status === 404) {
                    setRole('recruiter_pending');
                    setProfile(null);
                    setError('');
                    return;
                }
                throw e2;
            }
        } catch (err) {
            setRole(null);
            setProfile(null);
            setError(err.message || 'Не удалось загрузить профиль');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const handleStudentChange = (e) => {
        const { name, value } = e.target;
        setStudentForm((prev) => ({ ...prev, [name]: value }));
        setSaveOk('');
    };

    const handleRecruiterChange = (e) => {
        const { name, value } = e.target;
        setRecruiterForm((prev) => ({ ...prev, [name]: value }));
        setSaveOk('');
    };

    const buildStudentPatch = () => {
        const body = {};
        const f = studentForm;
        if (f.firstName.trim()) body.firstName = f.firstName.trim();
        if (f.lastName.trim()) body.lastName = f.lastName.trim();
        if (f.city.trim()) body.city = f.city.trim();
        if (f.bio.trim()) body.bio = f.bio.trim();
        if (f.hhLink.trim()) body.hhLink = f.hhLink.trim();
        if (f.birthDate.trim()) body.birthDate = f.birthDate.trim();
        if (f.course) body.course = f.course;
        if (f.busyness) body.busyness = f.busyness;
        if (f.email.trim()) body.email = f.email.trim();
        const phone = normalizePhone(f.phoneNumber);
        if (phone) body.phoneNumber = phone;
        if (f.telegramUsername.trim()) body.telegramUsername = f.telegramUsername.trim().replace(/^@/, '');
        if (f.specialityId.trim()) {
            const n = Number(f.specialityId.trim());
            if (Number.isFinite(n) && n > 0) body.specialityId = n;
        }
        const ids = parseSkillsIds(f.skillsIds);
        if (ids.length) body.skillsIds = ids;
        return body;
    };

    const saveStudent = async (e) => {
        e.preventDefault();
        if (!profile?.id) return;
        setSaving(true);
        setSaveOk('');
        setError('');
        try {
            const body = buildStudentPatch();
            const updated = await patchStudent(profile.id, body);
            setProfile(updated);
            setStudentForm(studentToForm(updated));
            setSaveOk('Изменения сохранены');
        } catch (err) {
            setError(err.message || 'Ошибка сохранения');
        } finally {
            setSaving(false);
        }
    };

    const saveRecruiter = async (e) => {
        e.preventDefault();
        if (!profile?.id) return;
        setSaving(true);
        setSaveOk('');
        setError('');
        try {
            const f = recruiterForm;
            const body = {};
            if (f.companyName.trim()) body.companyName = f.companyName.trim();
            if (f.firstName.trim()) body.firstName = f.firstName.trim();
            if (f.lastName.trim()) body.lastName = f.lastName.trim();
            if (f.email.trim()) body.email = f.email.trim();
            const phone = normalizePhone(f.phoneNumber);
            if (phone) body.phoneNumber = phone;
            if (f.telegramUsername.trim()) body.telegramUsername = f.telegramUsername.trim().replace(/^@/, '');
            const updated = await patchRecruiter(profile.id, body);
            setProfile(updated);
            setRecruiterForm(recruiterToForm(updated));
            setSaveOk('Изменения сохранены');
        } catch (err) {
            setError(err.message || 'Ошибка сохранения');
        } finally {
            setSaving(false);
        }
    };

    const onPhoto = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file || !profile?.id) return;
        setPhotoBusy(true);
        setError('');
        setSaveOk('');
        try {
            await uploadStudentPhoto(profile.id, file);
            const fresh = await getStudentMe();
            setProfile(fresh);
            setStudentForm(studentToForm(fresh));
            setSaveOk('Фото обновлено');
        } catch (err) {
            setError(err.message || 'Не удалось загрузить фото');
        } finally {
            setPhotoBusy(false);
        }
    };

    const avatarUrl = profile?.imagePath ? getImageUrl(profile.imagePath) : null;

    return (
        <>
            <Header />
            <main className="accountPage">
                <div className="accountPage__inner">
                    <h1 className="accountPage__title">Личный кабинет</h1>
                    <p className="accountPage__lead">
                        Профиль и шаблон редактирования резюме. Данные подгружаются с API{' '}
                        <code className="accountPage__code">GET /student/me</code> или{' '}
                        <code className="accountPage__code">GET /recruiter/me</code>.
                    </p>

                    {loading && <div className="accountPage__muted">Загрузка…</div>}

                    {!loading && role === 'recruiter_pending' && (
                        <section className="accountPage__card">
                            <h2 className="accountPage__cardTitle">Профиль рекрутера</h2>
                            <p className="accountPage__text">
                                Профиль ещё не привязан (ответ <code className="accountPage__code">404</code> на{' '}
                                <code className="accountPage__code">/recruiter/me</code>). Оставьте заявку на сайте —
                                после этого данные появятся здесь.
                            </p>
                        </section>
                    )}

                    {!loading && error && !role && (
                        <div className="accountPage__error" role="alert">
                            {error}
                        </div>
                    )}

                    {!loading && role === 'student' && profile && (
                        <>
                            <section className="accountPage__card">
                                <h2 className="accountPage__cardTitle">Профиль студента</h2>
                                <div className="accountPage__avatarRow">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="" className="accountPage__avatar" width={96} height={96} />
                                    ) : (
                                        <div className="accountPage__avatar accountPage__avatar--placeholder" aria-hidden>
                                            ?
                                        </div>
                                    )}
                                    <div>
                                        <label className="accountPage__fileLabel">
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png,image/gif,image/webp,image/bmp,image/tiff,.heic,.heif,.avif"
                                                className="accountPage__fileInput"
                                                onChange={onPhoto}
                                                disabled={photoBusy}
                                                aria-label="Загрузить фото профиля"
                                            />
                                            <span className="accountPage__fileLabelText">
                                                {photoBusy ? 'Загрузка…' : 'Загрузить фото'}
                                            </span>
                                        </label>
                                        <p className="accountPage__hint">
                                            <code className="accountPage__code">POST /student/photo/&#123;id&#125;</code>, поле{' '}
                                            <code className="accountPage__code">avatarFile</code>
                                        </p>
                                    </div>
                                </div>

                                <form className="accountPage__form" onSubmit={saveStudent}>
                                    <div className="accountPage__grid2">
                                        <label className="accountPage__field">
                                            <span>Имя</span>
                                            <input name="firstName" value={studentForm.firstName} onChange={handleStudentChange} />
                                        </label>
                                        <label className="accountPage__field">
                                            <span>Фамилия</span>
                                            <input name="lastName" value={studentForm.lastName} onChange={handleStudentChange} />
                                        </label>
                                    </div>
                                    <div className="accountPage__grid2">
                                        <label className="accountPage__field">
                                            <span>Город</span>
                                            <input name="city" value={studentForm.city} onChange={handleStudentChange} />
                                        </label>
                                        <label className="accountPage__field">
                                            <span>Дата рождения</span>
                                            <input type="date" name="birthDate" value={studentForm.birthDate} onChange={handleStudentChange} />
                                        </label>
                                    </div>
                                    <label className="accountPage__field">
                                        <span>Ссылка на HH</span>
                                        <input name="hhLink" value={studentForm.hhLink} onChange={handleStudentChange} placeholder="https://…" />
                                    </label>
                                    <label className="accountPage__field">
                                        <span>О себе (bio)</span>
                                        <textarea name="bio" value={studentForm.bio} onChange={handleStudentChange} rows={4} />
                                    </label>
                                    <div className="accountPage__grid2">
                                        <label className="accountPage__field">
                                            <span>Курс</span>
                                            <select name="course" value={studentForm.course} onChange={handleStudentChange}>
                                                {COURSE_OPTIONS.map((c) => (
                                                    <option key={c} value={c}>
                                                        {c}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="accountPage__field">
                                            <span>Занятость</span>
                                            <select name="busyness" value={studentForm.busyness} onChange={handleStudentChange}>
                                                {BUSYNESS_OPTIONS.map((c) => (
                                                    <option key={c} value={c}>
                                                        {c}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                    </div>
                                    <div className="accountPage__grid2">
                                        <label className="accountPage__field">
                                            <span>Email</span>
                                            <input type="email" name="email" value={studentForm.email} onChange={handleStudentChange} />
                                        </label>
                                        <label className="accountPage__field">
                                            <span>Телефон</span>
                                            <input name="phoneNumber" value={studentForm.phoneNumber} onChange={handleStudentChange} placeholder="+7…" />
                                        </label>
                                    </div>
                                    <label className="accountPage__field">
                                        <span>Telegram (без @)</span>
                                        <input name="telegramUsername" value={studentForm.telegramUsername} onChange={handleStudentChange} />
                                    </label>
                                    <div className="accountPage__grid2">
                                        <label className="accountPage__field">
                                            <span>ID специальности</span>
                                            <input name="specialityId" value={studentForm.specialityId} onChange={handleStudentChange} placeholder="например 1" />
                                        </label>
                                        <label className="accountPage__field">
                                            <span>ID навыков через запятую</span>
                                            <input name="skillsIds" value={studentForm.skillsIds} onChange={handleStudentChange} placeholder="1, 2, 3" />
                                        </label>
                                    </div>
                                    {profile.speciality ? (
                                        <p className="accountPage__hint">Специальность в карточке: {profile.speciality}</p>
                                    ) : null}

                                    {error ? (
                                        <div className="accountPage__error" role="alert">
                                            {error}
                                        </div>
                                    ) : null}
                                    {saveOk ? <div className="accountPage__ok">{saveOk}</div> : null}

                                    <button type="submit" className="accountPage__submit" disabled={saving}>
                                        {saving ? 'Сохранение…' : 'Сохранить профиль'}
                                    </button>
                                    <p className="accountPage__hint">
                                        Запрос: <code className="accountPage__code">PATCH /student/&#123;id&#125;</code> с телом{' '}
                                        <code className="accountPage__code">PatchStudentReq</code> (только заполненные поля).
                                    </p>
                                </form>
                            </section>

                            <section className="accountPage__card accountPage__card--muted">
                                <h2 className="accountPage__cardTitle">Резюме — шаблон расширения</h2>
                                <p className="accountPage__text">
                                    Здесь позже можно собрать полноценный редактор резюме: опыт работы, образование, портфолио и
                                    предпросмотр карточки. Сейчас это заготовка под те же API, что и в каталоге студентов.
                                </p>
                                <ul className="accountPage__list">
                                    <li>
                                        Опыт: типичные эндпоинты вида <code className="accountPage__code">GET/POST …/experience</code> (по
                                        документации бэкенда)
                                    </li>
                                    <li>Образование: institution / education</li>
                                    <li>Портфолио: привязка проектов к студенту</li>
                                    <li>Публикация: статусы модерации и курс <code className="accountPage__code">NEW</code></li>
                                </ul>
                                <p className="accountPage__hint">
                                    Минимально достаточно обновлять профиль и фото выше; остальное можно наращивать отдельными формами.
                                </p>
                            </section>
                        </>
                    )}

                    {!loading && role === 'recruiter' && profile && (
                        <section className="accountPage__card">
                            <h2 className="accountPage__cardTitle">Профиль рекрутера</h2>
                            <form className="accountPage__form" onSubmit={saveRecruiter}>
                                <label className="accountPage__field">
                                    <span>Компания</span>
                                    <input name="companyName" value={recruiterForm.companyName} onChange={handleRecruiterChange} required />
                                </label>
                                <div className="accountPage__grid2">
                                    <label className="accountPage__field">
                                        <span>Имя</span>
                                        <input name="firstName" value={recruiterForm.firstName} onChange={handleRecruiterChange} />
                                    </label>
                                    <label className="accountPage__field">
                                        <span>Фамилия</span>
                                        <input name="lastName" value={recruiterForm.lastName} onChange={handleRecruiterChange} />
                                    </label>
                                </div>
                                <label className="accountPage__field">
                                    <span>Email</span>
                                    <input type="email" name="email" value={recruiterForm.email} onChange={handleRecruiterChange} />
                                </label>
                                <label className="accountPage__field">
                                    <span>Телефон</span>
                                    <input name="phoneNumber" value={recruiterForm.phoneNumber} onChange={handleRecruiterChange} placeholder="+7…" />
                                </label>
                                <label className="accountPage__field">
                                    <span>Telegram (без @)</span>
                                    <input name="telegramUsername" value={recruiterForm.telegramUsername} onChange={handleRecruiterChange} />
                                </label>

                                {error ? (
                                    <div className="accountPage__error" role="alert">
                                        {error}
                                    </div>
                                ) : null}
                                {saveOk ? <div className="accountPage__ok">{saveOk}</div> : null}

                                <button type="submit" className="accountPage__submit" disabled={saving}>
                                    {saving ? 'Сохранение…' : 'Сохранить'}
                                </button>
                                <p className="accountPage__hint">
                                    Запрос: <code className="accountPage__code">PATCH /recruiter/&#123;id&#125;</code>, тело{' '}
                                    <code className="accountPage__code">PatchRecruiterReq</code>.
                                </p>
                            </form>
                        </section>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
};

export default AccountPage;
