import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Hero from '../components/Hero';
import ProjectGrid from '../components/ProjectGrid';
import rawProjects, { localizeProject } from '../data/projects';

function Home() {
    const { t, i18n } = useTranslation();

    const featuredProjects = useMemo(() => {
        return rawProjects
            .filter(p => p.featured)
            .slice(0, 3)
            .map(p => localizeProject(p, i18n.language));
    }, [i18n.language]);

    const credentials = [
        {
            label: t('home.cred_education_label'),
            value: t('home.cred_education_value'),
            detail: t('home.cred_education_detail'),
        },
        {
            label: t('home.cred_experience_label'),
            value: t('home.cred_experience_value'),
            detail: t('home.cred_experience_detail'),
        },
        {
            label: t('home.cred_areas_label'),
            value: t('home.cred_areas_value'),
            detail: t('home.cred_areas_detail'),
        },
    ];

    return (
        <main>
            <Hero />

            <section className="section credentials-section">
                <div className="container">
                    <div className="credentials-grid">
                        {credentials.map((item, i) => (
                            <div className="credential-item" key={i}>
                                <span className="credential-label">{item.label}</span>
                                <strong className="credential-value">{item.value}</strong>
                                <span className="credential-detail">{item.detail}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <ProjectGrid
                projects={featuredProjects}
                title={t('home.projects_title')}
                description={t('home.projects_desc')}
            />

            <section className="section-footer-link">
                <div className="container">
                    <Link to="/projetos" className="all-projects-link">
                        {t('home.view_all')} →
                    </Link>
                </div>
            </section>

            <section className="section contact-section">
                <div className="container">
                    <div className="contact-strip">
                        <a href="mailto:soareslucas031@gmail.com" className="contact-email">
                            soareslucas031@gmail.com
                        </a>
                        <div className="contact-links">
                            <a href="https://www.linkedin.com/in/lucas-oliveira-a369ab208/" target="_blank" rel="noopener noreferrer">
                                LinkedIn ↗
                            </a>
                            <a href="https://github.com/LucasOliverno/" target="_blank" rel="noopener noreferrer">
                                GitHub ↗
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default Home;
