import { useTranslation } from 'react-i18next';

function AboutPage() {
    const { t, i18n } = useTranslation();

    const timeline = [
        {
            date: '2025 - Presente',
            title: 'BRASS Brasil',
            subtitle: i18n.language === 'pt' ? 'Estagiário' : (i18n.language === 'es' ? 'Pasante' : 'Intern'),
            description: i18n.language === 'pt'
                ? 'Sistemas de detecção de vazamentos (LDS) em oleodutos e gasodutos com modelos hidráulicos.'
                : (i18n.language === 'es'
                    ? 'Sistemas de detección de fugas (LDS) en oleoductos y gasoductos con modelos hidráulicos.'
                    : 'Leak detection systems (LDS) in oil and gas pipelines with hydraulic models.'),
        },
        {
            date: '2024 - Presente',
            title: 'VibeCoding & IA',
            description: i18n.language === 'pt'
                ? 'Integração de LLMs no desenvolvimento. Agentes para automação de relatórios.'
                : (i18n.language === 'es'
                    ? 'Integración de LLMs en el desarrollo. Agentes para la automatización de informes.'
                    : 'LLM integration in development. Agents for report automation.'),
        },
        {
            date: '2021 - Presente',
            title: i18n.language === 'pt' ? 'Engenharia Química - UFMG' : (i18n.language === 'es' ? 'Ingeniería Química - UFMG' : 'Chemical Engineering - UFMG'),
            subtitle: i18n.language === 'pt' ? 'Graduação' : (i18n.language === 'es' ? 'Grado' : 'B.S. Degree'),
            description: i18n.language === 'pt'
                ? 'Foco em processos industriais e operações unitárias.'
                : (i18n.language === 'es'
                    ? 'Enfoque en procesos industriales y operaciones unitarias.'
                    : 'Focus on industrial processes and unit operations.'),
        },
        {
            date: '2024',
            title: 'Full Stack Development',
            description: i18n.language === 'pt'
                ? 'Desenvolvimento web com React e Node.js. Ferramentas de engenharia na web.'
                : (i18n.language === 'es'
                    ? 'Desarrollo web con React y Node.js. Herramientas de ingeniería en la web.'
                    : 'Web development with React and Node.js. Engineering tools on the web.'),
        },
        {
            date: 'Out 2024 - Jan 2025',
            title: i18n.language === 'pt' ? 'Fábrica de Rações CCPR' : (i18n.language === 'es' ? 'Fábrica de Alimentos CCPR' : 'CCPR Animal Feed Factory'),
            subtitle: i18n.language === 'pt' ? 'Estagiário' : (i18n.language === 'es' ? 'Pasante' : 'Intern'),
            description: i18n.language === 'pt'
                ? 'Mapeamento de processos para identificar gargalos e melhorar eficiência.'
                : (i18n.language === 'es'
                    ? 'Mapeo de procesos para identificar cuellos de botella y mejorar la eficiencia.'
                    : 'Process mapping to identify bottlenecks and improve efficiency.'),
        },
        {
            date: i18n.language === 'pt' ? 'Jun - Set 2024' : (i18n.language === 'es' ? 'Jun - Sep 2024' : 'Jun - Sep 2024'),
            title: 'Hofbräuhaus',
            subtitle: i18n.language === 'pt' ? 'Estagiário' : (i18n.language === 'es' ? 'Pasante' : 'Intern'),
            description: i18n.language === 'pt'
                ? 'Controle de qualidade no processo de produção de cerveja.'
                : (i18n.language === 'es'
                    ? 'Control de calidad en el proceso de producción de cerveza.'
                    : 'Quality control in the beer production process.'),
        },
        {
            date: '2023',
            title: i18n.language === 'pt' ? 'Início da Jornada Tech' : (i18n.language === 'es' ? 'Inicio de la Trayectoria Tech' : 'Tech Journey Start'),
            description: i18n.language === 'pt'
                ? 'Programação para resolver problemas de engenharia. Primeiros projetos em Python.'
                : (i18n.language === 'es'
                    ? 'Programación para resolver problemas de ingeniería. Primeros proyectos en Python.'
                    : 'Programming to solve engineering problems. First Python projects.'),
        },
        {
            date: 'Jan 2021 - Mar 2022',
            title: 'Madeleme',
            subtitle: i18n.language === 'pt' ? 'Assistente Administrativo' : (i18n.language === 'es' ? 'Asistente Administrativo' : 'Administrative Assistant'),
            description: i18n.language === 'pt'
                ? 'Relacionamento com clientes e desenvolvimento de habilidades de negociação.'
                : (i18n.language === 'es'
                    ? 'Relación con clientes y desarrollo de habilidades de negociación.'
                    : 'Customer relations and development of negotiation skills.'),
        },
    ];

    const skills = {
        engenharia: (i18n.language === 'pt' || i18n.language === 'es') ? (i18n.language === 'pt' ? [
            'Hidráulica de Dutos',
            'Reologia',
            'Processos Industriais',
            'Gestão de Ativos',
            'Cálculos Transientes',
        ] : [
            'Hidráulica de Ductos',
            'Reología',
            'Procesos Industriales',
            'Gestión de Activos',
            'Cálculos Transitorios',
        ]) : [
            'Pipeline Hydraulics',
            'Rheology',
            'Industrial Processes',
            'Asset Management',
            'Transient Calculations',
        ],
        tecnicas: (i18n.language === 'pt' || i18n.language === 'es') ? (i18n.language === 'pt' ? [
            'Análise de Dados',
            'Python',
            'MATLAB',
            'Polymath',
            'Power BI',
            'Pacote Microsoft Office',
            'Redação de Relatórios Técnicos',
            'Engenharia de Prompt',
        ] : [
            'Análisis de Datos',
            'Python',
            'MATLAB',
            'Polymath',
            'Power BI',
            'Paquete Microsoft Office',
            'Redacción de Informes Técnicos',
            'Ingeniería de Prompt',
        ]) : [
            'Data Analysis',
            'Python',
            'MATLAB',
            'Polymath',
            'Power BI',
            'Microsoft Office Suite',
            'Technical Report Writing',
            'Prompt Engineering',
        ],
        programacao: [
            'React',
            'Node.js',
            'Lógica de Programação',
            'API Integration',
            'LangChain',
        ],
        comportamentais: (i18n.language === 'pt' || i18n.language === 'es') ? (i18n.language === 'pt' ? [
            'Organização e Comunicação',
            'Proatividade e Autonomia',
            'Aprendizado Rápido',
            'Trabalho em Equipe',
        ] : [
            'Organización y Comunicación',
            'Proactividad y Autonomía',
            'Aprendizaje Rápido',
            'Trabajo en Equipo',
        ]) : [
            'Organization and Communication',
            'Proactivity and Autonomy',
            'Fast Learning',
            'Teamwork',
        ],
        idiomas: (i18n.language === 'pt' || i18n.language === 'es') ? (i18n.language === 'pt' ? [
            'Português (Nativo)',
            'Inglês Avançado',
        ] : [
            'Portugués (Nativo)',
            'Inglés Avanzado',
            'Español (Avanzado)',
        ]) : [
            'Portuguese (Native)',
            'Advanced English',
        ],
    };

    return (
        <div className="about-page">
            <div className="container">
                <div className="about-page-header">
                    <span className="section-tag">{t('about_page.tag')}</span>
                    <h1>{t('about_page.title')}</h1>
                    <p className="section-description">
                        {t('about_page.description')}
                    </p>
                </div>

                <section style={{ marginBottom: '80px' }}>
                    <h2 style={{ textAlign: 'center', marginBottom: '40px' }}>{t('about_page.trajectory')}</h2>
                    <div className="timeline">
                        {timeline.map((item, index) => (
                            <div className="timeline-item" key={index} data-animate style={{ '--index': index }}>
                                <div className="timeline-content">
                                    <span className="timeline-date">{item.date}</span>
                                    <h3 className="timeline-title">{item.title}</h3>
                                    {item.subtitle && (
                                        <span style={{
                                            color: 'var(--accent-secondary)',
                                            fontSize: '0.875rem',
                                            display: 'block',
                                            marginBottom: '8px'
                                        }}>
                                            {item.subtitle}
                                        </span>
                                    )}
                                    <p className="timeline-description">{item.description}</p>
                                </div>
                                <div className="timeline-dot"></div>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 style={{ textAlign: 'center', marginBottom: '40px' }}>{t('about_page.skills')}</h2>
                    <div className="skills-grid">
                        <div className="sidebar-card">
                            <h4>{t('about_page.skills_eng')}</h4>
                            <div className="sidebar-tech-list">
                                {skills.engenharia.map((skill, index) => (
                                    <span key={index} className="tech-tag">{skill}</span>
                                ))}
                            </div>
                        </div>

                        <div className="sidebar-card">
                            <h4>{t('about_page.skills_tech')}</h4>
                            <div className="sidebar-tech-list">
                                {skills.tecnicas.map((skill, index) => (
                                    <span key={index} className="tech-tag">{skill}</span>
                                ))}
                            </div>
                        </div>

                        <div className="sidebar-card">
                            <h4>{t('about_page.skills_prog')}</h4>
                            <div className="sidebar-tech-list">
                                {skills.programacao.map((skill, index) => (
                                    <span key={index} className="tech-tag">{skill}</span>
                                ))}
                            </div>
                        </div>

                        <div className="sidebar-card">
                            <h4>{t('about_page.skills_comp')}</h4>
                            <div className="sidebar-tech-list">
                                {skills.comportamentais.map((skill, index) => (
                                    <span key={index} className="tech-tag">{skill}</span>
                                ))}
                            </div>
                        </div>

                        <div className="sidebar-card">
                            <h4>{t('about_page.skills_langs')}</h4>
                            <div className="sidebar-tech-list">
                                {skills.idiomas.map((skill, index) => (
                                    <span key={index} className="tech-tag">{skill}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section style={{ marginTop: '80px', textAlign: 'center' }}>
                    <h2 style={{ marginBottom: '24px' }}>{t('about_page.talk_title')}</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px' }}>
                        {t('about_page.talk_p')}
                    </p>
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <a href="mailto:soareslucas031@gmail.com" className="btn btn-primary">
                            {t('about_page.send_email')}
                        </a>
                        <a href="https://www.linkedin.com/in/lucas-oliveira-a369ab208/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                            LinkedIn
                        </a>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default AboutPage;
