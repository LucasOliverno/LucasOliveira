import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ProjectCard from '../components/ProjectCard';

const API_URL = import.meta.env.VITE_API_URL || '';

function TechProjects() {
    const { t, i18n } = useTranslation();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API_URL}/api/projects?category=programacao&lang=${i18n.language}`);
                const data = await response.json();
                setProjects(data);
            } catch (error) {
                console.error('Error fetching projects:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, [i18n.language]);

    return (
        <div className="project-details" style={{ paddingTop: '120px' }}>
            <div className="container">
                <div className="section-header">
                    <span className="section-tag">{t('projects.tech_tag')}</span>
                    <h1 className="section-title">{t('tech_page.title')}</h1>
                    <p className="section-description">
                        {t('tech_page.description')}
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
                        {t('tech_page.vibe_title')}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                        {t('tech_page.vibe_desc')}
                    </p>
                </div>

                {loading ? (
                    <div className="loading">
                        <div className="loading-spinner"></div>
                    </div>
                ) : (
                    <div className="projects-grid">
                        {projects.map((project, i) => (
                            <div key={project.id} data-animate style={{ '--index': i }}>
                                <ProjectCard project={project} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default TechProjects;
