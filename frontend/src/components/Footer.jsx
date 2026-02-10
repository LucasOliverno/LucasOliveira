import { useTranslation } from 'react-i18next';

function Footer() {
    const { t } = useTranslation();

    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    <div className="footer-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        <img src="/logo.png" alt="Logo" style={{ height: '50px', width: 'auto' }} />
                        <p>{t('footer.subtitle')}</p>
                    </div>

                    <div className="footer-links">
                        <a href="https://github.com/LucasOliverno/" target="_blank" rel="noopener noreferrer">GitHub</a>
                        <a href="https://www.linkedin.com/in/lucas-oliveira-a369ab208/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} Lucas Oliveira. {t('nav.home')}.</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
