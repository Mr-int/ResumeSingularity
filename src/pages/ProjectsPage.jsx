import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import { filterProjects } from '../services/projectsApi.js';
import { projectImageSrc, sortedImages } from './catalogFormat.js';
import './catalog.css';

const ProjectsPage = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        filterProjects()
            .then((list) => {
                if (!cancelled) setRows(list);
            })
            .catch((err) => {
                if (!cancelled) setError(err.message || 'Не удалось загрузить проекты');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className="catalog">
            <Header />
            <main className="catalog__main">
                <header className="catalog__head">
                    <div>
                        <p className="catalog__eyebrow">Лента</p>
                        <h1>Проекты</h1>
                        <p className="catalog__lead">Работы студентов, которые сейчас в окне публикации.</p>
                    </div>
                </header>
                {error ? <p className="catalog__error" role="alert">{error}</p> : null}
                {loading ? <p className="catalog__note">Загрузка…</p> : null}
                {!loading && !error && rows.length === 0 ? (
                    <p className="catalog__note">Сейчас в ленте нет проектов.</p>
                ) : null}
                <div className="catalog__grid">
                    {rows.map((project) => {
                        const cover = projectImageSrc(sortedImages(project.images)[0]);
                        return (
                            <Link key={project.id} className="catalog__card" to={`/projects/${project.id}`}>
                                <div className="catalog__cover">
                                    {cover ? <img src={cover} alt="" /> : null}
                                    <span className="catalog__coverMark" aria-hidden="true" />
                                </div>
                                <div className="catalog__cardBody">
                                    {project.section ? <p className="catalog__section">{project.section}</p> : null}
                                    <h2>{project.title}</h2>
                                    {project.summary ? <p className="catalog__summary">{project.summary}</p> : null}
                                    {(project.skills || []).length ? (
                                        <div className="catalog__chips">
                                            {project.skills.map((skill) => (
                                                <span key={skill.id} className="catalog__chip">{skill.name}</span>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </main>
        </div>
    );
};

export default ProjectsPage;
