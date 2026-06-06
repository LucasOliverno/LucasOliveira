import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import rawProjects, { localizeProject } from '../data/projects';

function ProjectDetails() {
    const { id } = useParams();
    const { t, i18n } = useTranslation();

    const project = useMemo(() => {
        const raw = rawProjects.find(p => p.id === id);
        if (!raw) return null;
        return localizeProject(raw, i18n.language);
    }, [id, i18n.language]);

    if (!project) {
        return (
            <div className="container" style={{ paddingTop: '150px', textAlign: 'center' }}>
                <h2>{i18n.language === 'pt' ? 'Projeto não encontrado' : 'Project not found'}</h2>
                <Link to="/projetos" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-flex' }}>
                    {i18n.language === 'pt' ? 'Ver todos os projetos' : 'View all projects'}
                </Link>
            </div>
        );
    }

    const isEngineering = project.category === 'engenharia';
    const allProjects = rawProjects.map(p => localizeProject(p, i18n.language));
    const currentIndex = allProjects.findIndex(p => p.id === id);
    const prevProject = currentIndex > 0 ? allProjects[currentIndex - 1] : null;
    const nextProject = currentIndex < allProjects.length - 1 ? allProjects[currentIndex + 1] : null;

    const renderDescription = (text) =>
        text.split('\n').filter(Boolean).map((line, i) => (
            <p key={i} style={{ marginBottom: '16px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                {line.split(/(\*\*.*?\*\*)/).map((part, j) =>
                    part.startsWith('**') && part.endsWith('**')
                        ? <strong key={j} style={{ color: 'var(--text-primary)' }}>{part.slice(2, -2)}</strong>
                        : part
                )}
            </p>
        ));

    return (
        <div className="project-details" style={{ paddingTop: '120px' }}>
            <div className="container">
                <Link to="/projetos" className="back-link">
                    ← {t('project_details.back')}
                </Link>

                <div className="project-header">
                    <div className="project-header-info">
                        <span className={`project-card-category ${project.category}`}>
                            {isEngineering ? t('projects.category_eng') : t('projects.category_prog')}
                        </span>
                        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', margin: '16px 0' }}>
                            {project.title}
                        </h1>
                        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                            {project.subtitle}
                        </p>
                    </div>

                    <div className="project-header-actions">
                        {project.github && (
                            <a href={project.github} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                                GitHub ↗
                            </a>
                        )}
                        {project.documents?.map((doc, i) => (
                            <a key={i} href={doc.path} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                                {doc.title} ↗
                            </a>
                        ))}
                    </div>
                </div>

                <div className="project-grid-details">
                    <div className="project-main-content">
                        <section style={{ marginBottom: '48px' }}>
                            <h2>{t('project_details.overview')}</h2>
                            <div style={{ fontSize: '1.05rem' }}>
                                {renderDescription(project.fullDescription)}
                            </div>
                        </section>

                        {project.challenges?.length > 0 && (
                            <section style={{ marginBottom: '48px' }}>
                                <h2>{t('project_details.challenges')}</h2>
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {project.challenges.map((item, i) => (
                                        <li key={i} style={{ display: 'flex', gap: '12px', marginBottom: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                                            <span style={{ color: 'var(--accent-primary)', flexShrink: 0 }}>▹</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {project.results?.length > 0 && (
                            <section style={{ marginBottom: '48px' }}>
                                <h2>{t('project_details.results')}</h2>
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {project.results.map((item, i) => (
                                        <li key={i} style={{ display: 'flex', gap: '12px', marginBottom: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                                            <span style={{ color: 'var(--accent-primary)', flexShrink: 0 }}>✓</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {project.gallery?.length > 0 && (
                            <section style={{ marginBottom: '48px' }}>
                                <h2>{t('project_details.gallery')}</h2>
                                <div className="gallery-grid">
                                    {project.gallery.map((img, i) => (
                                        <div key={i} style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                            <img
                                                src={img}
                                                alt={`${project.title} ${i + 1}`}
                                                loading="lazy"
                                                style={{ width: '100%', height: 'auto', display: 'block' }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    <aside className="project-sidebar">
                        <div className="sidebar-card" style={{ position: 'sticky', top: '120px' }}>
                            <h3 style={{ marginBottom: '20px', fontSize: '1rem' }}>{t('project_details.tech_stack')}</h3>
                            <div className="sidebar-tech-list">
                                {project.techStack.map((tech, i) => (
                                    <span key={i} className="tech-tag">{tech}</span>
                                ))}
                            </div>

                            {project.status && (
                                <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '4px' }}>
                                        STATUS
                                    </span>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                        {project.status === 'completed'
                                            ? (i18n.language === 'pt' ? 'Concluído' : 'Completed')
                                            : (i18n.language === 'pt' ? 'Em progresso' : 'In progress')}
                                    </span>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>

                <nav className="project-nav">
                    {prevProject ? (
                        <Link to={`/projeto/${prevProject.id}`} className="project-nav-link project-nav-link--prev">
                            <span>←</span>
                            <span>{prevProject.title}</span>
                        </Link>
                    ) : <span />}
                    {nextProject ? (
                        <Link to={`/projeto/${nextProject.id}`} className="project-nav-link project-nav-link--next">
                            <span>{nextProject.title}</span>
                            <span>→</span>
                        </Link>
                    ) : <span />}
                </nav>
            </div>
        </div>
    );
}

export default ProjectDetails;
