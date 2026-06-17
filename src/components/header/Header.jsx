import './header.css';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    isAuthenticated,
    isStudentRole,
    requestLogin,
    AUTH_CHANGED_EVENT,
} from '../../services/authApi.js';
import { subscribeChatUnreadTotal } from '../../utils/chatUnreadBus.js';
import logo from '../../assets/logos/Logo.png';
import searchIcon from '../../assets/icons/searchIcon.svg';
import gradientSearchIcon from '../../assets/icons/searchIconGradieng.svg';

const MOBILE_MENU_ID = 'header-mobile-menu';

const Header = () => {
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [authed, setAuthed] = useState(() => isAuthenticated());
    const [isStudent, setIsStudent] = useState(() => isStudentRole());
    const [chatUnreadTotal, setChatUnreadTotalState] = useState(0);

    useEffect(() => {
        const sync = () => {
            setAuthed(isAuthenticated());
            setIsStudent(isStudentRole());
        };
        sync();
        window.addEventListener(AUTH_CHANGED_EVENT, sync);
        return () => window.removeEventListener(AUTH_CHANGED_EVENT, sync);
    }, []);

    useEffect(() => {
        if (!authed) {
            setChatUnreadTotalState(0);
            return undefined;
        }
        return subscribeChatUnreadTotal(setChatUnreadTotalState);
    }, [authed]);

    useEffect(() => {
        setIsMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!isMenuOpen) {
            document.body.style.overflow = '';
            return undefined;
        }

        document.body.style.overflow = 'hidden';

        const handleResize = () => {
            if (window.innerWidth > 992) {
                setIsMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('resize', handleResize);
        };
    }, [isMenuOpen]);

    const toggleMenu = () => {
        setIsMenuOpen((open) => !open);
    };

    const handleMobileLinkClick = () => {
        setIsMenuOpen(false);
    };

    const handleLoginClick = () => {
        handleMobileLinkClick();
        requestLogin();
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    const studentsLinkLabel = isStudent ? 'студенты' : 'найти стажера';

    return (
        <header className="header">
            {isMenuOpen ? (
                <button
                    type="button"
                    className="header__overlay"
                    aria-label="Закрыть меню"
                    onClick={closeMenu}
                />
            ) : null}

            <div className="header__inner">
                <div className="header__nav">
                    <Link to="/" className="header__homeBtn">главная</Link>
                    <Link to="/vacancies" className="header__navLink">вакансии</Link>
                    <Link to="/student-projects" className="header__navLink">проекты</Link>
                </div>

                <button
                    type="button"
                    className={`header__burger ${isMenuOpen ? 'active' : ''}`}
                    onClick={toggleMenu}
                    aria-label={isMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
                    aria-expanded={isMenuOpen}
                    aria-controls={MOBILE_MENU_ID}
                >
                    <span className="header__burgerLine"></span>
                    <span className="header__burgerLine"></span>
                    <span className="header__burgerLine"></span>
                </button>

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
                        <Link to="/chats" className="header__navLink header__navLink--chats">
                            чаты
                            {chatUnreadTotal > 0 ? (
                                <span className="header__chatBadge" aria-label={`Непрочитанных: ${chatUnreadTotal}`}>
                                    {chatUnreadTotal > 99 ? '99+' : chatUnreadTotal}
                                </span>
                            ) : null}
                        </Link>
                    ) : null}
                    <Link to="/students" className="header__search">
                        <span className="header__searchBtn">
                            <span className="header__searchBtnWhite">{studentsLinkLabel}</span>
                            <span className="header__searchBtnGradient" aria-hidden="true">{studentsLinkLabel}</span>
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

                <div className="header__mobileSpacer" aria-hidden="true" />

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
            </div>

            <div
                id={MOBILE_MENU_ID}
                className={`header__mobileMenu ${isMenuOpen ? 'active' : ''}`}
            >
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
                    to="/student-projects"
                    className="header__mobileBtn"
                    onClick={handleMobileLinkClick}
                >
                    проекты
                </Link>
                <Link
                    to="/students"
                    className="header__mobileBtn"
                    onClick={handleMobileLinkClick}
                >
                    {studentsLinkLabel}
                </Link>
                {authed ? (
                    <Link
                        to="/chats"
                        className="header__mobileBtn header__mobileBtn--chats"
                        onClick={handleMobileLinkClick}
                    >
                        чаты
                        {chatUnreadTotal > 0 ? (
                            <span className="header__chatBadge header__chatBadge--mobile">
                                {chatUnreadTotal > 99 ? '99+' : chatUnreadTotal}
                            </span>
                        ) : null}
                    </Link>
                ) : null}
                {authed ? (
                    <Link
                        to="/settings"
                        className="header__mobileBtn"
                        onClick={handleMobileLinkClick}
                    >
                        профиль
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
