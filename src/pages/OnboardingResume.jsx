import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import Footer from '../components/footer/Footer.jsx';
import StudentProfileEditor from '../components/settings/StudentProfileEditor.jsx';
import { getAccountStatus } from '../services/authApi.js';
import './accountPage.css';

const OnboardingResume = () => {
    const navigate = useNavigate();

    return (
        <>
            <Header />
            <main className="accountPage">
                <div className="accountPage__inner">
                    <h1 className="accountPage__title">Заполнение резюме</h1>
                    <p className="accountPage__lead">
                        Обязательные поля отмечены. Курс на сервере будет NEW до модерации администратором.
                    </p>
                    <p className="accountPage__settingsNav">
                        <Link to="/settings" className="accountPage__settingsNavLink">
                            Вернуться в настройки
                        </Link>
                    </p>

                    {getAccountStatus() === 'PENDING_APPROVAL' && (
                        <div className="accountPage__banner" role="status">
                            Аккаунт на проверке: полное редактирование резюме откроется после одобрения администратором.
                        </div>
                    )}

                    <section className="accountPage__card">
                        <StudentProfileEditor
                            showGuidedHints
                            submitLabel="Сохранить резюме"
                            onSaved={() => {
                                setTimeout(() => navigate('/settings', { replace: true }), 1200);
                            }}
                        />
                    </section>
                </div>
            </main>
            <Footer />
        </>
    );
};

export default OnboardingResume;
