import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import Footer from '../components/footer/Footer.jsx';
import { listStudentProjectCards } from '../services/projectsApi.js';
import { formatApiUserMessage } from '../utils/apiErrors.js';
import './studentProjectsPage.css';

const stopBubble = (e) => e.stopPropagation();

const ProjectCard = ({ project }) => {
    const [expanded, setExpanded] = useState(false);
    const [photoIndex, setPhotoIndex] = useState(0);
    const images = project.images || [];
    const hasManyPhotos = images.length > 1;

    const toggleExpanded = () => setExpanded((v) => !v);
    const prevPhoto = (e) => {
        stopBubble(e);
        setPhotoIndex((i) => (i <= 0 ? images.length - 1 : i - 1));
    };
    const nextPhoto = (e) => {
        stopBubble(e);
        setPhotoIndex((i) => (i >= images.length - 1 ? 0 : i + 1));
    };

    const previewText = project.summary || project.body || 'Описание не указано';
    const fullText = project.body || project.summary || 'Описание не указано';

    return (
        <li
            className={`studentProjectsPage__card${expanded ? ' studentProjectsPage__card--expanded' : ''}`}
            onClick={toggleExpanded}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleExpanded();
                }
            }}
            role="button"
            tabIndex={0}
            aria-expanded={expanded}
        >
            {images.length > 0 ? (
                <div className="studentProjectsPage__gallery" onClick={stopBubble}>
                    <img
                        src={images[photoIndex]}
                        alt=""
                        className="studentProjectsPage__galleryImage"
                        loading="lazy"
                    />
                    {hasManyPhotos ? (
                        <div className="studentProjectsPage__galleryNav">
                            <button type="button" onClick={prevPhoto} aria-label="Предыдущее фото">
                                ‹
                            </button>
                            <span>
                                {photoIndex + 1} / {images.length}
                            </span>
                            <button type="button" onClick={nextPhoto} aria-label="Следующее фото">
                                ›
                            </button>
                        </div>
                    ) : null}
                </div>
            ) : (
                <div className="studentProjectsPage__gallery studentProjectsPage__gallery--empty">Нет фото</div>
            )}

            {project.section ? (
                <p className="studentProjectsPage__cardSection">{project.section}</p>
            ) : null}

            <h2 className="studentProjectsPage__cardTitle">{project.title}</h2>

            <p
                className={`studentProjectsPage__cardDescription${expanded ? ' studentProjectsPage__cardDescription--expanded' : ''}`}
            >
                {expanded ? fullText : previewText}
            </p>

            {expanded && project.skills?.length > 0 ? (
                <ul className="studentProjectsPage__skills" onClick={stopBubble}>
                    {project.skills.map((skill) => (
                        <li key={skill}>{skill}</li>
                    ))}
                </ul>
            ) : null}

            {expanded && project.participants?.length > 0 ? (
                <div className="studentProjectsPage__participants" onClick={stopBubble}>
                    <span className="studentProjectsPage__participantsLabel">Участники:</span>
                    <div className="studentProjectsPage__participantsList">
                        {project.participants.map((p) => (
                            <Link key={p.id} to={`/studentsResume/${p.id}`} className="studentProjectsPage__participant">
                                {p.name}
                            </Link>
                        ))}
                    </div>
                </div>
            ) : null}

            {!expanded && project.participants?.length === 1 ? (
                <p className="studentProjectsPage__cardMeta" onClick={stopBubble}>
                    Участник:{' '}
                    <Link to={`/studentsResume/${project.participants[0].id}`}>
                        {project.participants[0].name}
                    </Link>
                </p>
            ) : null}

            {expanded && project.participants?.length > 0 ? (
                <div className="studentProjectsPage__cardActions" onClick={stopBubble}>
                    {project.participants.map((p) => (
                        <Link
                            key={p.id}
                            to={`/studentsResume/${p.id}`}
                            className="studentProjectsPage__cardBtn"
                        >
                            Резюме: {p.name}
                        </Link>
                    ))}
                </div>
            ) : null}
        </li>
    );
};

const StudentProjects = () => {
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const rows = await listStudentProjectCards(search);
            setItems(rows);
        } catch (e) {
            setError(formatApiUserMessage(e));
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <>
            <Header />
            <main className="studentProjectsPage">
                <div className="studentProjectsPage__inner">
                    <h1 className="studentProjectsPage__title">Проекты студентов</h1>

                    <form
                        className="studentProjectsPage__filters"
                        onSubmit={(e) => {
                            e.preventDefault();
                            load();
                        }}
                    >
                        <div className="studentProjectsPage__filterGroup">
                            <label htmlFor="project-search">Поиск</label>
                            <input
                                id="project-search"
                                className="studentProjectsPage__input"
                                placeholder="Название или описание"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="studentProjectsPage__btnContainer">
                            <button type="submit" className="studentProjectsPage__submit">
                                Найти
                            </button>
                        </div>
                    </form>

                    {loading ? <p className="studentProjectsPage__hint">Загрузка…</p> : null}
                    {error ? <p className="studentProjectsPage__error">{error}</p> : null}

                    {!loading && !error && items.length === 0 ? (
                        <p className="studentProjectsPage__hint">Проектов пока нет</p>
                    ) : null}

                    <ul className="studentProjectsPage__grid">
                        {items.map((project) => (
                            <ProjectCard key={`${project.source}-${project.id}`} project={project} />
                        ))}
                    </ul>
                </div>
            </main>
            <Footer />
        </>
    );
};

export default StudentProjects;
