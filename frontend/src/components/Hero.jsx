import { Link } from 'react-router-dom';

function Hero() {
    return (
        <section className="hero">
            <div className="hero-content">
                <div className="hero-badge">
                    <span className="dot"></span>
                    <span>Aberto a novas oportunidades</span>
                </div>

                <h1>
                    <span className="gradient-text">Engenheiro Químico</span> (UFMG) & <br />
                    <span className="gradient-text">Full Stack Developer</span>
                </h1>

                <p className="hero-subtitle">
                    Unindo o rigor da engenharia industrial à agilidade do desenvolvimento
                    de software e IA. Transformando problemas complexos em soluções elegantes.
                </p>

                <div className="hero-buttons">
                    <Link to="/engenharia" className="btn btn-primary">
                        Ver Projetos de Engenharia
                        <span>→</span>
                    </Link>
                    <Link to="/tech" className="btn btn-secondary">
                        Explorar Tech & VibeCoding
                    </Link>
                </div>
            </div>
        </section>
    );
}

export default Hero;
