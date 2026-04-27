import React, { useRef } from 'react';
import "./benefits.css";
import gradientArrow from "../../assets/other/gradientArrow.svg";
import purpleSign from "../../assets/other/purpleSign.png";
import greenCube from "../../assets/other/greenCube.png";
import orangeCube from "../../assets/other/orangeCube.png";
import blueSwitch from "../../assets/other/blueSwitch.png";

const Benefits = () => {
    const cardsRef = useRef(null);

    const scrollCards = (direction) => {
        const container = cardsRef.current;
        if (!container) return;

        const cards = Array.from(container.querySelectorAll('.benefits__card'));
        if (cards.length === 0) return;

        const currentScrollLeft = container.scrollLeft;
        let nearestIndex = 0;
        let nearestDistance = Number.POSITIVE_INFINITY;

        cards.forEach((card, index) => {
            const distance = Math.abs(card.offsetLeft - currentScrollLeft);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestIndex = index;
            }
        });

        const nextIndex = (nearestIndex + direction + cards.length) % cards.length;
        const targetCard = cards[nextIndex];

        container.scrollTo({
            left: targetCard.offsetLeft,
            behavior: 'smooth'
        });
    };

    return (
        <div className="benefits">
            <div className="benefits__wrapper">
                <div className="benefits__titleRow">
                    <h2 className="benefits__title">Обучение в
                        <a href="https://singularity.academy/college" target="_blank" rel="noopener noreferrer" className="gradient-text benefits__singularity-link">Singularity</a>
                        <span className="gradient-circle">
                            <img src={gradientArrow} alt=""/>
                        </span>
                    </h2>

                    <div className="benefits__navButtons" aria-label="Навигация по карточкам преимуществ">
                        <button
                            type="button"
                            className="benefits__arrowBtn"
                            onClick={() => scrollCards(-1)}
                            aria-label="Прокрутить влево"
                        >
                            <i className="benefits__arrow benefits__arrow--left"></i>
                        </button>
                        <button
                            type="button"
                            className="benefits__arrowBtn"
                            onClick={() => scrollCards(1)}
                            aria-label="Прокрутить вправо"
                        >
                            <i className="benefits__arrow benefits__arrow--right"></i>
                        </button>
                    </div>
                </div>

                <div className="benefits__cards" ref={cardsRef}>
                    <div className="benefits__card benefits__card__purple">
                        <h2 className="benefits__card-title">Погружение <br/> в профессиональную среду</h2>
                        <span>С первого дня студенты работают в реальных условиях, решают задачи, как на стажировке или работе в IT-компании.</span>
                        <img src={purpleSign} alt="" className="benefits__card__img" width="300px" height="300px"/>
                    </div>

                    <div className="benefits__card benefits__card__green">
                        <h2 className="benefits__card-title">Софт-скиллы <br/> — это основа обучения</h2>
                        <span>Обратная связь, саморефлексия, работа в команде и навыки презентации — софты у нас не дополнительно, а наравне с хардами.</span>
                        <img src={greenCube} alt="" className="benefits__card__img" width="300px" height="300px"/>
                    </div>

                    <div className="benefits__card benefits__card__blue">
                        <h2 className="benefits__card-title">Самостоятельное <br/> обучение</h2>
                        <span>Никаких ежедневных напоминаний. Мы учим планировать, брать ответственность и доводить до результата — как в реальной жизни</span>
                        <img src={blueSwitch} alt="" className="benefits__card__img" width="300px" height="300px"/>
                    </div>

                    <div className="benefits__card benefits__card__orange">
                        <h2 className="benefits__card-title">Hard-навыки <br/> через практику</h2>
                        <span>Студенты не просто читают теорию — они сразу делают. Подход «учусь через дело» даёт быстро наращивать реальные навыки.</span>
                        <img src={orangeCube} alt="" className="benefits__card__img" width="300px" height="300px"/>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Benefits;