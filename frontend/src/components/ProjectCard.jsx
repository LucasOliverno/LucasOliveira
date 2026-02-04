import { Link } from 'react-router-dom';

function ProjectCard({ project }) {
    const categoryIcons = {
        engenharia: '⚙️',
        programacao: '💻',
    };

    const categoryLabels = {
        engenharia: 'Engenharia',
        programacao: 'Programação',
    };

    return (
        <article className="project-card">
            <div className="project-card-image">
                <span>{categoryIcons[project.category]}</span>
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
                    Ver Detalhes
                    <span className="arrow">→</span>
                </Link>
            </div>
        </article>
    );
}

export default ProjectCard;
