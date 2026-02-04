import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function ProjectDetails() {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const response = await fetch(`${API_URL}/api/projects/${id}`);

                if (!response.ok) {
                    throw new Error('Projeto não encontrado');
                }

                const data = await response.json();
                setProject(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [id]);

    if (loading) {
        return (
            <div className="project-details">
                <div className="container">
                    <div className="loading">
                        <div className="loading-spinner"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="project-details">
                <div className="container">
                    <div style={{ textAlign: 'center', paddingTop: '100px' }}>
                        <h2>😕 {error}</h2>
                        <Link to="/" className="btn btn-primary" style={{ marginTop: '24px' }}>
                            Voltar ao Início
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const categoryLabels = {
        engenharia: 'Engenharia',
        programacao: 'Programação',
    };

    const categoryLinks = {
        engenharia: '/engenharia',
        programacao: '/tech',
    };

    return (
        <div className="project-details">
            <div className="container">
                <div className="project-details-header">
                    <Link to={categoryLinks[project.category]} className="project-details-back">
                        ← Voltar para {categoryLabels[project.category]}
                    </Link>

                    <span className={`project-details-category ${project.category}`}>
                        {categoryLabels[project.category]}
                    </span>

                    <h1 className="project-details-title">{project.title}</h1>
                    <p className="project-details-subtitle">{project.subtitle}</p>
                </div>

                <div className="project-details-content">
                    <div className="project-details-main">
                        <h3>Visão Geral</h3>
                        <p>{project.fullDescription}</p>

                        {project.challenges && project.challenges.length > 0 && (
                            <>
                                <h3>Desafios Técnicos</h3>
                                <ul>
                                    {project.challenges.map((challenge, index) => (
                                        <li key={index}>{challenge}</li>
                                    ))}
                                </ul>
                            </>
                        )}

                        {project.results && project.results.length > 0 && (
                            <>
                                <h3>Resultados</h3>
                                <ul>
                                    {project.results.map((result, index) => (
                                        <li key={index}>{result}</li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>

                    <div className="project-details-sidebar">
                        <div className="sidebar-card">
                            <h4>Tech Stack</h4>
                            <div className="sidebar-tech-list">
                                {project.techStack.map((tech, index) => (
                                    <span key={index} className="tech-tag">{tech}</span>
                                ))}
                            </div>
                        </div>

                        {project.github && (
                            <div className="sidebar-card">
                                <h4>Links</h4>
                                <a
                                    href={project.github}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="sidebar-link"
                                >
                                    <span>GitHub Repository</span>
                                    <span>→</span>
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProjectDetails;
