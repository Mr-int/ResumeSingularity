import './hero.css';
import searchIcon from '../../assets/icons/searchIcon.svg';
import arrowIcon from "../../assets/icons/arrow.svg";
import numbersBg from '../../assets/heroAnimation/numbers.png';
import emojiBg from '../../assets/heroAnimation/emoji.png';
import romanActive from '../../assets/heroAnimation/roman_active.png';
import romanUnactive from '../../assets/heroAnimation/roman_unactive.png';
import leraActive from '../../assets/heroAnimation/lera_active.png';
import leraUnactive from '../../assets/heroAnimation/lera_unactive.png';
import { useEffect, useState } from 'react';
import GradientButton from "../common/gradientButton/GradientButton.jsx";
import { hasApprovedCatalogAccess, isStudentRole, requestLogin } from '../../services/authApi.js';

const Hero = () => {
    const [isMobile, setIsMobile] = useState(false);
    const [isRightCardHovered, setIsRightCardHovered] = useState(false);
    const isStudent = isStudentRole();
    const catalogAccess = hasApprovedCatalogAccess();

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

                    {isStudent ? (
                        <GradientButton
                            as="link"
                            to="/settings"
                            className="hero__button"
                        >
                            Мой профиль
                        </GradientButton>
                    ) : catalogAccess ? (
                        <GradientButton
                            as="link"
                            to="/students"
                            className="hero__button"
                            icon={<img src={searchIcon} alt="search" className="button__icon" />}
                        >
                            Найти стажёра
                        </GradientButton>
                    ) : (
                        <GradientButton
                            as="button"
                            type="button"
                            className="hero__button"
                            onClick={requestLogin}
                            icon={<img src={searchIcon} alt="search" className="button__icon" />}
                        >
                            Найти стажёра
                        </GradientButton>
                    )}
                </div>

                <div className={`hero__right ${isRightCardHovered ? 'hero__right--cards-hovered' : ''}`}>
                        <div className="hero__right-bg" aria-hidden>
                            <div className="hero__right-bg-item hero__right-bg-item--numbers">
                                <img src={numbersBg} alt="" className="hero__right-bg-img" loading="lazy" />
                            </div>
                            <div className="hero__right-bg-item hero__right-bg-item--emoji">
                                <img src={emojiBg} alt="" className="hero__right-bg-img" loading="lazy" />
                            </div>
                        </div>
                        <div className="hero__right-glow" aria-hidden />
                        <div className="hero__right-block hero__right-block--1">
                            <img
                                src={romanActive}
                                alt=""
                                loading="lazy"
                                className="hero__right-block-img hero__right-block-img--default"
                            />
                            <img src={romanUnactive} alt="" loading="lazy" className="hero__right-block-img hero__right-block-img--hover" />
                        </div>
                        <div className="hero__right-block hero__right-block--2">
                            <img
                                src={leraUnactive}
                                alt=""
                                loading="lazy"
                                className="hero__right-block-img hero__right-block-img--default"
                                onMouseEnter={() => setIsRightCardHovered(true)}
                                onMouseLeave={() => setIsRightCardHovered(false)}
                            />
                            <img src={leraActive} alt="" loading="lazy" className="hero__right-block-img hero__right-block-img--hover" />
                        </div>
                    </div>

                <img src={arrowIcon} alt="arrow" className="hero__arrow"/>
            </div>
        </section>
    )
}

export default Hero;