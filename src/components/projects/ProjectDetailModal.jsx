import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProjectForViewer } from '../../services/projectsApi.js';
import { getImageUrl } from '../../config/api.js';
import { isAuthenticated } from '../../services/authApi.js';
import {
    getProjectImages,
    resolveProjectImageUrl,
} from '../../utils/projectUtils.js';
import { ProjectBodyText } from './ProjectBodyText.jsx';
import './projectDetailModal.css';

export function ProjectDetailModal({ projectId, onClose }) {
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [visible, setVisible] = useState(false);
    const [activeImage, setActiveImage] = useState(0);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError('');
            setVisible(false);
            setActiveImage(0);
            try {
                const data = await getProjectForViewer(projectId);
                if (!cancelled) {
                    setProject(data);
                    requestAnimationFrame(() => setVisible(true));
                }
            } catch (e) {
                if (!cancelled) {
                    setError(e.message || 'Не удалось загрузить проект');
                    setProject(null);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [projectId]);

    const images = getProjectImages(project);
    const currentImage = images[activeImage];
    const currentUrl = resolveProjectImageUrl(currentImage);
    const students = project?.students;
    const showStudents = Array.isArray(students) && students.length > 0;

    const showPrev = useCallback(() => {
        if (images.length <= 1) return;
        setActiveImage((i) => (i - 1 + images.length) % images.length);
    }, [images.length]);

    const showNext = useCallback(() => {
        if (images.length <= 1) return;
        setActiveImage((i) => (i + 1) % images.length);
    }, [images.length]);

    return (
        <div
            className={`projectModal ${visible ? 'projectModal--visible' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="projectModalTitle"
        >
            <button
                type="button"
                className="projectModal__backdrop"
                aria-label="Закрыть"
                onClick={onClose}
            />
            <div className="projectModal__panel">
                <button
                    type="button"
                    className="projectModal__close"
                    aria-label="Закрыть"
                    onClick={onClose}
                >
                    ×
                </button>

                {loading && <p className="projectModal__muted">Загрузка…</p>}

                {error ? (
                    <div className="projectModal__error" role="alert">
                        {error}
                    </div>
                ) : null}

                {!loading && project ? (
                    <article className="projectModal__content">
                        {images.length > 0 ? (
                            <div className="projectModal__gallery">
                                <div className="projectModal__galleryMain">
                                    {images.length > 1 ? (
                                        <button
                                            type="button"
                                            className="projectModal__galleryNav projectModal__galleryNav--prev"
                                            onClick={showPrev}
                                            aria-label="Предыдущее фото"
                                        >
                                            ‹
                                        </button>
                                    ) : null}
                                    {currentUrl ? (
                                        <img src={currentUrl} alt="" className="projectModal__galleryImg" />
                                    ) : (
                                        <div className="projectModal__galleryPlaceholder" />
                                    )}
                                    {images.length > 1 ? (
                                        <button
                                            type="button"
                                            className="projectModal__galleryNav projectModal__galleryNav--next"
                                            onClick={showNext}
                                            aria-label="Следующее фото"
                                        >
                                            ›
                                        </button>
                                    ) : null}
                                </div>
                                {images.length > 1 ? (
                                    <div className="projectModal__thumbs">
                                        {images.map((img, idx) => {
                                            const url = resolveProjectImageUrl(img);
                                            return (
                                                <button
                                                    key={img.id ?? idx}
                                                    type="button"
                                                    className={`projectModal__thumb${idx === activeImage ? ' projectModal__thumb--active' : ''}`}
                                                    onClick={() => setActiveImage(idx)}
                                                >
                                                    {url ? <img src={url} alt="" /> : null}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : null}
                            </div>
                        ) : null}

                        <header className="projectModal__header">
                            {project.section ? (
                                <span className="projectModal__section">{project.section}</span>
                            ) : null}
                            <h2 id="projectModalTitle">{project.title}</h2>
                            {project.summary ? (
                                <p className="projectModal__summary">{project.summary}</p>
                            ) : null}
                            {Array.isArray(project.skills) && project.skills.length > 0 ? (
                                <div className="projectModal__skills">
                                    {project.skills.map((skill) => (
                                        <span key={skill.id} className="projectModal__skillTag">
                                            {skill.name}
                                        </span>
                                    ))}
                                </div>
                            ) : null}
                        </header>

                        {project.body ? (
                            <section className="projectModal__body">
                                <ProjectBodyText text={project.body} />
                            </section>
                        ) : null}

                        {showStudents ? (
                            <section className="projectModal__team">
                                <h3>Участники проекта</h3>
                                <ul className="projectModal__teamGrid">
                                    {students.map((s) => {
                                        const name =
                                            `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() ||
                                            'Студент';
                                        const avatar = getImageUrl(s.imagePath);
                                        const inner = (
                                            <>
                                                <div className="projectModal__memberAvatar">
                                                    {avatar ? (
                                                        <img src={avatar} alt="" />
                                                    ) : (
                                                        <span>{name.charAt(0)}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <strong>{name}</strong>
                                                    {s.speciality ? <span>{s.speciality}</span> : null}
                                                </div>
                                            </>
                                        );
                                        return (
                                            <li key={s.id}>
                                                {isAuthenticated() ? (
                                                    <Link
                                                        to={`/studentsResume/${s.id}`}
                                                        className="projectModal__member"
                                                        onClick={onClose}
                                                    >
                                                        {inner}
                                                    </Link>
                                                ) : (
                                                    <div className="projectModal__member projectModal__member--static">
                                                        {inner}
                                                    </div>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </section>
                        ) : null}
                    </article>
                ) : null}
            </div>
        </div>
    );
}
