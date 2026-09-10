import React, { useState, useEffect } from 'react';
import { registerStudent, registerRecruiter } from '../../services/authApi.js';
import { getSpecialitiesForRegistration } from '../../services/getApi.js';
import './registerForm.css';
import BackIcon from '../../assets/icons/vectorAuth.svg';
import LogoImage from '../../assets/logos/resume_logo_mini.png';

const CAMPUS_OPTIONS = [
    'Москва', 'Санкт-Петербург', 'Казань', 'Новосибирск',
    'Екатеринбург', 'Нижний Новгород', 'Краснодар', 'Ростов-на-Дону',
    'Самара', 'Воронеж', 'Уфа', 'Пермь', 'Челябинск', 'Онлайн'
];

const RegisterForm = ({ role, onBack, onSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [specialties, setSpecialties] = useState([]);

    const [studentReg, setStudentReg] = useState({
        firstName: '',
        lastName: '',
        birthDate: '',
        campus: '',
        specialityId: '',
        email: '',
    });

    const [recruiterReg, setRecruiterReg] = useState({
        companyName: '',
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
    });

    useEffect(() => {
        if (role === 'student') {
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
            return () => { cancelled = true; };
        }
    }, [role]);

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
        setError('');
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
            onSuccess('student');
        } catch (err) {
            setError(err.message || 'Не удалось зарегистрироваться');
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterRecruiter = async (e) => {
        e.preventDefault();
        setError('');
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
            onSuccess('recruiter');
        } catch (err) {
            setError(err.message || 'Не удалось отправить заявку');
        } finally {
            setLoading(false);
        }
    };

    const heading = role === 'student' ? 'Регистрация студента' : 'Заявка работодателя';

    return (
        <div className="registerForm__overlay">
            <div className="registerForm__card">
                <button
                    type="button"
                    className="registerForm__backBtn"
                    onClick={onBack}
                    aria-label="Назад"
                >
                    <img src={BackIcon} alt="Назад" className="registerForm__backIcon" />
                </button>

                <div className="registerForm__logoWrap">
                    <img src={LogoImage} alt="Resume Singularity" className="registerForm__logoImage" />
                </div>

                <h2 className="registerForm__heading">{heading}</h2>

                <form onSubmit={role === 'student' ? handleRegisterStudent : handleRegisterRecruiter} className="registerForm__form">
                    <div className="registerForm__inputGroup">
                        <label>Логин</label>
                        <input value={username} onChange={(e) => setUsername(e.target.value)} required disabled={loading} />
                    </div>

                    <div className="registerForm__inputGroup">
                        <label>Пароль</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
                    </div>

                    <div className="registerForm__inputGroup">
                        <label>Повтор пароля</label>
                        <input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required disabled={loading} />
                    </div>

                    {role === 'student' && (
                        <>
                            <div className="registerForm__inputGroup">
                                <label>Имя</label>
                                <input value={studentReg.firstName} onChange={(e) => setStudentReg({...studentReg, firstName: e.target.value})} required disabled={loading} />
                            </div>
                            <div className="registerForm__inputGroup">
                                <label>Фамилия</label>
                                <input value={studentReg.lastName} onChange={(e) => setStudentReg({...studentReg, lastName: e.target.value})} required disabled={loading} />
                            </div>
                            <div className="registerForm__inputGroup">
                                <label>Дата рождения</label>
                                <input type="date" value={studentReg.birthDate} onChange={(e) => setStudentReg({...studentReg, birthDate: e.target.value})} required disabled={loading} />
                            </div>
                            <div className="registerForm__inputGroup">
                                <label>Кампус</label>
                                <select value={studentReg.campus} onChange={(e) => setStudentReg({...studentReg, campus: e.target.value})} required disabled={loading}>
                                    <option value="">Выберите кампус</option>
                                    {CAMPUS_OPTIONS.map((campus) => (
                                        <option key={campus} value={campus}>{campus}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="registerForm__inputGroup">
                                <label>Специальность</label>
                                <select value={studentReg.specialityId} onChange={(e) => setStudentReg({...studentReg, specialityId: e.target.value})} required disabled={loading}>
                                    <option value="">Выберите специальность</option>
                                    {specialties.map((specialty) => (
                                        <option key={specialty.id} value={specialty.id}>{specialty.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="registerForm__inputGroup">
                                <label>Email</label>
                                <input type="email" value={studentReg.email} onChange={(e) => setStudentReg({...studentReg, email: e.target.value})} disabled={loading} />
                            </div>
                        </>
                    )}

                    {role === 'recruiter' && (
                        <>
                            <div className="registerForm__inputGroup">
                                <label>Компания</label>
                                <input value={recruiterReg.companyName} onChange={(e) => setRecruiterReg({...recruiterReg, companyName: e.target.value})} required disabled={loading} />
                            </div>
                            <div className="registerForm__inputGroup">
                                <label>Имя</label>
                                <input value={recruiterReg.firstName} onChange={(e) => setRecruiterReg({...recruiterReg, firstName: e.target.value})} disabled={loading} />
                            </div>
                            <div className="registerForm__inputGroup">
                                <label>Фамилия</label>
                                <input value={recruiterReg.lastName} onChange={(e) => setRecruiterReg({...recruiterReg, lastName: e.target.value})} disabled={loading} />
                            </div>
                            <div className="registerForm__inputGroup">
                                <label>Email</label>
                                <input type="email" value={recruiterReg.email} onChange={(e) => setRecruiterReg({...recruiterReg, email: e.target.value})} disabled={loading} />
                            </div>
                        </>
                    )}

                    {error ? <div className="registerForm__error" role="alert">{error}</div> : null}

                    <button type="submit" className="registerForm__primaryBtn" disabled={loading}>
                        {loading ? 'Отправка…' : (role === 'student' ? 'Зарегистрироваться' : 'Подать заявку')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RegisterForm;