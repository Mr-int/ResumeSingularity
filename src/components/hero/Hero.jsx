import './hero.css';
import searchIcon from '../../assets/icons/searchIcon.svg';
import arrowIcon from "../../assets/icons/arrow.svg";
import romanActive from '../../assets/heroAnimation/roman_active.png';
import leraUnactive from '../../assets/heroAnimation/lera_unactive.png';
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
                        <div className="hero__right-glow" aria-hidden />
                        <div className="hero__right-block hero__right-block--1">
                            <img src={romanActive} alt="" loading="lazy" className="hero__right-block-img" />
                        </div>
                        <div className="hero__right-block hero__right-block--2">
                            <img src={leraUnactive} alt="" loading="lazy" className="hero__right-block-img" />
                        </div>
                    </div>
                )}

                <img src={arrowIcon} alt="arrow" className="hero__arrow"/>
            </div>
        </section>
    )
}

export default Hero;