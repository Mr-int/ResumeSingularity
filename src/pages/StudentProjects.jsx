import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import Footer from '../components/footer/Footer.jsx';
import { listStudentProjectCards } from '../services/projectsApi.js';
import { getStudentById } from '../services/studentApi.js';
import { formatApiUserMessage, isPendingApprovalError, PENDING_APPROVAL_MESSAGE } from '../utils/apiErrors.js';
import './studentProjectsPage.css';

const ProjectCard = ({ project, studentLabel }) => {
    const [expanded, setExpanded] = useState(false);
    const [photoIndex, setPhotoIndex] = useState(0);
    const images = project.images || [];
    const hasManyPhotos = images.length > 1;

    const prevPhoto = () => setPhotoIndex((i) => (i <= 0 ? images.length - 1 : i - 1));
    const nextPhoto = () => setPhotoIndex((i) => (i >= images.length - 1 ? 0 : i + 1));

    return (
        <li className={`studentProjectsPage__card${expanded ? ' studentProjectsPage__card--expanded' : ''}`}>
            {images.length > 0 ? (
                <div className="studentProjectsPage__gallery">
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
            <h2 className="studentProjectsPage__cardTitle">{project.title}</h2>
            {project.description ? (
                <p
                    className={`studentProjectsPage__cardDescription${expanded ? ' studentProjectsPage__cardDescription--expanded' : ''}`}
                >
                    {project.description}
                </p>
            ) : (
                <p className="studentProjectsPage__cardDescription">Описание не указано</p>
            )}
            {studentLabel || project.studentId ? (
                <p className="studentProjectsPage__cardMeta">
                    Автор:{' '}
                    {project.studentId ? (
                        <Link to={`/studentsResume/${project.studentId}`}>{studentLabel || 'Студент'}</Link>
                    ) : (
                        studentLabel
                    )}
                </p>
            ) : null}
            <div className="studentProjectsPage__cardActions">
                <button
                    type="button"
                    className="studentProjectsPage__cardBtn"
                    onClick={() => setExpanded((v) => !v)}
                >
                    {expanded ? 'Свернуть' : 'Подробнее'}
                </button>
                {project.link ? (
                    <a
                        href={project.link}
                        className="studentProjectsPage__cardLink"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Открыть проект
                    </a>
                ) : null}
                {project.studentId ? (
                    <Link to={`/studentsResume/${project.studentId}`} className="studentProjectsPage__cardBtn">
                        Резюме автора
                    </Link>
                ) : null}
            </div>
        </li>
    );
};

const StudentProjects = () => {
    const [items, setItems] = useState([]);
    const [studentNames, setStudentNames] = useState({});
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pendingNotice, setPendingNotice] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        setPendingNotice('');
        try {
            const rows = await listStudentProjectCards(search);
            setItems(rows);

            const ids = [...new Set(rows.map((p) => p.studentId).filter(Boolean))];
            const nameMap = {};
            await Promise.all(
                ids.map(async (studentId) => {
                    try {
                        const student = await getStudentById(studentId);
                        nameMap[studentId] = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Студент';
                    } catch {
                        nameMap[studentId] = 'Студент';
                    }
                }),
            );
            setStudentNames(nameMap);
        } catch (e) {
            if (isPendingApprovalError(e)) {
                setPendingNotice(PENDING_APPROVAL_MESSAGE);
                setItems([]);
            } else {
                setError(formatApiUserMessage(e));
                setItems([]);
            }
            setStudentNames({});
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
                                placeholder="Название, описание или автор"
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
                    {pendingNotice ? (
                        <div className="studentProjectsPage__notice" role="status">
                            {pendingNotice}
                        </div>
                    ) : null}
                    {error ? <p className="studentProjectsPage__error">{error}</p> : null}

                    {!loading && !error && !pendingNotice && items.length === 0 ? (
                        <p className="studentProjectsPage__hint">Проектов пока нет</p>
                    ) : null}

                    <ul className="studentProjectsPage__grid">
                        {items.map((project) => {
                            const studentLabel =
                                project.studentName ||
                                (project.studentId ? studentNames[project.studentId] : '') ||
                                null;
                            return (
                                <ProjectCard
                                    key={`${project.source}-${project.id}`}
                                    project={project}
                                    studentLabel={studentLabel}
                                />
                            );
                        })}
                    </ul>
                </div>
            </main>
            <Footer />
        </>
    );
};

export default StudentProjects;
