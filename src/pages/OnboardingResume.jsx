import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import Footer from '../components/footer/Footer.jsx';
import StudentProfileEditor from '../components/settings/StudentProfileEditor.jsx';
import { Link } from 'react-router-dom';
import { getAccountStatus } from '../services/authApi.js';
import '../components/studentResume/studentResume.css';
import '../components/settings/studentOwnProfile.css';
import './accountPage.css';

const OnboardingResume = () => {
    const navigate = useNavigate();

    return (
        <>
            <Header />
            <main className="accountPage">
                <div className="accountPage__inner accountPage__inner--resumeView">
                    <h1 className="accountPage__title">
                        <span className="accountPage__titleAccent">Заполнение резюме</span>
                    </h1>
                    <p className="accountPage__lead">
                        Заполните профиль в том же виде, как его увидят рекрутеры: фото, навыки, портфолио и
                        опыт.
                    </p>

                    {getAccountStatus() === 'PENDING_APPROVAL' && (
                        <div className="accountPage__banner" role="status">
                            Аккаунт на проверке: после одобрения администратором изменения сохранятся на
                            сервере.
                        </div>
                    )}

                    <p className="accountPage__settingsNav">
                        <Link to="/settings" className="accountPage__settingsNavLink">
                            Перейти в настройки
                        </Link>
                    </p>

                    <div className="accountPage__resumePreview">
                        <StudentProfileEditor
                            resumeLayout
                            submitLabel="Сохранить резюме"
                            onSaved={() => {
                                navigate('/settings', { replace: true });
                            }}
                        />
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
};

export default OnboardingResume;
