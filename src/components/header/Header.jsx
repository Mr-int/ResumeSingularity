import './header.css';
import { useState } from 'react';
import logo from '../../assets/logos/Logo.png';
import searchIcon from '../../assets/icons/searchIcon.svg';
import { Link } from "react-router-dom";

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
                    <button className="header__aboutBtn">о студентах</button>
                </div>

                <img src={logo} alt="Singularity_resume" className="header__logo" width="175" height="75" />

                <div className="header__search">
                    <Link to="/students" className="header__searchBtn">найти стажера</Link>
                    <img src={searchIcon} alt="search" className="header__searchIcon" width="20" height="20" />
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
                    className="header__mobileBtn"
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
            </div>
        </header>
    )
}

export default Header;