import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function Hero() {
    const { t } = useTranslation();

    return (
        <section className="hero">
            <div className="hero-content">
                <div className="hero-badge">
                    <span className="dot"></span>
                    <span>{t('hero.badge')}</span>
                </div>

                <h1>
                    <span className="text-accent">{t('hero.title_main')}</span> (UFMG) {t('hero.title_and')} <br />
                    <span className="text-secondary-accent">{t('hero.title_sub')}</span>
                </h1>

                <p className="hero-subtitle">
                    {t('hero.subtitle')}
                </p>

                <div className="hero-buttons">
                    <Link to="/engenharia" className="btn btn-primary">
                        {t('hero.btn_eng')}
                        <span>→</span>
                    </Link>
                    <Link to="/tech" className="btn btn-secondary">
                        {t('hero.btn_tech')}
                    </Link>
                </div>
            </div>
        </section>
    );
}

export default Hero;
