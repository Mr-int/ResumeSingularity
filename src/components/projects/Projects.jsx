import React, { useState, useCallback, useEffect } from "react";
import "./projects.css";
import GameChebImg from "../../assets/other/GameCheb.png";

const Projects = () => {
    const [activeCard, setActiveCard] = useState(1);
    const [isAnimating, setIsAnimating] = useState(false);
    const [expandedCards, setExpandedCards] = useState([1]); // По умолчанию первый карточка развернута
    const [isMobile, setIsMobile] = useState(false);

    // Определяем мобильное устройство
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleCardClick = useCallback((cardNumber) => {
        // Если это мобильная версия
        if (isMobile) {
            if (expandedCards.includes(cardNumber)) {
                // Проверяем, что не пытаемся свернуть последнюю развернутую карточку
                if (expandedCards.length > 1) {
                    setExpandedCards(prev => prev.filter(id => id !== cardNumber));
                }
            } else {
                // Разворачиваем карточку
                setExpandedCards(prev => [...prev, cardNumber]);
                // Прокручиваем к карточке
                setTimeout(() => {
                    const element = document.querySelector(`.card:nth-child(${cardNumber})`);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 10);
            }
            return;
        }

        // Оригинальная логика для десктопа
        if (cardNumber === activeCard || isAnimating) return;

        setIsAnimating(true);
        setActiveCard(cardNumber);

        setTimeout(() => {
            setIsAnimating(false);
        }, 500);
    }, [activeCard, isAnimating, isMobile, expandedCards]);

    const getCardPosition = useCallback((cardNumber) => {
        // Для мобильных позиционирование не нужно
        if (isMobile) return {};

        const positions = {
            first: { transform: 'translate(0, 0)', zIndex: 30 },
            second: { transform: 'translate(35vw, 320px)', zIndex: 20 },
            third: { transform: 'translate(17.5vw, 600px)', zIndex: 10 }
        };

        if (cardNumber === activeCard) return positions.first;

        const allCards = [1, 2, 3];
        const otherCards = allCards.filter(num => num !== activeCard).sort((a, b) => a - b);
        const finalOrder = [activeCard, ...otherCards];
        const cardIndex = finalOrder.indexOf(cardNumber);

        return cardIndex === 1 ? positions.second : positions.third;
    }, [activeCard, isMobile]);

    // Проверяем, развернута ли карточка (для мобильных)
    const isCardExpanded = useCallback((cardNumber) => {
        return expandedCards.includes(cardNumber);
    }, [expandedCards]);

    // Получаем название проекта для использования в десктопной версии
    const getProjectTitle = useCallback((cardNumber) => {
        const titles = {
            1: "GameCheb",
            2: "Singularity Resume",
            3: "VR-музей"
        };
        return titles[cardNumber];
    }, []);

    return (
        <section className="projects">
            <div className="projects__wrapper">
                <h2 className="projects__title">Лучшие проекты наших студентов</h2>

                <div className="projects__cardsWrapper">
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
                                {/* Точки для мобильной версии (свернутое состояние) */}
                                {isMobile && !isCardExpanded(1) && (
                                    <div className="card__dots">
                                        <span className="card__dot"></span>
                                        <span className="card__dot"></span>
                                        <span className="card__dot"></span>
                                    </div>
                                )}

                                {/* Заголовок показываем только для десктопа и в развернутом состоянии на мобильных */}
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
                                        <div className="card__text">
                                            Мы создаем сервис с интерактивными маршрутами и голосовым гидом, который помогает исследовать города России. С телефоном и наушниками ты открываешь как популярные, так и малоизвестные места, а гид рассказывает всё, что интересно в путешествии.
                                            <br /><br />
                                            Наша миссия — сохранить чувашскую культуру в настоящем через современный бизнес и туризм.
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
                                {/* Точки для мобильной версии (свернутое состояние) */}
                                {isMobile && !isCardExpanded(2) && (
                                    <div className="card__dots">
                                        <span className="card__dot"></span>
                                        <span className="card__dot"></span>
                                        <span className="card__dot"></span>
                                    </div>
                                )}

                                {/* Заголовок показываем только для десктопа и в развернутом состоянии на мобильных */}
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
                                        <div className="card__text">
                                            Платформа-каталог резюме студентов IT-колледжа Singularity: работодатели могут быстро просматривать карточки, фильтровать по стеку и направлению, открывать унифицированные резюме и отправлять заявки на стажировку.
                                            <br/><br/>
                                            Задача проекта — минимизировать время поиска кандидата и упростить коммуникацию между работодателем, куратором и студентом.
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
                                {/* Точки для мобильной версии (свернутое состояние) */}
                                {isMobile && !isCardExpanded(3) && (
                                    <div className="card__dots">
                                        <span className="card__dot"></span>
                                        <span className="card__dot"></span>
                                        <span className="card__dot"></span>
                                    </div>
                                )}

                                {/* Заголовок показываем только для десктопа и в развернутом состоянии на мобильных */}
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
                                        <div className="card__text">
                                            VR-музей — это современный образовательный инструмент, делающий изучение искусства и истории увлекательным.
                                            <br/><br/>
                                            Виртуальная реальность позволяет рассматривать эпохи и культуру, а также проживать события внутри картин. Такой формат сочетает обучение, интерактив и практику, усиливает интерес и понимание материала.
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