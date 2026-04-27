import React, { useEffect, useRef, useState } from 'react';
import "./benefits.css";
import gradientArrow from "../../assets/other/gradientArrow.svg";
import purpleSign from "../../assets/other/purpleSign.png";
import greenCube from "../../assets/other/greenCube.png";
import orangeCube from "../../assets/other/orangeCube.png";
import blueSwitch from "../../assets/other/blueSwitch.png";

const benefitsCardsData = [
    {
        key: 'purple',
        className: 'benefits__card benefits__card__purple',
        title: <>Погружение <br/> в профессиональную среду</>,
        text: 'С первого дня студенты работают в реальных условиях, решают задачи, как на стажировке или работе в IT-компании.',
        image: purpleSign
    },
    {
        key: 'green',
        className: 'benefits__card benefits__card__green',
        title: <>Софт-скиллы <br/> — это основа обучения</>,
        text: 'Обратная связь, саморефлексия, работа в команде и навыки презентации — софты у нас не дополнительно, а наравне с хардами.',
        image: greenCube
    },
    {
        key: 'blue',
        className: 'benefits__card benefits__card__blue',
        title: <>Самостоятельное <br/> обучение</>,
        text: 'Никаких ежедневных напоминаний. Мы учим планировать, брать ответственность и доводить до результата — как в реальной жизни',
        image: blueSwitch
    },
    {
        key: 'orange',
        className: 'benefits__card benefits__card__orange',
        title: <>Hard-навыки <br/> через практику</>,
        text: 'Студенты не просто читают теорию — они сразу делают. Подход «учусь через дело» даёт быстро наращивать реальные навыки.',
        image: orangeCube
    }
];

const Benefits = () => {
    const viewportRef = useRef(null);
    const isProgrammaticScrollRef = useRef(false);
    const programmaticScrollTimeoutRef = useRef(null);
    const [activeCardIndex, setActiveCardIndex] = useState(0);

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

        if (programmaticScrollTimeoutRef.current) {
            window.clearTimeout(programmaticScrollTimeoutRef.current);
        }
        isProgrammaticScrollRef.current = true;

        viewport.scrollTo({
            left: targetCard.offsetLeft,
            behavior
        });

        // Prevent scroll-handler from overwriting index during smooth animation.
        programmaticScrollTimeoutRef.current = window.setTimeout(() => {
            isProgrammaticScrollRef.current = false;
        }, behavior === 'smooth' ? 420 : 0);
    };

    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;

        const updateIndexFromScroll = () => {
            if (isProgrammaticScrollRef.current) return;

            const cards = getCards();
            if (cards.length === 0) return;

            const scrollLeft = viewport.scrollLeft;
            let nearestIndex = 0;
            let minDistance = Number.POSITIVE_INFINITY;

            cards.forEach((card, idx) => {
                const distance = Math.abs(card.offsetLeft - scrollLeft);
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
            if (programmaticScrollTimeoutRef.current) {
                window.clearTimeout(programmaticScrollTimeoutRef.current);
            }
        };
    }, [activeCardIndex]);

    const goToIndex = (nextIndex) => {
        const totalCards = benefitsCardsData.length;
        const normalizedIndex = Math.max(0, Math.min(nextIndex, totalCards - 1));
        setActiveCardIndex(normalizedIndex);
        scrollToCard(normalizedIndex, 'smooth');
    };

    const goNext = () => {
        const totalCards = benefitsCardsData.length;
        if (totalCards === 0) return;
        goToIndex(activeCardIndex + 1);
    };

    const goPrev = () => {
        goToIndex(activeCardIndex - 1);
    };

    const totalCards = benefitsCardsData.length;
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
                        {benefitsCardsData.map((card) => (
                            <div key={card.key} className={card.className}>
                                <h2 className="benefits__card-title">{card.title}</h2>
                                <span>{card.text}</span>
                                <img src={card.image} alt="" className="benefits__card__img" width="300px" height="300px"/>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Benefits;