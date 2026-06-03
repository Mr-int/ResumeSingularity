import { getProjectCoverUrl, getProjectTheme } from '../../utils/projectUtils.js';

export function ProjectGridCard({ project, index = 0, onOpen }) {
    const cover = getProjectCoverUrl(project);
    const theme = getProjectTheme(index);
    const imageCount = project?.images?.length ?? 0;

    return (
        <button
            type="button"
            className={`projectsPage__card projectsPage__card--${theme}`}
            onClick={() => onOpen?.(project.id)}
        >
            <div className="projectsPage__cardMedia">
                {cover ? (
                    <img src={cover} alt="" loading="lazy" />
                ) : (
                    <div className="projectsPage__cardPlaceholder" aria-hidden />
                )}
                {imageCount > 1 ? (
                    <span className="projectsPage__photoCount">{imageCount} фото</span>
                ) : null}
                <div className="projectsPage__cardShine" aria-hidden />
            </div>
            <div className="projectsPage__cardBody">
                {project.section ? (
                    <span className="projectsPage__sectionBadge">{project.section}</span>
                ) : null}
                <h3>{project.title}</h3>
                {project.summary ? <p className="projectsPage__cardSummary">{project.summary}</p> : null}
                {Array.isArray(project.skills) && project.skills.length > 0 ? (
                    <div className="projectsPage__skillTags">
                        {project.skills.slice(0, 4).map((skill) => (
                            <span key={skill.id} className="projectsPage__skillTag">
                                {skill.name}
                            </span>
                        ))}
                        {project.skills.length > 4 ? (
                            <span className="projectsPage__skillTag projectsPage__skillTag--more">
                                +{project.skills.length - 4}
                            </span>
                        ) : null}
                    </div>
                ) : null}
                <span className="projectsPage__cardCta">Подробнее →</span>
            </div>
        </button>
    );
}
