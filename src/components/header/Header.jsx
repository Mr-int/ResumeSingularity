import './header.css';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logoutServer, requestLogin } from '../../services/authApi.js';
import { useAuthState } from '../../hooks/useAuthState.js';
import logo from '../../assets/logos/Logo.png';
import searchIcon from '../../assets/icons/searchIcon.svg';
import gradientSearchIcon from '../../assets/icons/searchIconGradieng.svg';

const Header = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { authed, role, refresh } = useAuthState();
    const isStudent = role === 'STUDENT';

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

    return (
        <header className="header">
            <div className="header__inner">
                <div className="header__nav">
                    <Link to="/" className="header__homeBtn">главная</Link>
                    <Link to="/projects" className="header__navLink header__navLink--desktop">
                        проекты
                    </Link>
                    <Link to="/vacancies" className="header__navLink header__navLink--desktop">
                        вакансии
                    </Link>
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
                            onClick={requestLogin}
                        >
                            войти
                        </button>
                    )}
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
                {authed ? (
                    <Link
                        to="/settings"
                        className="header__mobileBtn"
                        onClick={handleMobileLinkClick}
                    >
                        {isStudent ? 'мой профиль' : 'настройки'}
                    </Link>
                ) : null}
                <Link
                    to="/students"
                    className="header__mobileBtn"
                    onClick={handleMobileLinkClick}
                >
                    найти стажера
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
                        onClick={() => {
                            handleMobileLinkClick();
                            requestLogin();
                        }}
                    >
                        войти
                    </button>
                )}
            </div>
        </header>
    )
}

export default Header;