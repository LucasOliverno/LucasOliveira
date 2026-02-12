import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Hero from '../components/Hero';
import About from '../components/About';
import ProjectGrid from '../components/ProjectGrid';

const API_URL = import.meta.env.VITE_API_URL || '';

function Home() {
    const { t, i18n } = useTranslation();
    const [engineeringProjects, setEngineeringProjects] = useState([]);
    const [programmingProjects, setProgrammingProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API_URL}/api/projects?featured=true&lang=${i18n.language}`);
                const data = await response.json();

                setEngineeringProjects(data.filter(p => p.category === 'engenharia').slice(0, 2));
                setProgrammingProjects(data.filter(p => p.category === 'programacao').slice(0, 2));
            } catch (error) {
                console.error('Error fetching projects:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, [i18n.language]);

    return (
        <main>
            <Hero />
            <About />

            {loading ? (
                <div className="loading">
                    <div className="loading-spinner"></div>
                </div>
            ) : (
                <>
                    <ProjectGrid
                        projects={engineeringProjects}
                        tag={t('projects.eng_tag')}
                        title={t('projects.eng_title')}
                        description={t('projects.eng_desc')}
                    />

                    <ProjectGrid
                        projects={programmingProjects}
                        tag={t('projects.tech_tag')}
                        title={t('projects.tech_title')}
                        description={t('projects.tech_desc')}
                    />
                </>
            )}
        </main>
    );
}

export default Home;
