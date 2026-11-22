import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import { getProject } from '../services/projectsApi.js';
import { getImageUrl } from '../config/api.js';
import { courseUiLabel } from '../components/resumeCreator/StepForm/StepForm.jsx';
import { projectImageSrc, sortedImages } from './catalogFormat.js';
import './catalog.css';

const ProjectPage = () => {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError('');
        getProject(id)
            .then((row) => {
                if (!cancelled) setProject(row);
            })
            .catch((err) => {
                if (!cancelled) setError(err.message || 'Проект не найден');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [id]);

    const images = sortedImages(project?.images);
    const cover = projectImageSrc(images[0]);
    const students = Array.isArray(project?.students) ? project.students : null;

    return (
        <div className="catalog">
            <Header />
            <main className="catalog__main">
                <p><Link className="catalog__back" to="/projects">К проектам</Link></p>
                {loading ? <p className="catalog__note">Загрузка…</p> : null}
                {error ? <p className="catalog__error" role="alert">{error}</p> : null}
                {project ? (
                    <article className="catalog__article">
                        <header className="catalog__head">
                            <div>
                                {project.section ? <p className="catalog__eyebrow">{project.section}</p> : null}
                                <h1>{project.title}</h1>
                                {project.summary ? <p className="catalog__lead">{project.summary}</p> : null}
                            </div>
                        </header>
                        {cover ? (
                            <div className="catalog__hero">
                                <img src={cover} alt="" />
                            </div>
                        ) : null}
                        {project.body ? <p className="catalog__prose">{project.body}</p> : null}
                        {(project.skills || []).length ? (
                            <div className="catalog__chips">
                                {project.skills.map((skill) => (
                                    <span key={skill.id} className="catalog__chip">{skill.name}</span>
                                ))}
                            </div>
                        ) : null}
                        {images.length > 1 ? (
                            <div className="catalog__gallery">
                                {images.slice(1).map((image) => {
                                    const src = projectImageSrc(image);
                                    if (!src) return null;
                                    return <img key={image.id || src} src={src} alt="" />;
                                })}
                            </div>
                        ) : null}
                        {students ? (
                            <section className="catalog__block">
                                <h2>Участники</h2>
                                {students.length === 0 ? <p className="catalog__meta">Состав пока не указан.</p> : null}
                                <ul className="catalog__people">
                                    {students.map((person) => {
                                        const name = `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Студент';
                                        const photo = person.imagePath ? getImageUrl(person.imagePath) : null;
                                        const course = courseUiLabel(person.course);
                                        return (
                                            <li key={person.id} className="catalog__person">
                                                {photo ? <img src={photo} alt="" /> : <span className="catalog__avatar" aria-hidden="true" />}
                                                <div>
                                                    <strong>{name}</strong>
                                                    <p className="catalog__meta">
                                                        {[person.speciality, course === '★' ? '5 курс' : course ? `${course} курс` : ''].filter(Boolean).join(' · ') || '—'}
                                                    </p>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </section>
                        ) : null}
                    </article>
                ) : null}
            </main>
        </div>
    );
};

export default ProjectPage;
