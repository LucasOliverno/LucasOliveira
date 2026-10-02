import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function SectionHead({ tag, title, desc }) {
    return (
        <div className="section-header" data-animate>
            <div className="section-tag">{tag}</div>
            <h2 className="section-title">{title}</h2>
            {desc && <p className="section-description">{desc}</p>}
        </div>
    );
}

export function Problem() {
    const { t } = useTranslation();
    const items = t('pitch.problem.items', { returnObjects: true });

    return (
        <section className="section">
            <div className="container">
                <SectionHead tag={t('pitch.problem.tag')} title={t('pitch.problem.title')} />
                <div className="pitch-grid pitch-grid--3">
                    {items.map((item) => (
                        <div className="pitch-card" key={item.title} data-animate>
                            <h3>{item.title}</h3>
                            <p>{item.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export function Method() {
    const { t } = useTranslation();
    const steps = t('pitch.method.steps', { returnObjects: true });

    return (
        <section className="section pitch-alt">
            <div className="container">
                <SectionHead
                    tag={t('pitch.method.tag')}
                    title={t('pitch.method.title')}
                    desc={t('pitch.method.desc')}
                />
                <div className="pitch-grid pitch-grid--3">
                    {steps.map((step, i) => (
                        <div className="pitch-card" key={step.title} data-animate>
                            <span className="pitch-step">0{i + 1}</span>
                            <h3>{step.title}</h3>
                            <p>{step.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export function Proof() {
    const { t } = useTranslation();
    const items = t('pitch.proof.items', { returnObjects: true });

    return (
        <section className="section">
            <div className="container">
                <SectionHead
                    tag={t('pitch.proof.tag')}
                    title={t('pitch.proof.title')}
                    desc={t('pitch.proof.desc')}
                />
                <div className="pitch-grid pitch-grid--4">
                    {items.map((item) => (
                        <Link to={item.to} className="pitch-card pitch-stat" key={item.value + item.detail} data-animate>
                            <strong className="pitch-stat-value">{item.value}</strong>
                            <span className="pitch-stat-label">{item.label}</span>
                            <p>{item.detail}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}

export function ValueStack() {
    const { t } = useTranslation();
    const items = t('pitch.stack.items', { returnObjects: true });

    return (
        <section className="section pitch-alt">
            <div className="container">
                <SectionHead
                    tag={t('pitch.stack.tag')}
                    title={t('pitch.stack.title')}
                    desc={t('pitch.stack.desc')}
                />
                <div className="pitch-grid pitch-grid--3">
                    {items.map((item) => (
                        <div className="pitch-card" key={item.title} data-animate>
                            <h3>{item.title}</h3>
                            <p>{item.text}</p>
                            <span className="pitch-proof-tag">{item.proof}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export function FitAndFaq() {
    const { t } = useTranslation();
    const forItems = t('pitch.fit.for_items', { returnObjects: true });
    const notItems = t('pitch.fit.not_items', { returnObjects: true });
    const faq = t('pitch.faq.items', { returnObjects: true });

    return (
        <section className="section">
            <div className="container">
                <SectionHead tag={t('pitch.fit.tag')} title={t('pitch.fit.title')} />
                <div className="pitch-grid pitch-grid--2">
                    <div className="pitch-card pitch-fit pitch-fit--yes" data-animate>
                        <h3>{t('pitch.fit.for_title')}</h3>
                        <ul>
                            {forItems.map((x) => <li key={x}>{x}</li>)}
                        </ul>
                    </div>
                    <div className="pitch-card pitch-fit pitch-fit--no" data-animate>
                        <h3>{t('pitch.fit.not_title')}</h3>
                        <ul>
                            {notItems.map((x) => <li key={x}>{x}</li>)}
                        </ul>
                    </div>
                </div>

                <h2 className="section-title pitch-faq-title" data-animate>{t('pitch.faq.title')}</h2>
                <div className="pitch-faq">
                    {faq.map((item) => (
                        <details className="pitch-faq-item" key={item.q} data-animate>
                            <summary>{item.q}</summary>
                            <p>{item.a}</p>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    );
}

export function FinalCta() {
    const { t } = useTranslation();
    const mailto = `mailto:soareslucas031@gmail.com?subject=${encodeURIComponent(t('hero.mail_subject'))}`;

    return (
        <section className="section pitch-cta">
            <div className="container" data-animate>
                <h2>{t('pitch.cta.title')}</h2>
                <p>{t('pitch.cta.text')}</p>
                <div className="hero-buttons">
                    <a href={mailto} className="btn btn-primary">{t('pitch.cta.btn')} ↗</a>
                    <a
                        href="https://www.linkedin.com/in/lucas-oliveira-a369ab208/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary"
                    >
                        LinkedIn ↗
                    </a>
                </div>
            </div>
        </section>
    );
}
