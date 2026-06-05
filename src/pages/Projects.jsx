import React, { useEffect, useMemo, useState } from 'react';

import Header from '../components/header/Header.jsx';

import Footer from '../components/footer/Footer.jsx';

import { ProjectGridCard } from '../components/projects/ProjectGridCard.jsx';

import { getProjectsForViewer } from '../services/projectsApi.js';

import { useProjectModal } from '../context/ProjectModalContext.jsx';

import './vacanciesPage.css';



const SEARCH_DEBOUNCE_MS = 350;



const ProjectsPage = () => {

    const { openProject } = useProjectModal();

    const [items, setItems] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState('');

    const [searchInput, setSearchInput] = useState('');

    const [searchQuery, setSearchQuery] = useState('');

    const [activeSection, setActiveSection] = useState('');



    useEffect(() => {

        const timer = window.setTimeout(() => {

            setSearchQuery(searchInput.trim());

        }, SEARCH_DEBOUNCE_MS);

        return () => window.clearTimeout(timer);

    }, [searchInput]);



    useEffect(() => {

        let cancelled = false;

        (async () => {

            setLoading(true);

            setError('');

            try {

                const rows = await getProjectsForViewer(searchQuery || undefined);

                if (!cancelled) {

                    setItems(rows);

                }

            } catch (e) {

                if (!cancelled) {

                    setError(e.message || 'Не удалось загрузить проекты');

                    setItems([]);

                }

            } finally {

                if (!cancelled) setLoading(false);

            }

        })();

        return () => {

            cancelled = true;

        };

    }, [searchQuery]);



    const sections = useMemo(() => {

        const unique = new Set();

        items.forEach((p) => {

            if (p.section?.trim()) unique.add(p.section.trim());

        });

        return Array.from(unique).sort((a, b) => a.localeCompare(b, 'ru'));

    }, [items]);



    const visibleItems = useMemo(() => {

        if (!activeSection) return items;

        return items.filter((p) => p.section === activeSection);

    }, [items, activeSection]);



    return (

        <>

            <Header />

            <main className="vacanciesPage projectsPage">

                <div className="vacanciesPage__inner">

                    <div className="projectsPage__hero">

                        <h1 className="vacanciesPage__title">Проекты студентов</h1>

                        <p className="vacanciesPage__lead">

                            Работы выпускников и студентов колледжа Singularity — от игр и VR до веб-сервисов и IoT.

                        </p>

                    </div>



                    <div className="projectsPage__toolbar">

                        <label className="projectsPage__search">

                            <span className="projectsPage__searchIcon" aria-hidden>

                                ⌕

                            </span>

                            <input

                                type="search"

                                value={searchInput}

                                onChange={(e) => setSearchInput(e.target.value)}

                                placeholder="Поиск по названию, описанию или разделу…"

                                aria-label="Поиск проектов"

                            />

                            {searchInput ? (

                                <button

                                    type="button"

                                    className="projectsPage__searchClear"

                                    onClick={() => setSearchInput('')}

                                    aria-label="Очистить поиск"

                                >

                                    ×

                                </button>

                            ) : null}

                        </label>

                        {sections.length > 0 ? (

                            <div className="projectsPage__sections" role="group" aria-label="Фильтр по разделам">

                                <button

                                    type="button"

                                    className={`projectsPage__sectionChip${activeSection === '' ? ' projectsPage__sectionChip--active' : ''}`}

                                    onClick={() => setActiveSection('')}

                                >

                                    Все

                                </button>

                                {sections.map((section) => (

                                    <button

                                        key={section}

                                        type="button"

                                        className={`projectsPage__sectionChip${activeSection === section ? ' projectsPage__sectionChip--active' : ''}`}

                                        onClick={() => setActiveSection(section)}

                                    >

                                        {section}

                                    </button>

                                ))}

                            </div>

                        ) : null}

                    </div>



                    {loading && <p className="accountPage__muted">Загрузка…</p>}

                    {error ? (

                        <div className="accountPage__error" role="alert">

                            {error}

                        </div>

                    ) : null}



                    {!loading && visibleItems.length === 0 && (

                        <p className="accountPage__text">

                            {searchQuery || activeSection

                                ? 'Ничего не найдено. Попробуйте другой запрос или раздел.'

                                : 'Проектов пока нет.'}

                        </p>

                    )}



                    {!loading && visibleItems.length > 0 ? (

                        <p className="projectsPage__count">

                            {visibleItems.length}{' '}

                            {visibleItems.length === 1

                                ? 'проект'

                                : visibleItems.length < 5

                                  ? 'проекта'

                                  : 'проектов'}

                        </p>

                    ) : null}



                    <div className="projectsPage__grid">

                        {visibleItems.map((p, index) => (

                            <ProjectGridCard

                                key={p.id}

                                project={p}

                                index={index}

                                onOpen={openProject}

                            />

                        ))}

                    </div>

                </div>

            </main>

            <Footer />

        </>

    );

};



export default ProjectsPage;

