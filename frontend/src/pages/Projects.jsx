import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ProjectCard from '../components/ProjectCard';
import rawProjects, { localizeProject } from '../data/projects';

function Projects() {
    const { t, i18n } = useTranslation();
    const [activeFilter, setActiveFilter] = useState('all');

    const filters = [
        { id: 'all', label: t('projects_page.filter_all') },
        { id: 'engenharia', label: t('projects_page.filter_eng') },
        { id: 'programacao', label: t('projects_page.filter_software') },
    ];

    const projects = useMemo(() => {
        const localized = rawProjects.map(p => localizeProject(p, i18n.language));
        if (activeFilter === 'all') return localized;
        return localized.filter(p => p.category === activeFilter);
    }, [i18n.language, activeFilter]);

    return (
        <div className="page-projects" style={{ paddingTop: '120px' }}>
            <div className="container">
                <div className="section-header">
                    <h1 className="section-title">{t('projects_page.title')}</h1>
                    <p className="section-description">{t('projects_page.subtitle')}</p>
                </div>

                <div className="filter-pills">
                    {filters.map((filter) => (
                        <button
                            key={filter.id}
                            className={`filter-pill ${activeFilter === filter.id ? 'active' : ''}`}
                            onClick={() => setActiveFilter(filter.id)}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>

                <div className="projects-grid">
                    {projects.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Projects;
