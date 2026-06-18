import React, { useEffect, useState } from "react";
import "./banner.css";
import searchIcon from "../../assets/icons/searchIcon.svg";
import bannerImg from "../../assets/other/bannerImg.png";
import GradientButton from "../common/gradientButton/GradientButton.jsx";
import { AUTH_CHANGED_EVENT, isStudentRole } from "../../services/authApi.js";

const Banner = () => {
    const [isStudent, setIsStudent] = useState(() => isStudentRole());

    useEffect(() => {
        const syncStudentRole = () => setIsStudent(isStudentRole());
        syncStudentRole();
        window.addEventListener(AUTH_CHANGED_EVENT, syncStudentRole);
        return () => window.removeEventListener(AUTH_CHANGED_EVENT, syncStudentRole);
    }, []);

    return (
        <article className="banner">
            <div className="banner__wrapper">
                <div className="banner__content">
                    <div className="banner__left">
                        <h2 className="banner__title">
                            Свободные стажёры<br className="banner__br" /> готовы начать
                            <span className="banner__titleDot" aria-hidden="true"></span>
                        </h2>
                        <p className="banner__text">
                            Отберите кандидатов по стеку и проектному опыту — удобно и быстро за счёт поиска и фильтрации.
                        </p>
                        <GradientButton
                            as="link"
                            to="/students"
                            className="banner__button"
                            icon={<img src={searchIcon} alt="Поиск" />}
                        >
                            {isStudent ? 'Студенты' : 'Найти стажёра'}
                        </GradientButton>
                    </div>

                    <div className="banner__imageWrapper">
                        <img src={bannerImg} alt="Иллюстрация" className="banner__img" />
                    </div>
                </div>
            </div>
        </article>
    )
}

export default Banner;