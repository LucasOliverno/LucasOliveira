import { useTranslation } from 'react-i18next';
import profilePhoto from '../assets/foto.png';

function AboutPage() {
    const { t, i18n } = useTranslation();

    const experience = [
        {
            company: 'BRASS Brasil',
            role: i18n.language === 'pt' ? 'Estagiário · Engenharia de Processos' : 'Intern · Process Engineering',
            period: '2025 – Presente',
            description: i18n.language === 'pt'
                ? 'Sistemas de detecção de vazamentos (LDS) em minerodutos e rejeitodutos. Modelagem hidráulica de fluidos não-newtonianos e suporte técnico especializado.'
                : 'Leak detection systems (LDS) for slurry and tailings pipelines. Hydraulic modeling of non-Newtonian fluids and specialized technical support.',
        },
        {
            company: 'Fábrica de Rações CCPR',
            role: i18n.language === 'pt' ? 'Estagiário · Engenharia Industrial' : 'Intern · Industrial Engineering',
            period: 'Out 2024 – Jan 2025',
            description: i18n.language === 'pt'
                ? 'Mapeamento e otimização de processos produtivos. Estudo de viabilidade para implantação de nova linha de produção.'
                : 'Production process mapping and optimization. Feasibility study for new production line implementation.',
        },
        {
            company: 'Hofbräuhaus',
            role: i18n.language === 'pt' ? 'Estagiário · Controle de Qualidade' : 'Intern · Quality Control',
            period: 'Jun – Set 2024',
            description: i18n.language === 'pt'
                ? 'Controle de qualidade no processo de produção de cerveja artesanal.'
                : 'Quality control in the craft beer production process.',
        },
    ];

    const skillsEng = i18n.language === 'pt'
        ? ['Hidráulica de Dutos', 'Reologia de Polpas', 'Processos Industriais', 'Layout Fabril', 'Análise de Transientes', 'Engenharia Econômica']
        : ['Pipeline Hydraulics', 'Slurry Rheology', 'Industrial Processes', 'Factory Layout', 'Transient Analysis', 'Economic Engineering'];

    const skillsSoftware = [
        'Python', 'FastAPI', 'React', 'Next.js',
        'Java / DDD', 'SQL / PostgreSQL', 'LangChain', 'Power BI',
    ];

    return (
        <div className="about-page" style={{ paddingTop: '120px' }}>
            <div className="container">

                <div className="about-intro">
                    <div className="about-photo-wrapper">
                        <img
                            src={profilePhoto}
                            alt="Lucas Oliveira"
                            className="about-profile-img"
                            fetchpriority="high"
                        />
                    </div>
                    <div className="about-intro-text">
                        <h1>Lucas Oliveira</h1>
                        <p className="about-role-line">
                            {i18n.language === 'pt'
                                ? 'Engenheiro de Processos & Desenvolvedor de Software'
                                : 'Process Engineer & Software Developer'}
                        </p>
                        <p>{t('about.p1')}</p>
                        <p>{t('about.p2')}</p>
                    </div>
                </div>

                <section className="about-section">
                    <h2>{t('about_page.experience_title')}</h2>
                    <div className="experience-list">
                        {experience.map((item, i) => (
                            <div className="experience-item" key={i}>
                                <div className="experience-header">
                                    <strong className="experience-company">{item.company}</strong>
                                    <span className="experience-period">{item.period}</span>
                                </div>
                                <span className="experience-role">{item.role}</span>
                                <p className="experience-desc">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="about-section">
                    <h2>{t('about_page.skills')}</h2>
                    <div className="skills-two-col">
                        <div className="skills-col">
                            <h4>{t('about_page.skills_eng')}</h4>
                            <div className="sidebar-tech-list">
                                {skillsEng.map((skill, i) => (
                                    <span key={i} className="tech-tag">{skill}</span>
                                ))}
                            </div>
                        </div>
                        <div className="skills-col">
                            <h4>{t('about_page.skills_prog')}</h4>
                            <div className="sidebar-tech-list">
                                {skillsSoftware.map((skill, i) => (
                                    <span key={i} className="tech-tag">{skill}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="about-section about-contact">
                    <h2>{t('about_page.talk_title')}</h2>
                    <p>{t('about_page.talk_p')}</p>
                    <div className="about-contact-links">
                        <a href="mailto:soareslucas031@gmail.com" className="btn btn-primary">
                            {t('about_page.send_email')}
                        </a>
                        <a
                            href="https://www.linkedin.com/in/lucas-oliveira-a369ab208/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                        >
                            LinkedIn ↗
                        </a>
                        <a
                            href="https://github.com/LucasOliverno/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                        >
                            GitHub ↗
                        </a>
                    </div>
                </section>

            </div>
        </div>
    );
}

export default AboutPage;
