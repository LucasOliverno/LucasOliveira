import ProjectCard from './ProjectCard';

function ProjectGrid({ projects, title, tag, description, featured }) {
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

                <div className={`projects-grid${featured ? ' projects-grid--featured' : ''}`}>
                    {projects.map((project, i) => (
                        <div key={project.id} data-animate style={{ '--index': i }}>
                            <ProjectCard project={project} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default ProjectGrid;
