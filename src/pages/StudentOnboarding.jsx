import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
    completeStudentRegistration,
} from '../services/accountApi.js';
import { logoutServer } from '../services/authApi.js';
import { resolveStudentOnboarding, STUDENT_STAGE } from '../services/studentOnboardingApi.js';
import { CAMPUS_OPTIONS } from '../constants/campusCities.js';
import '../components/auth/registerForm.css';
import './studentOnboarding.css';
import LogoImage from '../assets/logos/resume_logo_mini.png';

const COURSE_OPTIONS = [
    { value: 'FIRST', label: '1 курс' },
    { value: 'SECOND', label: '2 курс' },
    { value: 'THIRD', label: '3 курс' },
    { value: 'FOURTH', label: '4 курс' },
    { value: 'FIFTH', label: '5 курс' },
];

const COURSE_FROM_API = {
    FIRST: 'FIRST',
    SECOND: 'SECOND',
    THIRD: 'THIRD',
    FOURTH: 'FOURTH',
    FIFTH: 'FIFTH',
    NEW: 'FIFTH',
};

const StudentOnboarding = () => {
    const navigate = useNavigate();
    const [bootLoading, setBootLoading] = useState(true);
    const [stage, setStage] = useState(null);
    const [authMe, setAuthMe] = useState(null);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [doneOnce, setDoneOnce] = useState(false);
    const [form, setForm] = useState({
        birthDate: '',
        course: '',
        city: '',
    });

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const result = await resolveStudentOnboarding();
                if (cancelled) return;
                if (!result.stage) {
                    navigate('/students', { replace: true });
                    return;
                }
                if (result.stage === STUDENT_STAGE.CONFIRM_EMAIL) {
                    navigate('/registration?role=student', { replace: true });
                    return;
                }
                if (result.stage === STUDENT_STAGE.QUESTIONNAIRE) {
                    navigate('/plug', { replace: true });
                    return;
                }
                if (result.stage === STUDENT_STAGE.APPROVED) {
                    navigate('/students', { replace: true });
                    return;
                }
                setAuthMe(result.authMe);
                setStage(result.stage);
                const s = result.studentMe || {};
                setForm({
                    birthDate: s.birthDate || '',
                    course: COURSE_FROM_API[s.course] || '',
                    city: s.city || '',
                });
            } catch (err) {
                if (!cancelled) {
                    setError(err?.message || 'Не удалось загрузить статус');
                }
            } finally {
                if (!cancelled) setBootLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (error) setError('');
    };

    const handleComplete = async (e) => {
        e.preventDefault();
        if (doneOnce || saving) return;
        if (!form.birthDate) {
            setError('Укажите дату рождения');
            return;
        }
        if (!form.course) {
            setError('Укажите курс');
            return;
        }
        if (!String(form.city || '').trim()) {
            setError('Укажите город');
            return;
        }

        setSaving(true);
        setError('');
        try {
            await completeStudentRegistration({
                birthDate: form.birthDate,
                course: form.course,
                city: String(form.city).trim(),
            });
            setDoneOnce(true);
            navigate('/plug', { replace: true });
        } catch (err) {
            setError(err?.message || 'Не удалось завершить регистрацию');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await logoutServer();
        navigate('/login', { replace: true });
    };

    if (bootLoading) {
        return (
            <div className="studentOnboarding">
                <div className="studentOnboarding__card">
                    <p className="studentOnboarding__text">Загрузка…</p>
                </div>
            </div>
        );
    }

    if (stage === STUDENT_STAGE.REJECTED) {
        return (
            <div className="studentOnboarding">
                <div className="studentOnboarding__card">
                    <img src={LogoImage} alt="" className="studentOnboarding__logo" />
                    <h1 className="studentOnboarding__title">Заявка отклонена</h1>
                    <p className="studentOnboarding__text">
                        {authMe?.rejectionComment
                            || authMe?.rejectionReason
                            || 'Администратор отклонил регистрацию. Если это ошибка — напишите в поддержку.'}
                    </p>
                    <button type="button" className="studentOnboarding__btn" onClick={handleLogout}>
                        Выйти
                    </button>
                </div>
            </div>
        );
    }

    if (stage === STUDENT_STAGE.PENDING_REVIEW) {
        return (
            <div className="studentOnboarding">
                <div className="studentOnboarding__card">
                    <img src={LogoImage} alt="" className="studentOnboarding__logo" />
                    <h1 className="studentOnboarding__title">Анкета на проверке</h1>
                    <p className="studentOnboarding__text">
                        Мы получили анкету. Дождитесь одобрения — письмо придёт на почту,
                        а в кабинете статус станет APPROVED.
                    </p>
                    <Link to="/" className="studentOnboarding__link">На главную</Link>
                    <button type="button" className="studentOnboarding__btn studentOnboarding__btn--ghost" onClick={handleLogout}>
                        Выйти
                    </button>
                </div>
            </div>
        );
    }

    if (stage !== STUDENT_STAGE.COMPLETE_REGISTRATION) {
        return <Navigate to="/students" replace />;
    }

    return (
        <div className="studentOnboarding">
            <form className="studentOnboarding__card" onSubmit={handleComplete}>
                <img src={LogoImage} alt="" className="studentOnboarding__logo" />
                <h1 className="studentOnboarding__title">Завершение регистрации</h1>
                <p className="studentOnboarding__text">
                    Укажите дату рождения, курс и город. После этого можно заполнить анкету.
                </p>

                <div className="registerForm__inputGroup">
                    <label htmlFor="onboarding-birthDate">Дата рождения</label>
                    <input
                        id="onboarding-birthDate"
                        type="date"
                        name="birthDate"
                        value={form.birthDate}
                        onChange={handleChange}
                        disabled={saving || doneOnce}
                        required
                    />
                </div>
                <div className="registerForm__inputGroup">
                    <label htmlFor="onboarding-course">Курс</label>
                    <select
                        id="onboarding-course"
                        name="course"
                        value={form.course}
                        onChange={handleChange}
                        disabled={saving || doneOnce}
                        required
                    >
                        <option value="">Выберите курс</option>
                        {COURSE_OPTIONS.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                    </select>
                </div>
                <div className="registerForm__inputGroup">
                    <label htmlFor="onboarding-city">Город / кампус</label>
                    <select
                        id="onboarding-city"
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        disabled={saving || doneOnce}
                        required
                    >
                        <option value="">Выберите город</option>
                        {CAMPUS_OPTIONS.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>

                {error ? <p className="studentOnboarding__error" role="alert">{error}</p> : null}

                <button
                    type="submit"
                    className="studentOnboarding__btn"
                    disabled={saving || doneOnce}
                >
                    {doneOnce ? 'Готово' : (saving ? 'Отправка…' : 'Завершить регистрацию')}
                </button>
            </form>
        </div>
    );
};

export default StudentOnboarding;
