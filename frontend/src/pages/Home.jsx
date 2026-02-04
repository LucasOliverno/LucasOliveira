import { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import About from '../components/About';
import ProjectGrid from '../components/ProjectGrid';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function Home() {
    const [engineeringProjects, setEngineeringProjects] = useState([]);
    const [programmingProjects, setProgrammingProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await fetch(`${API_URL}/api/projects?featured=true`);
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
    }, []);

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
                        tag="Engenharia & Processos"
                        title="Rigor Técnico e Precisão Industrial"
                        description="Projetos focados em hidráulica, reologia e otimização de processos."
                    />

                    <ProjectGrid
                        projects={programmingProjects}
                        tag="Programação & VibeCoding"
                        title="Inovação e Automação com IA"
                        description="Desenvolvimento moderno com foco em automação e inteligência artificial."
                    />
                </>
            )}
        </main>
    );
}

export default Home;
