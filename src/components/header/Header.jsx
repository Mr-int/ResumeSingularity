import './header.css';
import { useState } from 'react';
import { Link } from "react-router-dom";
import logo from '../../assets/logos/Logo.png';
import searchIcon from '../../assets/icons/searchIcon.svg';
import gradientSearchIcon from '../../assets/icons/searchIconGradieng.svg';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

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
                    <Link to="/settings" className="header__settingsBtn" aria-label="Настройки" title="Настройки">
                        <svg className="header__settingsIcon" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                                fill="currentColor"
                                d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.31-.09.63-.09.94s.02.63.06.93l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
                            />
                        </svg>
                    </Link>
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
                    to="/about"
                    className="header__mobileBtn header__mobileBtn--about"
                    onClick={handleMobileLinkClick}
                >
                    о студентах
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
            </div>
        </header>
    )
}

export default Header;