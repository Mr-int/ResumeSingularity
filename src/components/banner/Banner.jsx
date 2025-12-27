import React from "react";
import "./banner.css";
import searchIcon from "../../assets/icons/searchIcon.svg";
import bannerImg from "../../assets/other/bannerImg.png";

const Banner = () => {
    return (
        <article className="banner">
            <div className="banner__wrapper">
                <div className="banner__content">
                    <div className="banner__left">
                        <h2 className="banner__title">
                            Свободные стажёры<br className="banner__br" /> готовы начать
                        </h2>
                        <p className="banner__text">
                            Отберите кандидатов по стеку и проектному опыту — удобно и быстро за счёт поиска и фильтрации.
                        </p>
                        <button className="banner__button">
                            <span>Найти стажёра</span>
                            <img src={searchIcon} alt="Поиск"/>
                        </button>
                    </div>

                    <img src={bannerImg} alt="Иллюстрация" className="banner__img" />
                </div>
            </div>
        </article>
    )
}

export default Banner;