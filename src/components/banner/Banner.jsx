import React from "react";
import "./banner.css";
import searchIcon from "../../assets/icons/searchIcon.svg";
import bannerImg from "../../assets/other/bannerImg.png";
import GradientButton from "../common/gradientButton/GradientButton.jsx";
import { hasApprovedCatalogAccess, isStudentRole, requestLogin } from "../../services/authApi.js";

const Banner = () => {
    const catalogAccess = hasApprovedCatalogAccess();
    const isStudent = isStudentRole();
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
                            as={isStudent || catalogAccess ? 'link' : 'button'}
                            to={isStudent ? '/settings' : catalogAccess ? '/students' : undefined}
                            type="button"
                            className="banner__button"
                            onClick={isStudent || catalogAccess ? undefined : requestLogin}
                            icon={<img src={searchIcon} alt="Поиск" />}
                        >
                            {isStudent ? 'Мой профиль' : 'Найти стажёра'}
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