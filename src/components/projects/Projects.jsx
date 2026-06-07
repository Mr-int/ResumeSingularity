import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { useProjectModal } from "../../context/ProjectModalContext.jsx";
import "./projects.css";
import { ProjectBodyText } from "./ProjectBodyText.jsx";
import { requestLogin } from "../../services/authApi.js";

const Projects = ({ projects: projectsProp = [], guestVitrina = false }) => {
    const { openProject } = useProjectModal();
    const [activeCard, setActiveCard] = useState(1);
    const [isAnimating, setIsAnimating] = useState(false);
    const [expandedCards, setExpandedCards] = useState([1]);
    const [isMobile, setIsMobile] = useState(false);
    const [containerHeight, setContainerHeight] = useState("800px");
    const cardsWrapperRef = useRef(null);

    const projects = Array.isArray(projectsProp) ? projectsProp : [];
    const cardCount = projects.length;

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
        }
        setContainerHeight("auto");
    }, [activeCard, isMobile, cardCount]);

    const handleCardClick = useCallback((cardNumber) => {
        if (isMobile) {
            if (expandedCards.includes(cardNumber)) {
                setExpandedCards((prev) => prev.filter((id) => id !== cardNumber));
            } else {
                setExpandedCards([cardNumber]);
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

        const allCards = projects.map((_, i) => i + 1);
        const otherCards = allCards.filter(num => num !== activeCard).sort((a, b) => a - b);
        const finalOrder = [activeCard, ...otherCards];
        const cardIndex = finalOrder.indexOf(cardNumber);

        return cardIndex === 1 ? positions.second : positions.third;
    }, [activeCard, isMobile, projects]);

    const isCardExpanded = useCallback((cardNumber) => {
        return expandedCards.includes(cardNumber);
    }, [expandedCards]);

    const cards = useMemo(
        () =>
            projects.map((project, index) => {
                const cardNumber = index + 1;
                const theme = project.theme;
                return (
                    <div
                        key={project.id}
                        className={`card card--${theme} ${activeCard === cardNumber ? 'card__active' : ''} ${isMobile && isCardExpanded(cardNumber) ? 'card__expanded' : ''}`}
                        onClick={() => handleCardClick(cardNumber)}
                        style={{
                            cursor: isAnimating ? 'default' : 'pointer',
                            ...getCardPosition(cardNumber),
                            ...(isMobile && {
                                height: isCardExpanded(cardNumber) ? 'auto' : '47px',
                                minHeight: isCardExpanded(cardNumber) ? '700px' : '47px'
                            })
                        }}
                    >
                        <div className={`card__overlay ${activeCard === cardNumber ? 'card__overlay--active' : ''}`}></div>
                        <div className="card__content">
                            <div className="card__header">
                                {isMobile && !isCardExpanded(cardNumber) && (
                                    <div className="card__dots">
                                        <span className="card__dot"></span>
                                        <span className="card__dot"></span>
                                        <span className="card__dot"></span>
                                    </div>
                                )}

                                {(!isMobile || isCardExpanded(cardNumber)) && (
                                    <div className="card__headerMain">
                                        {project.section ? (
                                            <span className="card__section">{project.section}</span>
                                        ) : null}
                                        <h3 className="card__title">{project.title}</h3>
                                    </div>
                                )}
                            </div>

                            {isMobile && !isCardExpanded(cardNumber) && (
                                <div className="card__mobileTitle">{project.title}</div>
                            )}

                            {isMobile && !isCardExpanded(cardNumber) && (
                                <div className="card__open-hint">
                                    <span className="card__open-text">открыть</span>
                                    <span className="card__open-arrow" aria-hidden>▼</span>
                                </div>
                            )}

                            {(!isMobile || isCardExpanded(cardNumber)) && (
                                <>
                                    {project.summary ? (
                                        <p className="card__description">{project.summary}</p>
                                    ) : null}

                                    {project.tags?.length > 0 && (
                                        <div className="card__tags">
                                            {project.tags.map((tag) => (
                                                <span key={tag} className="card__tag">{tag}</span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="card__details">
                                        <div className="card__text">
                                            <div className="card__text-content">
                                                <ProjectBodyText text={project.body} />
                                            </div>
                                        </div>
                                        {project.imageSrc ? (
                                            <div className="card__image">
                                                <img src={project.imageSrc} alt="" loading="lazy" />
                                            </div>
                                        ) : null}
                                    </div>

                                    <button
                                        type="button"
                                        className="card__moreLink"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (guestVitrina) {
                                                requestLogin();
                                                return;
                                            }
                                            openProject(project.id);
                                        }}
                                    >
                                        Подробнее →
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                );
            }),
        [projects, activeCard, isMobile, isAnimating, expandedCards, getCardPosition, isCardExpanded, handleCardClick, openProject, guestVitrina],
    );

    if (cardCount === 0) {
        return null;
    }

    return (
        <section id="projects" className="projects" style={{ minHeight: containerHeight }}>
            <div className="projects__wrapper">
                <div className="projects__head">
                    <h2 className="projects__title">Лучшие проекты наших студентов</h2>
                    <p className="projects__more">
                        {guestVitrina ? (
                            <button type="button" className="projects__moreLinkBtn" onClick={requestLogin}>
                                Все проекты →
                            </button>
                        ) : (
                            <Link to="/projects">Все проекты →</Link>
                        )}
                    </p>
                </div>

                <div className="projects__cardsWrapper" ref={cardsWrapperRef}>
                    {cards}
                </div>
            </div>
        </section>
    )
}

export default Projects;
