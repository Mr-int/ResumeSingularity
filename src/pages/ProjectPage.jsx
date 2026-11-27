import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import { getProject } from '../services/projectsApi.js';
import { getImageUrl } from '../config/api.js';
import { courseUiLabel } from '../components/resumeCreator/StepForm/StepForm.jsx';
import { projectImageSrc, sortedImages } from './catalogFormat.js';
import './catalog.css';

const hideBrokenImage = (event) => {
    event.currentTarget.dataset.broken = 'true';
};

const labelOfItem = (item) => {
    if (typeof item === 'string') return item;
    return item?.name || item?.title || null;
};

const chipList = (value) =>
    (Array.isArray(value) ? value : [])
        .map(labelOfItem)
        .filter(Boolean);

const personPhoto = (person) => {
    if (!person) return null;
    if (person.photoUrl) return String(person.photoUrl);
    if (person.imageUrl) return String(person.imageUrl);
    if (person.imagePath) return getImageUrl(person.imagePath);
    return null;
};

/** В ответе проекта у участника подтверждён только id — выдумывать studentId не нужно. */
const personProfilePath = (person) => {
    if (person?.id == null) return null;
    const id = String(person.id).trim();
    if (!id || id === '0' || id === 'NaN') return null;
    return `/profile/${encodeURIComponent(id)}`;
};

const personMeta = (person) => {
    const course = courseUiLabel(person.course);
    const courseLabel = course === '★' ? '5 курс' : course ? `${course} курс` : '';
    const education = person.education?.name
        || person.institutionName
        || (typeof person.education === 'string' ? person.education : '');
    return [person.speciality, courseLabel, education].filter(Boolean).join(' · ') || '—';
};

const ProjectPage = () => {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [brokenAvatars, setBrokenAvatars] = useState(() => new Set());
    const generation = useRef(0);

    const load = useCallback(async () => {
        const token = generation.current + 1;
        generation.current = token;
        setLoading(true);
        setError('');
        setBrokenAvatars(new Set());
        try {
            const row = await getProject(id);
            if (generation.current === token) setProject(row);
        } catch (err) {
            if (generation.current === token) {
                setProject(null);
                setError(err.message || 'Проект не найден');
            }
        } finally {
            if (generation.current === token) setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
        return () => {
            generation.current += 1;
        };
    }, [load]);

    const images = sortedImages(project?.images);
    const cover = projectImageSrc(images[0]);
    const gallery = images.slice(1).map(projectImageSrc).filter(Boolean);
    const skills = chipList(project?.skills);
    const students = Array.isArray(project?.students)
        ? project.students
        : Array.isArray(project?.students?.data)
            ? project.students.data
            : [];

    return (
        <div className="catalog">
            <Header />
            <main className="catalog__main">
                <p><Link className="catalog__back" to="/projects">К проектам</Link></p>

                {error ? (
                    <div className="catalog__block catalog__errorState">
                        <p className="catalog__error" role="alert">{error}</p>
                        <button type="button" className="catalog__btn catalog__btn--ghost" onClick={load}>Повторить</button>
                    </div>
                ) : null}

                {loading ? <p className="catalog__note" role="status">Загрузка проекта…</p> : null}

                {project ? (
                    <article className="catalog__article">
                        <header className="catalog__head">
                            <div className="catalog__headText">
                                {project.section ? <p className="catalog__eyebrow">{project.section}</p> : null}
                                <h1 className="catalog__title">{project.title || 'Без названия'}</h1>
                                {project.summary ? <p className="catalog__lead">{project.summary}</p> : null}
                            </div>
                        </header>

                        {cover ? (
                            <div className="catalog__hero">
                                <img src={cover} alt="" onError={hideBrokenImage} />
                            </div>
                        ) : null}

                        {project.body ? (
                            <section className="catalog__block">
                                <h2 className="catalog__blockTitle">О проекте</h2>
                                <p className="catalog__blockText">{project.body}</p>
                            </section>
                        ) : null}

                        {skills.length ? (
                            <section className="catalog__block">
                                <h2 className="catalog__blockTitle">Навыки</h2>
                                <div className="catalog__chips">
                                    {skills.map((skill) => (
                                        <span key={skill} className="catalog__chip">{skill}</span>
                                    ))}
                                </div>
                            </section>
                        ) : null}

                        {gallery.length ? (
                            <section className="catalog__block">
                                <h2 className="catalog__blockTitle">Галерея</h2>
                                <div className="catalog__gallery">
                                    {gallery.map((src, index) => (
                                        <img
                                            key={`${src}-${index}`}
                                            src={src}
                                            alt=""
                                            loading="lazy"
                                            onError={hideBrokenImage}
                                        />
                                    ))}
                                </div>
                            </section>
                        ) : null}

                        {Array.isArray(project?.students) || Array.isArray(project?.students?.data) ? (
                            <section className="catalog__block">
                                <h2 className="catalog__blockTitle">Участники</h2>
                                {students.length === 0 ? (
                                    <p className="catalog__meta">Состав пока не указан.</p>
                                ) : (
                                    <ul className="catalog__people">
                                        {students.map((person, index) => {
                                            const name = [person?.firstName, person?.lastName]
                                                .map((part) => String(part || '').trim())
                                                .filter(Boolean)
                                                .join(' ') || 'Студент';
                                            const photo = personPhoto(person);
                                            const initials = name.slice(0, 1).toUpperCase();
                                            const profilePath = personProfilePath(person);
                                            const personKey = person?.id != null ? String(person.id) : `${name}-${index}`;
                                            const avatarKey = `${personKey}:${photo || ''}`;
                                            const showAvatar = Boolean(photo) && !brokenAvatars.has(avatarKey);
                                            return (
                                                <li key={personKey} className="catalog__person">
                                                    <div className="catalog__personIdentity">
                                                        {showAvatar ? (
                                                            <img
                                                                className="catalog__avatar"
                                                                src={photo}
                                                                alt=""
                                                                onError={() => setBrokenAvatars((prev) => new Set(prev).add(avatarKey))}
                                                            />
                                                        ) : (
                                                            <span className="catalog__avatar" aria-hidden="true">{initials}</span>
                                                        )}
                                                        <div>
                                                            <p className="catalog__personName">
                                                                {profilePath ? (
                                                                    <Link className="catalog__personLink" to={profilePath}>{name}</Link>
                                                                ) : name}
                                                            </p>
                                                            <p className="catalog__meta">{personMeta(person || {})}</p>
                                                        </div>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </section>
                        ) : null}
                    </article>
                ) : null}
            </main>
        </div>
    );
};

export default ProjectPage;
