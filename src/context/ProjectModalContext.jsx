import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { ProjectDetailModal } from '../components/projects/ProjectDetailModal.jsx';

const ProjectModalContext = createContext(null);

export function ProjectModalProvider({ children }) {
    const [projectId, setProjectId] = useState(null);

    const openProject = useCallback((id) => {
        if (id != null && String(id).trim()) {
            setProjectId(String(id));
        }
    }, []);

    const closeProject = useCallback(() => setProjectId(null), []);

    const value = useMemo(
        () => ({ openProject, closeProject, projectId }),
        [openProject, closeProject, projectId],
    );

    return (
        <ProjectModalContext.Provider value={value}>
            {children}
            {projectId ? (
                <ProjectDetailModal projectId={projectId} onClose={closeProject} />
            ) : null}
        </ProjectModalContext.Provider>
    );
}

export function useProjectModal() {
    const ctx = useContext(ProjectModalContext);
    if (!ctx) {
        throw new Error('useProjectModal must be used within ProjectModalProvider');
    }
    return ctx;
}
