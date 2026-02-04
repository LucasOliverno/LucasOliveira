function About() {
    const stats = [
        { number: '3+', label: 'Anos de Experiência' },
        { number: '10+', label: 'Projetos Entregues' },
        { number: '∞', label: 'Curiosidade' },
    ];

    return (
        <section className="section" id="sobre">
            <div className="container">
                <div className="about-content">
                    <div className="about-image">
                        <div className="about-image-wrapper">
                            <div className="about-image-placeholder">👨‍🔬</div>
                        </div>
                        <div className="about-image-decoration"></div>
                    </div>

                    <div className="about-text">
                        <div className="section-tag">Sobre Mim</div>
                        <h2>Da Engenharia Química ao Código</h2>

                        <p>
                            Sou estudante de Engenharia Química na UFMG e estagiário na BRASS Brasil,
                            onde trabalho com sistemas de detecção de vazamentos em oleodutos.
                            Minha jornada me levou a descobrir o poder da programação como ferramenta
                            para resolver problemas de engenharia de forma mais eficiente.
                        </p>

                        <p>
                            Hoje, combino o conhecimento técnico da engenharia com habilidades de
                            desenvolvimento Full Stack, criando soluções que vão desde automação
                            com IA até aplicações web que facilitam cálculos complexos.
                        </p>

                        <div className="about-stats">
                            {stats.map((stat, index) => (
                                <div className="stat-item" key={index}>
                                    <div className="stat-number">{stat.number}</div>
                                    <div className="stat-label">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default About;
