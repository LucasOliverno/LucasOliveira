import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function Hero() {
    const { t } = useTranslation();
    const proof = t('hero.proof', { returnObjects: true });
    const mailto = `mailto:soareslucas031@gmail.com?subject=${encodeURIComponent(t('hero.mail_subject'))}`;

    return (
        <section className="hero">
            <div className="hero-content">
                <div className="hero-badge">
                    <span className="dot"></span>
                    {t('hero.badge')}
                </div>

                <h1 className="hero-headline">{t('hero.headline')}</h1>

                <p className="hero-role">
                    {t('hero.name')} · {t('hero.role')}
                </p>

                <p className="hero-pitch">{t('hero.pitch')}</p>

                <div className="hero-buttons">
                    <a href={mailto} className="btn btn-primary">
                        {t('hero.btn_cta')}
                    </a>
                    <Link to="/projetos" className="btn btn-secondary">
                        {t('hero.btn_projects')}
                    </Link>
                </div>

                <ul className="hero-proof">
                    {proof.map((item) => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>
            </div>
        </section>
    );
}

export default Hero;
