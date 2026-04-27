import React, { useEffect, useRef, useState } from 'react';
import "./benefits.css";
import gradientArrow from "../../assets/other/gradientArrow.svg";
import purpleSign from "../../assets/other/purpleSign.png";
import greenCube from "../../assets/other/greenCube.png";
import orangeCube from "../../assets/other/orangeCube.png";
import blueSwitch from "../../assets/other/blueSwitch.png";

const Benefits = () => {
    const viewportRef = useRef(null);
    const [activeCardIndex, setActiveCardIndex] = useState(0);
    const totalCards = 4;

    const getCards = () => {
        const viewport = viewportRef.current;
        if (!viewport) return [];
        return Array.from(viewport.querySelectorAll('.benefits__card'));
    };

    const scrollToCard = (index, behavior = 'smooth') => {
        const viewport = viewportRef.current;
        const cards = getCards();
        if (!viewport || cards.length === 0) return;

        const normalizedIndex = Math.max(0, Math.min(index, cards.length - 1));
        const targetCard = cards[normalizedIndex];
        if (!targetCard) return;

        const viewportLeftEdge = viewport.getBoundingClientRect().left;
        const cardLeftEdge = targetCard.getBoundingClientRect().left;
        const currentScroll = viewport.scrollLeft;
        const diffToViewport = cardLeftEdge - viewportLeftEdge;
        const newScrollLeft = currentScroll + diffToViewport;

        viewport.scrollTo({
            left: newScrollLeft,
            behavior
        });
    };

    useEffect(() => {
        scrollToCard(activeCardIndex, 'smooth');
    }, [activeCardIndex]);

    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;

        const updateIndexFromScroll = () => {
            const cards = getCards();
            if (cards.length === 0) return;

            const viewportLeft = viewport.getBoundingClientRect().left;
            let nearestIndex = 0;
            let minDistance = Number.POSITIVE_INFINITY;

            cards.forEach((card, idx) => {
                const cardLeft = card.getBoundingClientRect().left;
                const distance = Math.abs(cardLeft - viewportLeft);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestIndex = idx;
                }
            });

            setActiveCardIndex((prev) => (prev === nearestIndex ? prev : nearestIndex));
        };

        let scrollTimeout;
        const onScroll = () => {
            if (scrollTimeout) window.clearTimeout(scrollTimeout);
            scrollTimeout = window.setTimeout(updateIndexFromScroll, 20);
        };

        const onResize = () => {
            window.setTimeout(() => {
                updateIndexFromScroll();
                scrollToCard(activeCardIndex, 'smooth');
            }, 80);
        };

        viewport.addEventListener('scroll', onScroll);
        window.addEventListener('resize', onResize);

        // Ensure first card starts from the viewport left edge.
        window.setTimeout(() => scrollToCard(activeCardIndex, 'auto'), 10);

        return () => {
            viewport.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onResize);
            if (scrollTimeout) window.clearTimeout(scrollTimeout);
        };
    }, [activeCardIndex]);

    const goNext = () => {
        setActiveCardIndex((prev) => Math.min(prev + 1, totalCards - 1));
    };

    const goPrev = () => {
        setActiveCardIndex((prev) => Math.max(prev - 1, 0));
    };

    const isPrevDisabled = activeCardIndex === 0;
    const isNextDisabled = activeCardIndex === totalCards - 1;

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
                            onClick={goPrev}
                            disabled={isPrevDisabled}
                            aria-label="Прокрутить влево"
                        >
                            <i className="benefits__arrow benefits__arrow--left"></i>
                        </button>
                        <button
                            type="button"
                            className="benefits__arrowBtn"
                            onClick={goNext}
                            disabled={isNextDisabled}
                            aria-label="Прокрутить вправо"
                        >
                            <i className="benefits__arrow benefits__arrow--right"></i>
                        </button>
                    </div>
                </div>

                <div className="benefits__cards" ref={viewportRef}>
                    <div className="benefits__cardsTrack">
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
        </div>
    )
}

export default Benefits;