import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function ProjectCard({ project }) {
    const { t } = useTranslation();

    const categoryLabels = {
        engenharia: t('projects.category_eng'),
        programacao: t('projects.category_prog'),
    };

    return (
        <article className="project-card">
            <div className="project-card-image">
                {project.status === 'in_progress' && (
                    <span className="status-badge">
                        {t('projects.in_progress')}
                    </span>
                )}
                {project.image ? (
                    <img
                        src={project.image}
                        alt={project.title}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'center',
                            transition: 'transform 0.5s var(--spring)'
                        }}
                    />
                ) : (
                    <span className="card-icon-fallback">
                        {project.category?.toUpperCase().slice(0, 3)}
                    </span>
                )}
                <span className={`project-card-category ${project.category}`}>
                    {categoryLabels[project.category]}
                </span>
            </div>

            <div className="project-card-content">
                <h3 className="project-card-title">{project.title}</h3>
                <p className="project-card-subtitle">{project.subtitle}</p>
                <p className="project-card-description">{project.description}</p>

                <div className="project-card-tech">
                    {project.techStack.slice(0, 4).map((tech, index) => (
                        <span key={index} className="tech-tag">{tech}</span>
                    ))}
                    {project.techStack.length > 4 && (
                        <span className="tech-tag">+{project.techStack.length - 4}</span>
                    )}
                </div>

                <Link to={`/projeto/${project.id}`} className="project-card-link">
                    {t('projects.view_details')}
                    <span className="arrow">→</span>
                </Link>
            </div>
        </article>
    );
}

export default ProjectCard;
