import React, { useState, useCallback, useEffect, useRef } from "react";
import "./projects.css";
import GameChebImg from "../../assets/other/GameCheb.png";

const Projects = () => {
    const [activeCard, setActiveCard] = useState(1);
    const [isAnimating, setIsAnimating] = useState(false);
    const [expandedCards, setExpandedCards] = useState([1]);
    const [isMobile, setIsMobile] = useState(false);
    const [containerHeight, setContainerHeight] = useState("800px");
    const cardsWrapperRef = useRef(null);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 950);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (!isMobile && cardsWrapperRef.current) {
            const updateHeight = () => {
                const cards = cardsWrapperRef.current.querySelectorAll('.card');
                let maxBottom = 0;

                cards.forEach(card => {
                    const rect = card.getBoundingClientRect();
                    const relativeBottom = rect.top - cardsWrapperRef.current.getBoundingClientRect().top + rect.height;
                    maxBottom = Math.max(maxBottom, relativeBottom);
                });

                const newHeight = maxBottom + 100;
                setContainerHeight(`${newHeight}px`);
            };

            const observer = new MutationObserver(updateHeight);
            observer.observe(cardsWrapperRef.current, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style']
            });

            setTimeout(updateHeight, 100);

            return () => observer.disconnect();
        } else {
            setContainerHeight("auto");
        }
    }, [activeCard, isMobile]);

    const handleCardClick = useCallback((cardNumber) => {
        if (isMobile) {
            if (expandedCards.includes(cardNumber)) {
                if (expandedCards.length > 1) {
                    setExpandedCards(prev => prev.filter(id => id !== cardNumber));
                }
            } else {
                setExpandedCards(prev => [...prev, cardNumber]);
                setTimeout(() => {
                    const element = document.querySelector(`.card:nth-child(${cardNumber})`);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 10);
            }
            return;
        }

        if (cardNumber === activeCard || isAnimating) return;

        setIsAnimating(true);
        setActiveCard(cardNumber);

        setTimeout(() => {
            setIsAnimating(false);
        }, 500);
    }, [activeCard, isAnimating, isMobile, expandedCards]);

    const getCardPosition = useCallback((cardNumber) => {
        if (isMobile) return {};

        const positions = {
            first: { left: '0', top: '0', zIndex: 30 },
            second: { left: 'calc(100% - 877px)', top: '150px', zIndex: 20 },
            third: { left: 'calc(50% - 438.5px)', top: '300px', zIndex: 10 }
        };

        if (cardNumber === activeCard) return positions.first;

        const allCards = [1, 2, 3];
        const otherCards = allCards.filter(num => num !== activeCard).sort((a, b) => a - b);
        const finalOrder = [activeCard, ...otherCards];
        const cardIndex = finalOrder.indexOf(cardNumber);

        return cardIndex === 1 ? positions.second : positions.third;
    }, [activeCard, isMobile]);

    const isCardExpanded = useCallback((cardNumber) => {
        return expandedCards.includes(cardNumber);
    }, [expandedCards]);

    const getProjectTitle = useCallback((cardNumber) => {
        const titles = {
            1: "GameCheb",
            2: "Singularity Resume",
            3: "VR-музей"
        };
        return titles[cardNumber];
    }, []);

    const shouldTruncateText = useCallback((cardNumber) => {
        if (isMobile) {
            return !isCardExpanded(cardNumber);
        }
        return cardNumber !== activeCard;
    }, [isMobile, isCardExpanded, activeCard]);

    return (
        <section className="projects" style={{ minHeight: containerHeight }}>
            <div className="projects__wrapper">
                <h2 className="projects__title">Лучшие проекты наших студентов</h2>

                <div className="projects__cardsWrapper" ref={cardsWrapperRef}>
                    <div
                        className={`card card--gamecheb ${activeCard === 1 ? 'card__active' : ''} ${isMobile && isCardExpanded(1) ? 'card__expanded' : ''}`}
                        onClick={() => handleCardClick(1)}
                        style={{
                            cursor: isAnimating ? 'default' : 'pointer',
                            ...getCardPosition(1),
                            ...(isMobile && {
                                height: isCardExpanded(1) ? 'auto' : '90px',
                                minHeight: isCardExpanded(1) ? '700px' : '90px'
                            })
                        }}
                    >
                        <div className={`card__overlay ${activeCard === 1 ? 'card__overlay--active' : ''}`}></div>
                        <div className="card__content">
                            <div className="card__header">
                                {isMobile && !isCardExpanded(1) && (
                                    <div className="card__dots">
                                        <span className="card__dot"></span>
                                        <span className="card__dot"></span>
                                        <span className="card__dot"></span>
                                    </div>
                                )}

                                {(!isMobile || isCardExpanded(1)) && (
                                    <h3 className="card__title">{getProjectTitle(1)}</h3>
                                )}
                            </div>

                            {(!isMobile || isCardExpanded(1)) && (
                                <>
                                    <p className="card__description">
                                        Это туристический сервис нового поколения для регионов России, где прогулки по городам превращаются в увлекательное приключение.
                                    </p>

                                    <div className="card__tags">
                                        <span className="card__tag">Культура</span>
                                        <span className="card__tag">Бизнес</span>
                                        <span className="card__tag">IT</span>
                                    </div>

                                    <div className="card__details">
                                        <div className={`card__text ${shouldTruncateText(1) ? 'card__text--truncated' : ''}`}>
                                            <div className="card__text-content">
                                                Мы создаем сервис с интерактивными маршрутами и голосовым гидом, который помогает исследовать города России. С телефоном и наушниками ты открываешь как популярные, так и малоизвестные места, а гид рассказывает всё, что интересно в путешествии.
                                                <br /><br />
                                                Наша миссия — сохранить чувашскую культуру в настоящем через современный бизнес и туризм.
                                            </div>
                                            {shouldTruncateText(1) && <span className="card__text-more">Подробнее</span>}
                                        </div>
                                        <div className="card__image">
                                            <img src={GameChebImg} alt="GameCheb проект" />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div
                        className={`card card--resume ${activeCard === 2 ? 'card__active' : ''} ${isMobile && isCardExpanded(2) ? 'card__expanded' : ''}`}
                        onClick={() => handleCardClick(2)}
                        style={{
                            cursor: isAnimating ? 'default' : 'pointer',
                            ...getCardPosition(2),
                            ...(isMobile && {
                                height: isCardExpanded(2) ? 'auto' : '90px',
                                minHeight: isCardExpanded(2) ? '700px' : '90px'
                            })
                        }}
                    >
                        <div className={`card__overlay ${activeCard === 2 ? 'card__overlay--active' : ''}`}></div>
                        <div className="card__content">
                            <div className="card__header">
                                {isMobile && !isCardExpanded(2) && (
                                    <div className="card__dots">
                                        <span className="card__dot"></span>
                                        <span className="card__dot"></span>
                                        <span className="card__dot"></span>
                                    </div>
                                )}

                                {(!isMobile || isCardExpanded(2)) && (
                                    <h3 className="card__title">{getProjectTitle(2)}</h3>
                                )}
                            </div>

                            {(!isMobile || isCardExpanded(2)) && (
                                <>
                                    <p className="card__description">
                                        Этот сайт создавали студенты нашего колледжа. Начиная с идеи, продолжая дизайном, и заканчивая разработкой.
                                    </p>

                                    <div className="card__tags">
                                        <span className="card__tag">Python</span>
                                        <span className="card__tag">JavaScript</span>
                                        <span className="card__tag">React</span>
                                        <span className="card__tag">Figma</span>
                                        <span className="card__tag">PSQL</span>
                                    </div>

                                    <div className="card__details">
                                        <div className={`card__text ${shouldTruncateText(2) ? 'card__text--truncated' : ''}`}>
                                            <div className="card__text-content">
                                                Платформа-каталог резюме студентов IT-колледжа Singularity: работодатели могут быстро просматривать карточки, фильтровать по стеку и направлению, открывать унифицированные резюме и отправлять заявки на стажировку.
                                                <br/><br/>
                                                Задача проекта — минимизировать время поиска кандидата и упростить коммуникацию между работодателем, куратором и студентом.
                                            </div>
                                            {shouldTruncateText(2) && <span className="card__text-more">Подробнее</span>}
                                        </div>
                                        <div className="card__image">
                                            <img src={GameChebImg} alt="Singularity Resume проект" />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div
                        className={`card card--vr ${activeCard === 3 ? 'card__active' : ''} ${isMobile && isCardExpanded(3) ? 'card__expanded' : ''}`}
                        onClick={() => handleCardClick(3)}
                        style={{
                            cursor: isAnimating ? 'default' : 'pointer',
                            ...getCardPosition(3),
                            ...(isMobile && {
                                height: isCardExpanded(3) ? 'auto' : '90px',
                                minHeight: isCardExpanded(3) ? '700px' : '90px'
                            })
                        }}
                    >
                        <div className={`card__overlay ${activeCard === 3 ? 'card__overlay--active' : ''}`}></div>
                        <div className="card__content">
                            <div className="card__header">
                                {isMobile && !isCardExpanded(3) && (
                                    <div className="card__dots">
                                        <span className="card__dot"></span>
                                        <span className="card__dot"></span>
                                        <span className="card__dot"></span>
                                    </div>
                                )}

                                {(!isMobile || isCardExpanded(3)) && (
                                    <h3 className="card__title">{getProjectTitle(3)}</h3>
                                )}
                            </div>

                            {(!isMobile || isCardExpanded(3)) && (
                                <>
                                    <p className="card__description">
                                        Этот сайт создавали студенты нашего колледжа. Начиная с идеи, продолжая дизайном, и заканчивая разработкой.
                                    </p>

                                    <div className="card__tags">
                                        <span className="card__tag">Unreal Engine 5</span>
                                        <span className="card__tag">Виртуальная реальность</span>
                                        <span className="card__tag">C++</span>
                                    </div>

                                    <div className="card__details">
                                        <div className={`card__text ${shouldTruncateText(3) ? 'card__text--truncated' : ''}`}>
                                            <div className="card__text-content">
                                                VR-музей — это современный образовательный инструмент, делающий изучение искусства и истории увлекательным.
                                                <br/><br/>
                                                Виртуальная реальность позволяет рассматривать эпохи и культуру, а также проживать события внутри картин. Такой формат сочетает обучение, интерактив и практику, усиливает интерес и понимание материала.
                                            </div>
                                            {shouldTruncateText(3) && <span className="card__text-more">Подробнее</span>}
                                        </div>
                                        <div className="card__image">
                                            <img src={GameChebImg} alt="VR-музей проект" />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Projects;