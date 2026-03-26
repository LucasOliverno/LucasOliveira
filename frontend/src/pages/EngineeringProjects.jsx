import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ProjectCard from '../components/ProjectCard';

const API_URL = import.meta.env.VITE_API_URL || '';

function EngineeringProjects() {
    const { t, i18n } = useTranslation();
    const [projects, setProjects] = useState([]);
    const [filteredProjects, setFilteredProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');

    const filters = [
        { id: 'all', label: t('eng_page.filter_all') },
        { id: 'hidraulica', label: t('eng_page.filter_hyd') },
        { id: 'processos', label: t('eng_page.filter_proc') },
        { id: 'consultoria', label: t('eng_page.filter_cons') },
    ];

    useEffect(() => {
        const fetchProjects = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API_URL}/api/projects?category=engenharia&lang=${i18n.language}`);
                const data = await response.json();
                setProjects(data);
                setFilteredProjects(data);
            } catch (error) {
                console.error('Error fetching projects:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, [i18n.language]);

    const handleFilter = (filterId) => {
        setActiveFilter(filterId);

        if (filterId === 'all') {
            setFilteredProjects(projects);
        } else {
            // Filter by checking if any tech stack items match the filter
            const filtered = projects.filter(project =>
                project.techStack.some(tech =>
                    tech.toLowerCase().includes(filterId.toLowerCase())
                )
            );
            setFilteredProjects(filtered.length > 0 ? filtered : projects);
        }
    };

    return (
        <div className="project-details" style={{ paddingTop: '120px' }}>
            <div className="container">
                <div className="section-header">
                    <span className="section-tag">{t('projects.eng_tag')}</span>
                    <h1 className="section-title">{t('eng_page.title')}</h1>
                    <p className="section-description">
                        {t('eng_page.description')}
                    </p>
                </div>

                <div className="category-tabs">
                    {filters.map((filter) => (
                        <button
                            key={filter.id}
                            className={`category-tab ${activeFilter === filter.id ? 'active' : ''}`}
                            onClick={() => handleFilter(filter.id)}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="loading">
                        <div className="loading-spinner"></div>
                    </div>
                ) : (
                    <div className="projects-grid">
                        {filteredProjects.map((project, i) => (
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

export default EngineeringProjects;
