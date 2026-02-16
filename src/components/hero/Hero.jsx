import './hero.css';
import searchIcon from '../../assets/icons/searchIcon.svg';
import arrowIcon from "../../assets/icons/arrow.svg";
import { useEffect, useState } from 'react';
import { Link } from "react-router-dom";

const Hero = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <section className='hero'>
            <div className="hero__wrapper">
                <div className="hero__left-content">
                    <div className="left-content__title">
                        <span>найдите стажёра</span>
                        <span>среди <span className='TextGradient'>лучших</span> </span>
                        <span>студентов</span>
                    </div>

                    <div className="left-content__description">
                        <span>Подберите лучших стажёров</span>
                        <span>под задачи вашей компании</span>
                    </div>

                    <Link to="/students" className="hero__button">
                        Найти стажёра
                        <img src={searchIcon} alt="search" className="button__icon" />
                    </Link>
                </div>

                {!isMobile && (
                    <div className="hero__right">
                        <div className="hero__right-glow hero__right-glow--1" aria-hidden />
                        <div className="hero__right-glow hero__right-glow--2" aria-hidden />
                        <div className="hero__right-block hero__right-block--1" />
                        <div className="hero__right-block hero__right-block--2" />
                    </div>
                )}

                <img src={arrowIcon} alt="arrow" className="hero__arrow"/>
            </div>
        </section>
    )
}

export default Hero;