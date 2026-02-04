import ProjectCard from './ProjectCard';

function ProjectGrid({ projects, title, tag, description }) {
    return (
        <section className="section">
            <div className="container">
                {title && (
                    <div className="section-header">
                        {tag && <span className="section-tag">{tag}</span>}
                        <h2 className="section-title">{title}</h2>
                        {description && <p className="section-description">{description}</p>}
                    </div>
                )}

                <div className="projects-grid">
                    {projects.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
            </div>
        </section>
    );
}

export default ProjectGrid;
