import './header.css';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    isAuthenticated,
    requestLogin,
    AUTH_CHANGED_EVENT,
} from '../../services/authApi.js';
import logo from '../../assets/logos/Logo.png';
import searchIcon from '../../assets/icons/searchIcon.svg';
import gradientSearchIcon from '../../assets/icons/searchIconGradieng.svg';

const Header = () => {
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
                        <Link to="/chats" className="header__navLink">
                            чаты
                        </Link>
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
                </div>

                {authed ? (
                    <Link to="/settings" className="header__authBtn">
                        профиль
                    </Link>
                ) : (
                    <button
                        type="button"
                        className="header__authBtn"
                        onClick={handleLoginClick}
                    >
                        войти
                    </button>
                )}

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
                    профиль
                </Link>
                {authed ? (
                    <Link
                        to="/chats"
                        className="header__mobileBtn"
                        onClick={handleMobileLinkClick}
                    >
                        чаты
                    </Link>
                ) : null}
                {!authed ? (
                    <button
                        type="button"
                        className="header__mobileBtn"
                        onClick={handleLoginClick}
                    >
                        войти
                    </button>
                ) : null}
            </div>
        </header>
    );
};

export default Header;
