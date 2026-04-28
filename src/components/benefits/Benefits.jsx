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
    const currentIndexRef = useRef(0);
    const scrollTimeoutRef = useRef(null);

    const getCards = () => {
        const viewport = viewportRef.current;
        if (!viewport) return [];
        return Array.from(viewport.querySelectorAll('.benefits__card'));
    };

    const scrollToCard = (index, behavior = 'smooth') => {
        const viewport = viewportRef.current;
        const cards = getCards();
        if (!viewport || cards.length === 0) return;

        let nextIndex = index;
        if (nextIndex < 0) nextIndex = 0;
        if (nextIndex >= cards.length) nextIndex = cards.length - 1;

        const targetCard = cards[nextIndex];
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

        currentIndexRef.current = nextIndex;
    };

    const updateIndexFromScroll = () => {
        const viewport = viewportRef.current;
        const cards = getCards();
        if (!viewport || cards.length === 0) return;

        const viewportLeft = viewport.getBoundingClientRect().left;
        let bestIndex = 0;
        let minDistance = Infinity;

        cards.forEach((card, idx) => {
            const cardLeft = card.getBoundingClientRect().left;
            const distance = Math.abs(cardLeft - viewportLeft);
            if (distance < minDistance) {
                minDistance = distance;
                bestIndex = idx;
            }
        });

        currentIndexRef.current = bestIndex;
    };

    const getCurrentIndexFromViewport = () => {
        const viewport = viewportRef.current;
        const cards = getCards();
        if (!viewport || cards.length === 0) return 0;

        const viewportLeft = viewport.getBoundingClientRect().left;
        let bestIndex = 0;
        let minDistance = Infinity;

        cards.forEach((card, idx) => {
            const cardLeft = card.getBoundingClientRect().left;
            const distance = Math.abs(cardLeft - viewportLeft);
            if (distance < minDistance) {
                minDistance = distance;
                bestIndex = idx;
            }
        });

        currentIndexRef.current = bestIndex;
        return bestIndex;
    };

    const goNext = () => {
        const cards = getCards();
        const totalCards = cards.length;
        const maxIndex = Math.max(0, totalCards - 1);
        const currentIndex = getCurrentIndexFromViewport();
        let nextIdx = currentIndex + 1;
        if (nextIdx >= totalCards) {
            nextIdx = maxIndex;
            if (currentIndex === maxIndex) return;
        }
        scrollToCard(nextIdx);
    };

    const goPrev = () => {
        const cards = getCards();
        const maxIndex = Math.max(0, cards.length - 1);
        const currentIndex = getCurrentIndexFromViewport();
        if (currentIndex > maxIndex) {
            currentIndexRef.current = maxIndex;
        }
        let prevIdx = currentIndexRef.current - 1;
        if (prevIdx < 0) {
            prevIdx = 0;
            if (currentIndexRef.current === 0) return;
        }
        scrollToCard(prevIdx);
    };

    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;

        const onScrollHandler = () => {
            if (scrollTimeoutRef.current) {
                window.clearTimeout(scrollTimeoutRef.current);
            }
            scrollTimeoutRef.current = window.setTimeout(() => {
                updateIndexFromScroll();
            }, 20);
        };

        const onResize = () => {
            window.setTimeout(() => {
                updateIndexFromScroll();
                const cards = getCards();
                if (cards[currentIndexRef.current]) {
                    const viewportLeft = viewport.getBoundingClientRect().left;
                    const cardLeft = cards[currentIndexRef.current].getBoundingClientRect().left;
                    if (Math.abs(cardLeft - viewportLeft) > 5) {
                        scrollToCard(currentIndexRef.current);
                    }
                }
            }, 80);
        };

        const onKeyDown = (e) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                goPrev();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                goNext();
            }
        };

        viewport.addEventListener('scroll', onScrollHandler);
        window.addEventListener('resize', onResize);
        window.addEventListener('keydown', onKeyDown);

        viewport.scrollLeft = 0;
        window.setTimeout(() => {
            const cards = getCards();
            if (cards.length > 0) {
                const firstCard = cards[0];
                const viewportRect = viewport.getBoundingClientRect();
                const firstCardRect = firstCard.getBoundingClientRect();
                if (Math.abs(firstCardRect.left - viewportRect.left) > 2) {
                    scrollToCard(0, 'auto');
                } else {
                    currentIndexRef.current = 0;
                }
            }
        }, 10);

        return () => {
            viewport.removeEventListener('scroll', onScrollHandler);
            window.removeEventListener('resize', onResize);
            window.removeEventListener('keydown', onKeyDown);
            if (scrollTimeoutRef.current) {
                window.clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            const viewport = viewportRef.current;
            const cards = getCards();
            if (!viewport || cards.length === 0) return;

            const maxScrollableLeft = viewport.scrollWidth - viewport.clientWidth;
            const isAtEnd = viewport.scrollLeft >= maxScrollableLeft - 2;
            if (isAtEnd) {
                scrollToCard(0);
                return;
            }

            const currentIndex = getCurrentIndexFromViewport();
            const maxIndex = Math.max(0, cards.length - 1);
            const nextIndex = currentIndex >= maxIndex ? 0 : currentIndex + 1;

            scrollToCard(nextIndex);
        }, 30000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, []);

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
                            aria-label="Прокрутить влево"
                        >
                            <i className="benefits__arrow benefits__arrow--left"></i>
                        </button>
                        <button
                            type="button"
                            className="benefits__arrowBtn"
                            onClick={goNext}
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