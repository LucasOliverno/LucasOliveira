import { useTranslation } from 'react-i18next';

function About() {
    const { t } = useTranslation();

    const stats = [
        { number: '3+', label: t('about.stat_exp') },
        { number: '10+', label: t('about.stat_proj') },
        { number: '∞', label: t('about.stat_curiosity') },
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
                        <div className="section-tag">{t('about.tag')}</div>
                        <h2>{t('about.title')}</h2>

                        <p>{t('about.p1')}</p>

                        <p>{t('about.p2')}</p>

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
