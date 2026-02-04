import { useState, useEffect } from 'react';
import ProjectCard from '../components/ProjectCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function EngineeringProjects() {
    const [projects, setProjects] = useState([]);
    const [filteredProjects, setFilteredProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');

    const filters = [
        { id: 'all', label: 'Todos' },
        { id: 'hidraulica', label: 'Hidráulica' },
        { id: 'processos', label: 'Processos' },
        { id: 'consultoria', label: 'Consultoria' },
    ];

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await fetch(`${API_URL}/api/projects?category=engenharia`);
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
    }, []);

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
                    <span className="section-tag">Engenharia & Processos</span>
                    <h1 className="section-title">Projetos de Engenharia</h1>
                    <p className="section-description">
                        Experiência em sistemas hidráulicos, otimização de processos industriais
                        e consultoria técnica. Foco em resultados mensuráveis e precisão.
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
                        {filteredProjects.map((project) => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default EngineeringProjects;
