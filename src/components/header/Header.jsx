import './header.css';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logoutServer } from '../../services/authApi.js';
import { useAuthState } from '../../hooks/useAuthState.js';
import logo from '../../assets/logos/Logo.png';
import searchIcon from '../../assets/icons/searchIcon.svg';
import gradientSearchIcon from '../../assets/icons/searchIconGradieng.svg';

const Header = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { authed, role } = useAuthState();
    const isStudent = role === 'STUDENT';

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
                            {isStudent ? (
                                <Link to="/settings" className="header__navLink header__navLink--desktop">
                                    мой профиль
                                </Link>
                            ) : null}
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
                {authed ? (
                    <>
                        {isStudent ? (
                            <Link
                                to="/settings"
                                className="header__mobileBtn"
                                onClick={handleMobileLinkClick}
                            >
                                мой профиль
                            </Link>
                        ) : null}
                        <Link
                            to="/vacancies"
                        className="header__mobileBtn"
                        onClick={handleMobileLinkClick}
                    >
                        вакансии
                    </Link>
                    </>
                ) : null}
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
                ) : null}
            </div>
        </header>
    )
}

export default Header;