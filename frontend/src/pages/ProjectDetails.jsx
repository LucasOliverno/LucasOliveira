import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function ProjectDetails() {
    const { id } = useParams();
    const { t, i18n } = useTranslation();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProject = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API_URL}/api/projects/${id}?lang=${i18n.language}`);
                const data = await response.json();
                setProject(data);
            } catch (error) {
                console.error('Error fetching project details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [id, i18n.language]);

    if (loading) {
        return (
            <div className="container" style={{ paddingTop: '150px', textAlign: 'center' }}>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="container" style={{ paddingTop: '150px', textAlign: 'center' }}>
                <h2>{i18n.language === 'pt' ? 'Projeto não encontrado' : 'Project not found'}</h2>
                <Link to="/" className="btn btn-primary" style={{ marginTop: '20px' }}>
                    {i18n.language === 'pt' ? 'Voltar para Home' : 'Back to Home'}
                </Link>
            </div>
        );
    }

    const isEngineering = project.category === 'engenharia';

    return (
        <div className="project-details" style={{ paddingTop: '120px' }}>
            <div className="container">
                <Link
                    to={isEngineering ? '/engenharia' : '/tech'}
                    className="back-link"
                    style={{
                        color: 'var(--accent-primary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '32px',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        fontWeight: '600'
                    }}
                >
                    <span>←</span> {isEngineering ? t('project_details.back_eng') : t('project_details.back_tech')}
                </Link>

                <div className="project-header">
                    <div className="project-header-info">
                        <span className={`project-card-category ${project.category}`}>
                            {isEngineering ? t('projects.category_eng') : t('projects.category_prog')}
                        </span>
                        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', margin: '16px 0' }}>{project.title}</h1>
                        <p className="project-card-subtitle" style={{ fontSize: '1.2rem', color: 'var(--accent-secondary)' }}>
                            {project.subtitle}
                        </p>
                    </div>

                    <div className="project-header-actions">
                        {project.github && (
                            <a href={project.github} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                                GitHub Repo
                            </a>
                        )}
                    </div>
                </div>

                <div className="project-grid-details" style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 300px',
                    gap: '40px',
                    marginTop: '60px'
                }}>
                    <div className="project-main-content">
                        <section style={{ marginBottom: '48px' }}>
                            <h2 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>{t('project_details.overview')}</h2>
                            <div style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '1.1rem' }}>
                                {project.fullDescription.split('\n').map((line, i) => (
                                    <p key={i} style={{ marginBottom: '16px' }}>
                                        {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
                                            if (part.startsWith('**') && part.endsWith('**')) {
                                                return <strong key={j} style={{ color: 'var(--text-primary)' }}>{part.slice(2, -2)}</strong>;
                                            }
                                            return part;
                                        })}
                                    </p>
                                ))}
                            </div>
                        </section>

                        <section style={{ marginBottom: '48px' }}>
                            <h2 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>{t('project_details.challenges')}</h2>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {project.challenges.map((challenge, index) => (
                                    <li key={index} style={{
                                        display: 'flex',
                                        gap: '12px',
                                        marginBottom: '16px',
                                        color: 'var(--text-secondary)',
                                        lineHeight: '1.6'
                                    }}>
                                        <span style={{ color: 'var(--accent-primary)' }}>▹</span>
                                        {challenge}
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section style={{ marginBottom: '48px' }}>
                            <h2 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>{t('project_details.results')}</h2>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {project.results.map((result, index) => (
                                    <li key={index} style={{
                                        display: 'flex',
                                        gap: '12px',
                                        marginBottom: '16px',
                                        color: 'var(--text-secondary)',
                                        lineHeight: '1.6'
                                    }}>
                                        <span style={{ color: 'var(--accent-secondary)' }}>✓</span>
                                        {result}
                                    </li>
                                ))}
                            </ul>
                        </section>

                        {project.gallery && (
                            <section style={{ marginBottom: '48px' }}>
                                <h2 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>Galeria</h2>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                                    gap: '20px'
                                }}>
                                    {project.gallery.map((img, index) => (
                                        <div key={index} style={{
                                            borderRadius: 'var(--radius-md)',
                                            overflow: 'hidden',
                                            border: '1px solid var(--border-color)',
                                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                        }}>
                                            <img
                                                src={img}
                                                alt={`${project.title} screenshot ${index + 1}`}
                                                style={{
                                                    width: '100%',
                                                    height: 'auto',
                                                    display: 'block',
                                                    transition: 'transform 0.3s ease'
                                                }}
                                                onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                                                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {project.documents && (
                            <section>
                                <h2 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>Documentação</h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {project.documents.map((doc, index) => (
                                        <a
                                            key={index}
                                            href={doc.path}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-document"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '16px',
                                                backgroundColor: 'var(--bg-card)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: 'var(--radius-md)',
                                                textDecoration: 'none',
                                                color: 'var(--text-primary)',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                                                e.currentTarget.style.transform = 'translateX(5px)';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                                e.currentTarget.style.transform = 'translateX(0)';
                                            }}
                                        >
                                            <span style={{ fontSize: '1.5rem' }}>📄</span>
                                            <div>
                                                <strong style={{ display: 'block' }}>{doc.title}</strong>
                                                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>PDF Document</span>
                                            </div>
                                            <span style={{ marginLeft: 'auto', color: 'var(--accent-primary)' }}>⬇️</span>
                                        </a>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    <aside className="project-sidebar">
                        <div className="sidebar-card" style={{
                            background: 'var(--bg-card)',
                            padding: '24px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)',
                            position: 'sticky',
                            top: '120px'
                        }}>
                            <h3 style={{ marginBottom: '20px', fontSize: '1.1rem' }}>{t('project_details.tech_stack')}</h3>
                            <div className="sidebar-tech-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {project.techStack.map((tech, index) => (
                                    <span key={index} className="tech-tag" style={{ border: '1px solid var(--border-color)' }}>
                                        {tech}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}

export default ProjectDetails;
