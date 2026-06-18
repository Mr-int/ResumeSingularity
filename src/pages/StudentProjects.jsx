import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import Footer from '../components/footer/Footer.jsx';
import { listStudentProjectCards, getStudentProject } from '../services/projectsApi.js';
import { formatApiUserMessage } from '../utils/apiErrors.js';
import './studentProjectsPage.css';

const ProjectGallery = ({ images, className = '' }) => {
    const [photoIndex, setPhotoIndex] = useState(0);
    const hasManyPhotos = images.length > 1;

    useEffect(() => {
        setPhotoIndex(0);
    }, [images]);

    if (!images.length) {
        return <div className={`studentProjectsPage__gallery studentProjectsPage__gallery--empty ${className}`.trim()}>Нет фото</div>;
    }

    return (
        <div className={`studentProjectsPage__gallery ${className}`.trim()}>
            <img
                src={images[photoIndex]}
                alt=""
                className="studentProjectsPage__galleryImage"
                loading="lazy"
            />
            {hasManyPhotos ? (
                <div className="studentProjectsPage__galleryNav">
                    <button
                        type="button"
                        onClick={() => setPhotoIndex((i) => (i <= 0 ? images.length - 1 : i - 1))}
                        aria-label="Предыдущее фото"
                    >
                        ‹
                    </button>
                    <span>
                        {photoIndex + 1} / {images.length}
                    </span>
                    <button
                        type="button"
                        onClick={() => setPhotoIndex((i) => (i >= images.length - 1 ? 0 : i + 1))}
                        aria-label="Следующее фото"
                    >
                        ›
                    </button>
                </div>
            ) : null}
        </div>
    );
};

const ProjectCard = ({ project, onOpen }) => {
    const previewText = project.summary || project.body || 'Описание не указано';

    return (
        <li
            className="studentProjectsPage__card"
            onClick={() => onOpen(project)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpen(project);
                }
            }}
            role="button"
            tabIndex={0}
            aria-haspopup="dialog"
        >
            <ProjectGallery images={project.images || []} />
            {project.section ? <p className="studentProjectsPage__cardSection">{project.section}</p> : null}
            <h2 className="studentProjectsPage__cardTitle">{project.title}</h2>
            <p className="studentProjectsPage__cardDescription">{previewText}</p>
            {project.participants?.length > 0 ? (
                <div
                    className="studentProjectsPage__cardMeta"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                >
                    <span className="studentProjectsPage__cardMetaLabel">
                        {project.participants.length === 1 ? 'Участник:' : 'Участники:'}
                    </span>
                    <div className="studentProjectsPage__cardParticipants">
                        {project.participants.map((p) => (
                            <Link
                                key={p.id}
                                to={`/studentsResume/${p.id}`}
                                className="studentProjectsPage__cardParticipant"
                            >
                                {p.name || 'Студент'}
                            </Link>
                        ))}
                    </div>
                </div>
            ) : null}
        </li>
    );
};

const ProjectModal = ({ project, loadingParticipants = false, onClose }) => {
    const fullText = project.body || project.summary || 'Описание не указано';

    useEffect(() => {
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [onClose]);

    return createPortal(
        <div className="studentProjectsPage__modal" role="presentation" onClick={onClose}>
            <div
                className="studentProjectsPage__modalDialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="project-modal-title"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="studentProjectsPage__modalToolbar">
                    <button
                        type="button"
                        className="studentProjectsPage__modalClose"
                        onClick={onClose}
                        aria-label="Закрыть"
                    >
                        ×
                    </button>
                </div>

                <div className="studentProjectsPage__modalBody">
                    <ProjectGallery images={project.images || []} className="studentProjectsPage__gallery--modal" />

                    {project.section ? (
                        <p className="studentProjectsPage__cardSection">{project.section}</p>
                    ) : null}

                    <h2 id="project-modal-title" className="studentProjectsPage__modalTitle">
                        {project.title}
                    </h2>

                    <p className="studentProjectsPage__modalDescription">{fullText}</p>

                    {project.skills?.length > 0 ? (
                        <ul className="studentProjectsPage__skills">
                            {project.skills.map((skill) => (
                                <li key={skill}>{skill}</li>
                            ))}
                        </ul>
                    ) : null}

                    {project.participants?.length > 0 ? (
                        <div className="studentProjectsPage__participants">
                            <span className="studentProjectsPage__participantsLabel">Участники</span>
                            <div className="studentProjectsPage__participantsList">
                                {project.participants.map((p) => (
                                    <Link
                                        key={p.id}
                                        to={`/studentsResume/${p.id}`}
                                        className="studentProjectsPage__participant"
                                    >
                                        {p.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ) : loadingParticipants ? (
                        <p className="studentProjectsPage__hint">Загрузка участников…</p>
                    ) : null}
                </div>
            </div>
        </div>,
        document.body,
    );
};

const StudentProjects = () => {
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [openProject, setOpenProject] = useState(null);
    const [openingProjectId, setOpeningProjectId] = useState(null);

    const handleOpenProject = useCallback(async (project) => {
        setOpenProject(project);
        if (!project?.id) return;

        setOpeningProjectId(project.id);
        try {
            const full = await getStudentProject(project.id, project.source || 'auth');
            if (full) {
                setOpenProject((prev) => (
                    prev && String(prev.id) === String(project.id) ? { ...prev, ...full } : prev
                ));
            }
        } catch {
            /* оставляем данные из списка */
        } finally {
            setOpeningProjectId(null);
        }
    }, []);

    const load = useCallback(async (query = '') => {
        setLoading(true);
        setError('');
        try {
            const rows = await listStudentProjectCards(query);
            setItems(rows);
        } catch (e) {
            setError(formatApiUserMessage(e));
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load('');
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
                            load(search.trim());
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

                    <div className="studentProjectsPage__status" aria-live="polite">
                        {loading ? <p className="studentProjectsPage__hint">Загрузка…</p> : null}
                        {error ? <p className="studentProjectsPage__error">{error}</p> : null}
                        {!loading && !error && items.length === 0 ? (
                            <p className="studentProjectsPage__hint">Проектов пока нет</p>
                        ) : null}
                    </div>

                    <ul className={`studentProjectsPage__grid${loading ? ' studentProjectsPage__grid--loading' : ''}`}>
                        {items.map((project) => (
                            <ProjectCard
                                key={`${project.source}-${project.id}`}
                                project={project}
                                onOpen={handleOpenProject}
                            />
                        ))}
                    </ul>
                </div>
            </main>
            <Footer />
            {openProject ? (
                <ProjectModal
                    project={openProject}
                    loadingParticipants={openingProjectId != null && String(openingProjectId) === String(openProject.id)}
                    onClose={() => {
                        setOpenProject(null);
                        setOpeningProjectId(null);
                    }}
                />
            ) : null}
        </>
    );
};

export default StudentProjects;
