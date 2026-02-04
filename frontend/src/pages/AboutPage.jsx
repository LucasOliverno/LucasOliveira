function AboutPage() {
    const timeline = [
        {
            date: '2025 - Presente',
            title: 'BRASS Brasil',
            subtitle: 'Estagiário',
            description: 'Sistemas de detecção de vazamentos (LDS) em oleodutos e gasodutos com modelos hidráulicos.',
        },
        {
            date: '2024 - Presente',
            title: 'VibeCoding & IA',
            description: 'Integração de LLMs no desenvolvimento. Agentes para automação de relatórios.',
        },
        {
            date: '2021 - Presente',
            title: 'Engenharia Química - UFMG',
            subtitle: 'Graduação',
            description: 'Foco em processos industriais e operações unitárias.',
        },
        {
            date: '2024',
            title: 'Full Stack Development',
            description: 'Desenvolvimento web com React e Node.js. Ferramentas de engenharia na web.',
        },
        {
            date: 'Out 2024 - Jan 2025',
            title: 'Fábrica de Rações CCPR',
            subtitle: 'Estagiário',
            description: 'Mapeamento de processos para identificar gargalos e melhorar eficiência.',
        },
        {
            date: 'Jun - Set 2024',
            title: 'Hofbräuhaus',
            subtitle: 'Estagiário',
            description: 'Controle de qualidade no processo de produção de cerveja.',
        },
        {
            date: '2023',
            title: 'Início da Jornada Tech',
            description: 'Programação para resolver problemas de engenharia. Primeiros projetos em Python.',
        },
        {
            date: 'Jan 2021 - Mar 2022',
            title: 'Madeleme',
            subtitle: 'Assistente Administrativo',
            description: 'Relacionamento com clientes e desenvolvimento de habilidades de negociação.',
        },
    ];

    const skills = {
        engenharia: [
            'Hidráulica de Dutos',
            'Reologia',
            'Processos Industriais',
            'Gestão de Ativos',
            'Cálculos Transientes',
        ],
        tecnicas: [
            'Análise de Dados',
            'Python',
            'MATLAB',
            'Polymath',
            'Power BI',
            'Pacote Microsoft Office',
            'Redação de Relatórios Técnicos',
            'Engenharia de Prompt',
        ],
        programacao: [
            'React',
            'Node.js',
            'Lógica de Programação',
            'API Integration',
            'LangChain',
        ],
        comportamentais: [
            'Organização e Comunicação',
            'Proatividade e Autonomia',
            'Aprendizado Rápido',
            'Trabalho em Equipe',
        ],
        idiomas: [
            'Português (Nativo)',
            'Inglês Avançado',
        ],
    };

    return (
        <div className="about-page">
            <div className="container">
                <div className="about-page-header">
                    <span className="section-tag">Minha Jornada</span>
                    <h1>Da UFMG à Indústria, do Excel ao Vibecoding</h1>
                    <p className="section-description">
                        Uma jornada de descobertas que conecta engenharia química,
                        desenvolvimento de software e inteligência artificial.
                    </p>
                </div>

                <section style={{ marginBottom: '80px' }}>
                    <h2 style={{ textAlign: 'center', marginBottom: '40px' }}>Trajetória</h2>
                    <div className="timeline">
                        {timeline.map((item, index) => (
                            <div className="timeline-item" key={index}>
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
                    <h2 style={{ textAlign: 'center', marginBottom: '40px' }}>Habilidades</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                        <div className="sidebar-card">
                            <h4>⚙️ Engenharia</h4>
                            <div className="sidebar-tech-list">
                                {skills.engenharia.map((skill, index) => (
                                    <span key={index} className="tech-tag">{skill}</span>
                                ))}
                            </div>
                        </div>

                        <div className="sidebar-card">
                            <h4>🛠️ Técnicas</h4>
                            <div className="sidebar-tech-list">
                                {skills.tecnicas.map((skill, index) => (
                                    <span key={index} className="tech-tag">{skill}</span>
                                ))}
                            </div>
                        </div>

                        <div className="sidebar-card">
                            <h4>💻 Programação</h4>
                            <div className="sidebar-tech-list">
                                {skills.programacao.map((skill, index) => (
                                    <span key={index} className="tech-tag">{skill}</span>
                                ))}
                            </div>
                        </div>

                        <div className="sidebar-card">
                            <h4>🧠 Comportamentais</h4>
                            <div className="sidebar-tech-list">
                                {skills.comportamentais.map((skill, index) => (
                                    <span key={index} className="tech-tag">{skill}</span>
                                ))}
                            </div>
                        </div>

                        <div className="sidebar-card">
                            <h4>🌍 Idiomas</h4>
                            <div className="sidebar-tech-list">
                                {skills.idiomas.map((skill, index) => (
                                    <span key={index} className="tech-tag">{skill}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section style={{ marginTop: '80px', textAlign: 'center' }}>
                    <h2 style={{ marginBottom: '24px' }}>Vamos Conversar?</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px' }}>
                        Estou sempre aberto a novas oportunidades, colaborações e projetos interessantes.
                        Se tens uma ideia ou oportunidade, entra em contacto!
                    </p>
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <a href="mailto:lucas@email.com" className="btn btn-primary">
                            Enviar Email
                        </a>
                        <a href="https://linkedin.com/in/lucasoliveira" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                            LinkedIn
                        </a>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default AboutPage;
