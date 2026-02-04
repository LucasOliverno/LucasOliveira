import { useState, useEffect } from 'react';
import ProjectCard from '../components/ProjectCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function TechProjects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await fetch(`${API_URL}/api/projects?category=programacao`);
                const data = await response.json();
                setProjects(data);
            } catch (error) {
                console.error('Error fetching projects:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    return (
        <div className="project-details" style={{ paddingTop: '120px' }}>
            <div className="container">
                <div className="section-header">
                    <span className="section-tag">Programação & VibeCoding</span>
                    <h1 className="section-title">Projetos de Tech</h1>
                    <p className="section-description">
                        Desenvolvimento moderno com IA e automação. VibeCoding: usando inteligência
                        artificial como parceira no processo criativo de desenvolvimento.
                    </p>
                </div>

                <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-md)',
                    padding: '24px',
                    marginBottom: '40px',
                    border: '1px solid var(--border-color)'
                }}>
                    <h3 style={{ color: 'var(--accent-primary)', marginBottom: '12px' }}>
                        💡 O que é VibeCoding?
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                        VibeCoding é a prática de usar IA como parceira no desenvolvimento de software.
                        Em vez de escrever cada linha de código manualmente, colaboro com modelos de
                        linguagem para acelerar o desenvolvimento, manter a qualidade e explorar
                        soluções criativas para problemas técnicos.
                    </p>
                </div>

                {loading ? (
                    <div className="loading">
                        <div className="loading-spinner"></div>
                    </div>
                ) : (
                    <div className="projects-grid">
                        {projects.map((project) => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default TechProjects;
