import './header.css';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    isAuthenticated,
    logoutServer,
    requestLogin,
    AUTH_CHANGED_EVENT,
} from '../../services/authApi.js';
import logo from '../../assets/logos/Logo.png';
import searchIcon from '../../assets/icons/searchIcon.svg';
import gradientSearchIcon from '../../assets/icons/searchIconGradieng.svg';

const LoginIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="100%"
        height="100%"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
    >
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <polyline points="10 17 15 12 10 7" />
        <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
);

const Header = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [authed, setAuthed] = useState(() => isAuthenticated());

    useEffect(() => {
        const sync = () => setAuthed(isAuthenticated());
        sync();
        window.addEventListener(AUTH_CHANGED_EVENT, sync);
        return () => window.removeEventListener(AUTH_CHANGED_EVENT, sync);
    }, []);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleMobileLinkClick = () => {
        setIsMenuOpen(false);
    };

    const handleLoginClick = () => {
        handleMobileLinkClick();
        requestLogin();
    };

    return (
        <header className="header">
            <div className="header__inner">
                <div className="header__nav">
                    <Link to="/" className="header__homeBtn">главная</Link>
                    <Link to="/vacancies" className="header__navLink">вакансии</Link>
                </div>

                <Link to="/" className="header__logoLink">
                    <img
                        src={logo}
                        alt="Singularity_resume"
                        className="header__logo"
                        width="175"
                        height="75"
                    />
                </Link>

                <div className="header__rightCluster">
                    {authed ? (
                        <>
                            <Link to="/chats" className="header__navLink">
                                чаты
                            </Link>
                            <button
                                type="button"
                                className="header__navLink header__navLink--btn"
                                onClick={async () => {
                                    await logoutServer();
                                    navigate('/');
                                }}
                            >
                                выйти
                            </button>
                        </>
                    ) : null}
                    <Link to="/students" className="header__search">
                        <span className="header__searchBtn">
                            <span className="header__searchBtnWhite">найти стажера</span>
                            <span className="header__searchBtnGradient" aria-hidden="true">найти стажера</span>
                        </span>
                        <div className="header__searchIconContainer">
                            <img
                                src={searchIcon}
                                alt="search"
                                className="header__searchIcon"
                                width="20"
                                height="20"
                            />
                            <img
                                src={gradientSearchIcon}
                                alt="search"
                                className="header__searchIconGradient"
                                width="20"
                                height="20"
                            />
                        </div>
                    </Link>
                    {!authed ? (
                        <button
                            type="button"
                            className="header__loginBtn"
                            onClick={handleLoginClick}
                            aria-label="Войти"
                            title="Войти"
                        >
                            <span className="header__loginIcon">
                                <LoginIcon />
                            </span>
                        </button>
                    ) : null}
                </div>

                <button
                    className={`header__burger ${isMenuOpen ? 'active' : ''}`}
                    onClick={toggleMenu}
                    aria-label="Открыть меню"
                >
                    <span className="header__burgerLine"></span>
                    <span className="header__burgerLine"></span>
                    <span className="header__burgerLine"></span>
                </button>
            </div>

            <div className={`header__mobileMenu ${isMenuOpen ? 'active' : ''}`}>
                <Link
                    to="/"
                    className="header__mobileBtn"
                    onClick={handleMobileLinkClick}
                >
                    главная
                </Link>
                <Link
                    to="/vacancies"
                    className="header__mobileBtn"
                    onClick={handleMobileLinkClick}
                >
                    вакансии
                </Link>
                <Link
                    to="/students"
                    className="header__mobileBtn"
                    onClick={handleMobileLinkClick}
                >
                    найти стажера
                </Link>
                <Link
                    to="/settings"
                    className="header__mobileBtn"
                    onClick={handleMobileLinkClick}
                >
                    настройки
                </Link>
                {authed ? (
                    <>
                        <Link
                            to="/chats"
                            className="header__mobileBtn"
                            onClick={handleMobileLinkClick}
                        >
                            чаты
                        </Link>
                        <button
                            type="button"
                            className="header__mobileBtn"
                            onClick={async () => {
                                handleMobileLinkClick();
                                await logoutServer();
                                navigate('/');
                            }}
                        >
                            выйти
                        </button>
                    </>
                ) : (
                    <button
                        type="button"
                        className="header__mobileBtn header__mobileBtn--login"
                        onClick={handleLoginClick}
                    >
                        <span className="header__mobileLoginIcon" aria-hidden>
                            <LoginIcon />
                        </span>
                        войти
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
