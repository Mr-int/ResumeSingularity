import './hero.css';
import studentsHero from "../../assets/other/Students.png"
import MobileStudentsHero from "../../assets/other/mobileStudents.png"
import searchIcon from '../../assets/icons/searchIcon.svg'
import arrowIcon from "../../assets/icons/arrow.svg";
import { useEffect, useState } from 'react';

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

                    <button className="hero__button">
                        Найти стажёра
                        <img src={searchIcon} alt="search" className="button__icon" />
                    </button>
                </div>

                {isMobile ? (
                    <div className="hero__image-container">
                        <img
                            src={MobileStudentsHero}
                            alt="student"
                            className="hero__mobile-image"
                        />
                    </div>
                ) : (
                    <img
                        src={studentsHero}
                        alt="student"
                        className="hero__right-content"
                    />
                )}
                <img src={arrowIcon} alt="arrow" className="hero__arrow"/>
            </div>
        </section>
    )
}

export default Hero;