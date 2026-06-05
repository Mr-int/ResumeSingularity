import React, { useEffect, useMemo, useState } from 'react';

import Header from '../components/header/Header.jsx';

import Footer from '../components/footer/Footer.jsx';

import { ProjectGridCard } from '../components/projects/ProjectGridCard.jsx';

import { STATIC_PROJECTS, toProjectViewModel } from '../data/staticProjects.js';

import { useProjectModal } from '../context/ProjectModalContext.jsx';

import './vacanciesPage.css';

const SEARCH_DEBOUNCE_MS = 350;

const STATIC_ITEMS = STATIC_PROJECTS.map((project, index) => toProjectViewModel(project, index));

const ProjectsPage = () => {
    const { openProject } = useProjectModal();
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSection, setActiveSection] = useState('');

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setSearchQuery(searchInput.trim());
        }, SEARCH_DEBOUNCE_MS);
        return () => window.clearTimeout(timer);
    }, [searchInput]);

    const filteredItems = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return STATIC_ITEMS.filter((project) => {
            if (activeSection && project.section !== activeSection) {
                return false;
            }
            if (!query) return true;
            const haystack = [
                project.title,
                project.summary,
                project.section,
                ...(project.tags ?? []),
                ...(project.skills ?? []).map((skill) => skill.name),
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(query);
        });
    }, [searchQuery, activeSection]);

    const sections = useMemo(() => {
        const unique = new Set();
        STATIC_ITEMS.forEach((project) => {
            if (project.section?.trim()) unique.add(project.section.trim());
        });
        return Array.from(unique).sort((a, b) => a.localeCompare(b, 'ru'));
    }, []);

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

                    {filteredItems.length === 0 ? (
                        <p className="accountPage__text">
                            {searchQuery || activeSection
                                ? 'Ничего не найдено. Попробуйте другой запрос или раздел.'
                                : 'Проектов пока нет.'}
                        </p>
                    ) : (
                        <p className="projectsPage__count">
                            {filteredItems.length}{' '}
                            {filteredItems.length === 1
                                ? 'проект'
                                : filteredItems.length < 5
                                  ? 'проекта'
                                  : 'проектов'}
                        </p>
                    )}

                    <div className="projectsPage__grid">
                        {filteredItems.map((project, index) => (
                            <ProjectGridCard
                                key={project.id}
                                project={project}
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
