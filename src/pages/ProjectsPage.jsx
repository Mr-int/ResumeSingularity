import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import { filterProjects } from '../services/projectsApi.js';
import { projectImageSrc, sortedImages } from './catalogFormat.js';
import './catalog.css';

const hideBrokenImage = (event) => {
    event.currentTarget.dataset.broken = 'true';
};

const skillLabel = (skill) => {
    if (typeof skill === 'string') return skill;
    return skill?.name || skill?.title || null;
};

const ProjectsPage = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const generation = useRef(0);

    const load = useCallback(async () => {
        const token = generation.current + 1;
        generation.current = token;
        setLoading(true);
        setError('');
        try {
            const list = await filterProjects();
            if (generation.current === token) setRows(list);
        } catch (err) {
            if (generation.current === token) {
                setRows([]);
                setError(err.message || 'Не удалось загрузить проекты');
            }
        } finally {
            if (generation.current === token) setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
        return () => {
            generation.current += 1;
        };
    }, [load]);

    return (
        <div className="catalog">
            <Header />
            <main className="catalog__main">
                <header className="catalog__head">
                    <div className="catalog__headText">
                        <p className="catalog__eyebrow">Лента</p>
                        <h1 className="catalog__title">Проекты</h1>
                        <p className="catalog__lead">Работы студентов, которые сейчас в окне публикации.</p>
                    </div>
                    <button type="button" className="catalog__btn catalog__btn--ghost" onClick={load} disabled={loading}>
                        Обновить
                    </button>
                </header>

                {error ? (
                    <div className="catalog__block catalog__errorState">
                        <p className="catalog__error" role="alert">{error}</p>
                        <button type="button" className="catalog__btn catalog__btn--ghost" onClick={load}>Повторить</button>
                    </div>
                ) : null}

                {loading ? <p className="catalog__note" role="status">Загрузка проектов…</p> : null}

                {!loading && !error && rows.length === 0 ? (
                    <div className="catalog__empty">
                        <p>Сейчас в ленте нет проектов.</p>
                        <button type="button" className="catalog__btn catalog__btn--ghost" onClick={load}>Повторить</button>
                    </div>
                ) : null}

                <div className="catalog__grid">
                    {rows.map((project) => {
                        const cover = projectImageSrc(sortedImages(project.images)[0]);
                        const skills = (Array.isArray(project.skills) ? project.skills : [])
                            .map(skillLabel)
                            .filter(Boolean);
                        const directions = (Array.isArray(project.directions) ? project.directions : [])
                            .map(skillLabel)
                            .filter(Boolean);
                        return (
                            <Link key={project.id} className="catalog__card" to={`/projects/${project.id}`}>
                                <div className="catalog__cover">
                                    {cover ? <img src={cover} alt="" loading="lazy" onError={hideBrokenImage} /> : null}
                                    <span className="catalog__coverMark" aria-hidden="true" />
                                </div>
                                <div className="catalog__cardBody">
                                    {project.section ? <p className="catalog__section">{project.section}</p> : null}
                                    <h2 className="catalog__cardTitle">{project.title || 'Без названия'}</h2>
                                    {project.summary ? <p className="catalog__summary">{project.summary}</p> : null}
                                    {directions.length ? (
                                        <div className="catalog__chips">
                                            {directions.map((item) => (
                                                <span key={item} className="catalog__chip">{item}</span>
                                            ))}
                                        </div>
                                    ) : null}
                                    {skills.length ? (
                                        <div className="catalog__chips">
                                            {skills.map((item) => (
                                                <span key={item} className="catalog__chip">{item}</span>
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
