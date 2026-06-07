import './header.css';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { logoutServer, requestLogin, hasApprovedCatalogAccess, AUTH_REQUIRED_EVENT } from '../../services/authApi.js';
import { useAuthState } from '../../hooks/useAuthState.js';
import logo from '../../assets/logos/Logo.png';
import searchIcon from '../../assets/icons/searchIcon.svg';
import gradientSearchIcon from '../../assets/icons/searchIconGradieng.svg';

const HeaderSearchContent = () => (
    <>
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
    </>
);

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { authed, role, refresh } = useAuthState();
    const isStudent = role === 'STUDENT';
    const catalogAccess = hasApprovedCatalogAccess();

    useEffect(() => {
        setIsMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const closeMenu = () => setIsMenuOpen(false);
        window.addEventListener(AUTH_REQUIRED_EVENT, closeMenu);
        return () => window.removeEventListener(AUTH_REQUIRED_EVENT, closeMenu);
    }, []);

    const handleLoginClick = () => {
        setIsMenuOpen(false);
        requestLogin();
    };

    const handleLogout = async () => {
        await logoutServer();
        refresh();
        navigate('/');
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleMobileLinkClick = () => {
        setIsMenuOpen(false);
    };

    const handleCatalogNav = () => {
        setIsMenuOpen(false);
        if (!catalogAccess) {
            requestLogin();
        }
    };

    return (
        <header className="header">
            <div className="header__inner">
                <div className="header__nav">
                    <Link to="/" className="header__homeBtn">главная</Link>
                    {catalogAccess ? (
                        <>
                            <Link to="/projects" className="header__navLink header__navLink--desktop">
                                проекты
                            </Link>
                            <Link to="/vacancies" className="header__navLink header__navLink--desktop">
                                вакансии
                            </Link>
                        </>
                    ) : null}
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
                            <Link to="/settings" className="header__navLink header__navLink--desktop">
                                {isStudent ? 'мой профиль' : 'настройки'}
                            </Link>
                            <Link to="/chats" className="header__navLink">
                                чаты
                            </Link>
                            <button
                                type="button"
                                className="header__navLink header__navLink--btn"
                                onClick={handleLogout}
                            >
                                выйти
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            className="header__navLink header__navLink--btn"
                            onClick={handleLoginClick}
                        >
                            войти
                        </button>
                    )}
                    {catalogAccess ? (
                        <Link to="/students" className="header__search">
                            <HeaderSearchContent />
                        </Link>
                    ) : (
                        <button type="button" className="header__search" onClick={handleLoginClick}>
                            <HeaderSearchContent />
                        </button>
                    )}
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
                {catalogAccess ? (
                    <>
                        <Link
                            to="/projects"
                            className="header__mobileBtn"
                            onClick={handleMobileLinkClick}
                        >
                            проекты
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
                    </>
                ) : (
                    <>
                        <button
                            type="button"
                            className="header__mobileBtn"
                            onClick={handleCatalogNav}
                        >
                            проекты
                        </button>
                        <button
                            type="button"
                            className="header__mobileBtn"
                            onClick={handleCatalogNav}
                        >
                            вакансии
                        </button>
                        <button
                            type="button"
                            className="header__mobileBtn"
                            onClick={handleLoginClick}
                        >
                            найти стажера
                        </button>
                    </>
                )}
                {authed ? (
                    <Link
                        to="/settings"
                        className="header__mobileBtn"
                        onClick={handleMobileLinkClick}
                    >
                        {isStudent ? 'мой профиль' : 'настройки'}
                    </Link>
                ) : null}
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
                            onClick={() => {
                                handleMobileLinkClick();
                                handleLogout();
                            }}
                        >
                            выйти
                        </button>
                    </>
                ) : (
                    <button
                        type="button"
                        className="header__mobileBtn"
                        onClick={handleLoginClick}
                    >
                        войти
                    </button>
                )}
            </div>
        </header>
    )
}

export default Header;
