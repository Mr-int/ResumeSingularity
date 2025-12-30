import React from "react";
import "./banner.css";
import searchIcon from "../../assets/icons/searchIcon.svg";
import bannerImg from "../../assets/other/bannerImg.png";
import { Link } from "react-router-dom";

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
                        <Link to="/students" className="banner__link">
                            <button className="banner__button">
                                <span>Найти стажёра</span>
                                <img src={searchIcon} alt="Поиск"/>
                            </button>
                        </Link>
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