import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { login, registerStudent, registerRecruiter } from '../../services/authApi.js';
import { getSpecialitiesForRegistration } from '../../services/getApi.js';
import './loginModal.css';

const CAMPUS_OPTIONS = [
    'Москва',
    'Санкт-Петербург',
    'Казань',
    'Новосибирск',
    'Екатеринбург',
    'Нижний Новгород',
    'Краснодар',
    'Ростов-на-Дону',
    'Самара',
    'Воронеж',
    'Уфа',
    'Пермь',
    'Челябинск',
    'Онлайн',
];

const ChevronLeftIcon = () => (
    <svg className="loginModal__backIcon" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path
            fill="currentColor"
            d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"
        />
    </svg>
);

const EyeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeOffIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M1 1l22 22" strokeLinecap="round" />
    </svg>
);

const emptyCreds = () => ({ username: '', password: '', passwordConfirm: '' });

const viewFromLocation = (pathname, search) => {
    if (pathname.startsWith('/registration')) {
        return new URLSearchParams(search).get('role') === 'recruiter'
            ? 'register-recruiter'
            : 'register-student';
    }
    return 'login';
};

const LoginModal = ({ onClose, onSuccess }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [view, setView] = useState(() => viewFromLocation(location.pathname, location.search));
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [info, setInfo] = useState('');
    const [specialties, setSpecialties] = useState([]);

    const [studentReg, setStudentReg] = useState({
        ...emptyCreds(),
        firstName: '',
        lastName: '',
        birthDate: '',
        campus: '',
        specialityId: '',
        email: '',
    });

    const [recruiterReg, setRecruiterReg] = useState({
        ...emptyCreds(),
        companyName: '',
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
    });

    const resetMessages = () => {
        setError('');
        setInfo('');
    };

    const goToAuthPath = (nextView) => {
        const state = location.state;
        if (nextView === 'login') {
            if (location.pathname !== '/login') {
                navigate('/login', { replace: true, state });
            }
            return;
        }
        if (nextView === 'register-student') {
            if (location.pathname !== '/registration' || location.search) {
                navigate('/registration', { replace: true, state });
            }
            return;
        }
        if (nextView === 'register-recruiter') {
            if (location.pathname !== '/registration' || location.search !== '?role=recruiter') {
                navigate('/registration?role=recruiter', { replace: true, state });
            }
        }
    };

    const switchView = (next) => {
        resetMessages();
        setView(next);
        if (next === 'login' || next === 'register-student' || next === 'register-recruiter') {
            goToAuthPath(next);
        }
    };

    useEffect(() => {
        const next = viewFromLocation(location.pathname, location.search);
        setView((current) => {
            if (current === 'register-student-done' || current === 'register-recruiter-done') {
                return current;
            }
            return next;
        });
    }, [location.pathname, location.search]);

    useEffect(() => {
        if (view !== 'register-student') return undefined;
        let cancelled = false;
        (async () => {
            try {
                const data = await getSpecialitiesForRegistration();
                if (cancelled) return;
                const normalized = data
                    .map((item) => ({
                        id: String(item.id),
                        name: item.name || item.specialityName || `Специальность ${item.id}`,
                    }))
                    .filter((item) => item.id && item.name)
                    .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
                setSpecialties(normalized);
            } catch (err) {
                console.error('Failed to load specialities:', err);
                if (!cancelled) setSpecialties([]);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [view]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(username, password);
            setTimeout(() => {
                setLoading(false);
                onSuccess();
            }, 100);
        } catch (err) {
            setError('Неверное имя пользователя или пароль');
            console.error('Login error:', err);
            setLoading(false);
        }
    };

    const validatePasswords = () => {
        if (password.length < 4) {
            setError('Пароль слишком короткий');
            return false;
        }
        if (password !== passwordConfirm) {
            setError('Пароли не совпадают');
            return false;
        }
        return true;
    };

    const handleRegisterStudent = async (e) => {
        e.preventDefault();
        resetMessages();
        if (!validatePasswords()) return;
        if (!studentReg.firstName.trim() || !studentReg.lastName.trim()) {
            setError('Укажите имя и фамилию');
            return;
        }
        if (!studentReg.birthDate) {
            setError('Укажите дату рождения');
            return;
        }
        if (!studentReg.campus) {
            setError('Выберите кампус');
            return;
        }
        if (!studentReg.specialityId) {
            setError('Выберите специальность');
            return;
        }
        setLoading(true);
        try {
            await registerStudent({
                username: username.trim(),
                password,
                passwordConfirm,
                firstName: studentReg.firstName.trim(),
                lastName: studentReg.lastName.trim(),
                birthDate: studentReg.birthDate,
                campus: studentReg.campus,
                city: studentReg.campus,
                specialityId: Number(studentReg.specialityId),
                email: studentReg.email.trim() || undefined,
            });
            setInfo('');
            switchView('register-student-done');
        } catch (err) {
            setError(err.message || 'Не удалось зарегистрироваться');
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterRecruiter = async (e) => {
        e.preventDefault();
        resetMessages();
        if (!validatePasswords()) return;
        if (!recruiterReg.companyName.trim()) {
            setError('Укажите компанию');
            return;
        }
        setLoading(true);
        try {
            await registerRecruiter({
                username: username.trim(),
                password,
                passwordConfirm,
                companyName: recruiterReg.companyName.trim(),
                firstName: recruiterReg.firstName.trim(),
                lastName: recruiterReg.lastName.trim(),
                email: recruiterReg.email.trim() || undefined,
                phoneNumber: recruiterReg.phoneNumber.trim() || undefined,
            });
            switchView('register-recruiter-done');
        } catch (err) {
            setError(err.message || 'Не удалось отправить заявку');
        } finally {
            setLoading(false);
        }
    };

    const heading =
        view === 'login'
            ? 'Вход'
            : view === 'register-student'
              ? 'Регистрация студента'
              : view === 'register-recruiter'
                ? 'Заявка работодателя'
                : view === 'register-student-done'
                  ? 'Регистрация принята'
                  : 'Заявка отправлена';

    const handleBack = () => {
        if (view === 'login') {
            onClose();
            return;
        }
        switchView('login');
    };

    return (
        <div className="loginModal__overlay">
            <div className="loginModal__card">
                <button
                    type="button"
                    className="loginModal__backBtn"
                    onClick={handleBack}
                    aria-label="Назад"
                >
                    <ChevronLeftIcon />
                </button>

                <div className="loginModal__logoWrap">
                    <div className="loginModal__logoPlaceholder" aria-hidden="true">
                        рез<br />юм<br />ище
                    </div>
                </div>

                <h2 className="loginModal__heading">{heading}</h2>

                {view === 'register-student-done' && (
                    <div className="loginModal__infoBlock">
                        <p>
                            Аккаунт создан с курсом NEW. Профиль появится у рекрутеров после модерации
                            администратором.
                        </p>
                        <button type="button" className="loginModal__primaryBtn" onClick={() => switchView('login')}>
                            Перейти ко входу
                        </button>
                    </div>
                )}

                {view === 'register-recruiter-done' && (
                    <div className="loginModal__infoBlock">
                        <p>
                            Заявка на регистрацию принята. Вход будет доступен после одобрения администратором
                            (cookie не выдаются до одобрения).
                        </p>
                        <button type="button" className="loginModal__primaryBtn" onClick={() => switchView('login')}>
                            Понятно
                        </button>
                    </div>
                )}

                {view === 'login' && (
                    <form onSubmit={handleLogin} className="loginModal__form">
                        <div className="loginModal__inputGroup">
                            <label htmlFor="loginModal-login">Логин</label>
                            <div className="loginModal__inputWrap">
                                <input
                                    id="loginModal-login"
                                    type="text"
                                    autoComplete="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="loginModal__inputGroup">
                            <label htmlFor="loginModal-password">Пароль</label>
                            <div className="loginModal__inputWrap">
                                <input
                                    id="loginModal-password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="loginModal__inputPassword"
                                />
                                <button
                                    type="button"
                                    className="loginModal__passwordToggle"
                                    onClick={() => setShowPassword((v) => !v)}
                                    disabled={loading}
                                    aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                                    aria-pressed={showPassword}
                                >
                                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        </div>

                        {error ? <div className="loginModal__error" role="alert">{error}</div> : null}

                        <button type="submit" className="loginModal__primaryBtn" disabled={loading}>
                            {loading ? 'Вход…' : 'Войти'}
                        </button>
                        <button
                            type="button"
                            className="loginModal__secondaryBtn"
                            disabled={loading}
                            onClick={() => switchView('register-student')}
                        >
                            <span>Регистрация студента</span>
                        </button>
                        <button
                            type="button"
                            className="loginModal__secondaryBtn"
                            disabled={loading}
                            onClick={() => switchView('register-recruiter')}
                        >
                            <span>Заявка работодателя</span>
                        </button>
                    </form>
                )}

                {view === 'register-student' && (
                    <form onSubmit={handleRegisterStudent} className="loginModal__form">
                        <div className="loginModal__inputGroup">
                            <label htmlFor="reg-student-login">Логин</label>
                            <input
                                id="reg-student-login"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                disabled={loading}
                                autoComplete="username"
                            />
                        </div>
                        <div className="loginModal__inputGroup">
                            <label htmlFor="reg-student-password">Пароль</label>
                            <input
                                id="reg-student-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                                autoComplete="new-password"
                            />
                        </div>
                        <div className="loginModal__inputGroup">
                            <label htmlFor="reg-student-password-confirm">Повтор пароля</label>
                            <input
                                id="reg-student-password-confirm"
                                type="password"
                                value={passwordConfirm}
                                onChange={(e) => setPasswordConfirm(e.target.value)}
                                required
                                disabled={loading}
                                autoComplete="new-password"
                            />
                        </div>
                        <div className="loginModal__inputGroup">
                            <label htmlFor="reg-student-firstName">Имя</label>
                            <input
                                id="reg-student-firstName"
                                value={studentReg.firstName}
                                onChange={(e) => setStudentReg((p) => ({ ...p, firstName: e.target.value }))}
                                required
                                disabled={loading}
                                autoComplete="given-name"
                            />
                        </div>
                        <div className="loginModal__inputGroup">
                            <label htmlFor="reg-student-lastName">Фамилия</label>
                            <input
                                id="reg-student-lastName"
                                value={studentReg.lastName}
                                onChange={(e) => setStudentReg((p) => ({ ...p, lastName: e.target.value }))}
                                required
                                disabled={loading}
                                autoComplete="family-name"
                            />
                        </div>
                        <div className="loginModal__inputGroup">
                            <label htmlFor="reg-student-birthDate">Дата рождения</label>
                            <input
                                id="reg-student-birthDate"
                                type="date"
                                value={studentReg.birthDate}
                                onChange={(e) => setStudentReg((p) => ({ ...p, birthDate: e.target.value }))}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="loginModal__inputGroup">
                            <label htmlFor="reg-student-campus">Кампус</label>
                            <select
                                id="reg-student-campus"
                                value={studentReg.campus}
                                onChange={(e) => setStudentReg((p) => ({ ...p, campus: e.target.value }))}
                                required
                                disabled={loading}
                            >
                                <option value="">Выберите кампус</option>
                                {CAMPUS_OPTIONS.map((campus) => (
                                    <option key={campus} value={campus}>
                                        {campus}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="loginModal__inputGroup">
                            <label htmlFor="reg-student-speciality">Специальность</label>
                            <select
                                id="reg-student-speciality"
                                value={studentReg.specialityId}
                                onChange={(e) => setStudentReg((p) => ({ ...p, specialityId: e.target.value }))}
                                required
                                disabled={loading}
                            >
                                <option value="">Выберите специальность</option>
                                {specialties.map((specialty) => (
                                    <option key={specialty.id} value={specialty.id}>
                                        {specialty.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="loginModal__inputGroup">
                            <label htmlFor="reg-student-email">Email</label>
                            <input
                                id="reg-student-email"
                                type="email"
                                value={studentReg.email}
                                onChange={(e) => setStudentReg((p) => ({ ...p, email: e.target.value }))}
                                disabled={loading}
                                autoComplete="email"
                            />
                        </div>
                        {error ? <div className="loginModal__error" role="alert">{error}</div> : null}
                        <button type="submit" className="loginModal__primaryBtn" disabled={loading}>
                            {loading ? 'Отправка…' : 'Зарегистрироваться'}
                        </button>
                    </form>
                )}

                {view === 'register-recruiter' && (
                    <form onSubmit={handleRegisterRecruiter} className="loginModal__form">
                        <div className="loginModal__inputGroup">
                            <label>Логин</label>
                            <input value={username} onChange={(e) => setUsername(e.target.value)} required disabled={loading} />
                        </div>
                        <div className="loginModal__inputGroup">
                            <label>Пароль</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
                        </div>
                        <div className="loginModal__inputGroup">
                            <label>Повтор пароля</label>
                            <input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required disabled={loading} />
                        </div>
                        <div className="loginModal__inputGroup">
                            <label>Компания</label>
                            <input value={recruiterReg.companyName} onChange={(e) => setRecruiterReg((p) => ({ ...p, companyName: e.target.value }))} required disabled={loading} />
                        </div>
                        <div className="loginModal__inputGroup">
                            <label>Имя</label>
                            <input value={recruiterReg.firstName} onChange={(e) => setRecruiterReg((p) => ({ ...p, firstName: e.target.value }))} disabled={loading} />
                        </div>
                        <div className="loginModal__inputGroup">
                            <label>Фамилия</label>
                            <input value={recruiterReg.lastName} onChange={(e) => setRecruiterReg((p) => ({ ...p, lastName: e.target.value }))} disabled={loading} />
                        </div>
                        <div className="loginModal__inputGroup">
                            <label>Email</label>
                            <input type="email" value={recruiterReg.email} onChange={(e) => setRecruiterReg((p) => ({ ...p, email: e.target.value }))} disabled={loading} />
                        </div>
                        {error ? <div className="loginModal__error" role="alert">{error}</div> : null}
                        <button type="submit" className="loginModal__primaryBtn" disabled={loading}>
                            {loading ? 'Отправка…' : 'Подать заявку'}
                        </button>
                    </form>
                )}

                {view === 'login' && (
                    <a href="#" className="loginModal__forgotLink" onClick={(e) => e.preventDefault()}>
                        Забыли пароль?
                    </a>
                )}
                {info ? <p className="loginModal__infoText">{info}</p> : null}
            </div>
        </div>
    );
};

export default LoginModal;
