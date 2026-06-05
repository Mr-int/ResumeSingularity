import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { useProjectModal } from "../../context/ProjectModalContext.jsx";
import "./projects.css";
import { getProjectsForViewer } from "../../services/projectsApi.js";
import { getProjectCoverUrl, getProjectTheme } from "../../utils/projectUtils.js";
import { ProjectBodyText } from "./ProjectBodyText.jsx";
import GameChebImg from "../../assets/other/GameCheb.png";
import VrImg from "../../assets/other/vrProject.png";
import resumeProjectImg from "../../assets/logos/singularityLogo.svg";

const CARD_THEMES = ['gamecheb', 'resume', 'vr'];
const FALLBACK_IMAGES = [GameChebImg, resumeProjectImg, VrImg];

const STATIC_PROJECTS = [
    {
        id: 'static-1',
        title: 'GameCheb',
        section: 'Игры',
        summary:
            'Это туристический сервис нового поколения для регионов России, где прогулки по городам превращаются в увлекательное приключение.',
        body: 'Мы создаем сервис с интерактивными маршрутами и голосовым гидом, который помогает исследовать города России. С телефоном и наушниками ты открываешь как популярные, так и малоизвестные места, а гид рассказывает всё, что интересно в путешествии.\n\nНаша миссия — сохранить чувашскую культуру в настоящем через современный бизнес и туризм.',
        tags: ['Культура', 'Бизнес', 'IT'],
        imageSrc: GameChebImg,
        theme: 'gamecheb',
    },
    {
        id: 'static-2',
        title: 'Singularity Resume',
        section: 'Веб-разработка',
        summary:
            'Этот сайт создавали студенты нашего колледжа. Начиная с идеи, продолжая дизайном, и заканчивая разработкой.',
        body: 'Платформа-каталог резюме студентов IT-колледжа Singularity: работодатели могут быстро просматривать карточки, фильтровать по стеку и направлению, открывать унифицированные резюме и отправлять заявки на стажировку.\n\nЗадача проекта — минимизировать время поиска кандидата и упростить коммуникацию между работодателем, куратором и студентом.',
        tags: ['Python', 'JavaScript', 'React', 'Figma', 'PostgreSQL'],
        imageSrc: resumeProjectImg,
        theme: 'resume',
    },
    {
        id: 'static-3',
        title: 'VR-музей',
        section: 'VR / AR',
        summary:
            'Иммерсивный образовательный опыт: искусство и история в виртуальной реальности.',
        body: 'VR-музей — это современный образовательный инструмент, делающий изучение искусства и истории увлекательным.\n\nВиртуальная реальность позволяет рассматривать эпохи и культуру, а также проживать события внутри картин. Такой формат сочетает обучение, интерактив и практику, усиливает интерес и понимание материала.',
        tags: ['Unreal Engine 5', 'VR', 'C++'],
        imageSrc: VrImg,
        theme: 'vr',
    },
];

const mapApiProject = (p, index) => ({
    id: p.id,
    title: p.title,
    section: p.section || null,
    summary: p.summary || '',
    body: p.body || p.summary || '',
    tags: (p.skills ?? []).map((s) => s.name).slice(0, 6),
    imageSrc: getProjectCoverUrl(p) || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length],
    theme: getProjectTheme(index),
});

const Projects = () => {
    const { openProject } = useProjectModal();
    const [projects, setProjects] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [activeCard, setActiveCard] = useState(1);
    const [isAnimating, setIsAnimating] = useState(false);
    const [expandedCards, setExpandedCards] = useState([1]);
    const [isMobile, setIsMobile] = useState(false);
    const [containerHeight, setContainerHeight] = useState("800px");
    const cardsWrapperRef = useRef(null);

    const cardCount = projects.length;

    useEffect(() => {
        (async () => {
            setLoadingProjects(true);
            try {
                const rows = await getProjectsForViewer();
                if (rows.length > 0) {
                    const mapped = rows.slice(0, 3).map((p, i) => mapApiProject(p, i));
                    setProjects(mapped);
                    setExpandedCards([1]);
                    setActiveCard(1);
                } else {
                    setProjects(STATIC_PROJECTS);
                }
            } catch (e) {
                console.warn('[Projects] API unavailable, using static showcase', e);
                setProjects(STATIC_PROJECTS);
            } finally {
                setLoadingProjects(false);
            }
        })();
    }, []);

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
                const theme = project.theme || CARD_THEMES[index % CARD_THEMES.length];
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

                                    {!String(project.id).startsWith('static') ? (
                                        <button
                                            type="button"
                                            className="card__moreLink"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openProject(project.id);
                                            }}
                                        >
                                            Подробнее →
                                        </button>
                                    ) : null}
                                </>
                            )}
                        </div>
                    </div>
                );
            }),
        [projects, activeCard, isMobile, isAnimating, expandedCards, getCardPosition, isCardExpanded, handleCardClick, openProject],
    );

    return (
        <section id="projects" className="projects" style={{ minHeight: containerHeight }}>
            <div className="projects__wrapper">
                <div className="projects__head">
                    <h2 className="projects__title">Лучшие проекты наших студентов</h2>
                    <p className="projects__more">
                        <Link to="/projects">Все проекты →</Link>
                    </p>
                </div>

                <div className="projects__cardsWrapper" ref={cardsWrapperRef}>
                    {loadingProjects && projects.length === 0 ? (
                        <p className="projects__loading" aria-live="polite">Загрузка проектов…</p>
                    ) : (
                        cards
                    )}
                </div>
            </div>
        </section>
    )
}

export default Projects;
