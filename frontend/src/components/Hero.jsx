import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function Hero() {
    const { t } = useTranslation();

    return (
        <section className="hero">
            <div className="hero-content">
                <h1 className="hero-name">{t('hero.name')}</h1>

                <p className="hero-role">{t('hero.role')}</p>

                <p className="hero-pitch">{t('hero.pitch')}</p>

                <div className="hero-buttons">
                    <Link to="/projetos" className="btn btn-primary">
                        {t('hero.btn_projects')}
                        <span>→</span>
                    </Link>
                    <a
                        href="mailto:soareslucas031@gmail.com"
                        className="btn btn-secondary"
                    >
                        {t('hero.btn_contact')} ↗
                    </a>
                </div>
            </div>
        </section>
    );
}

export default Hero;
