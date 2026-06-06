import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const { t, i18n } = useTranslation();

    const isActive = (path) => location.pathname === path;

    const changeLanguage = (lang) => {
        i18n.changeLanguage(lang);
        setIsOpen(false);
    };

    const navLinks = [
        { path: '/projetos', label: t('nav.projects') },
        { path: '/blog', label: t('nav.blog') },
        { path: '/sobre', label: t('nav.about') },
    ];

    return (
        <nav className="navbar">
            <div className="container navbar-inner">
                <Link to="/" className="navbar-logo" onClick={() => setIsOpen(false)}>
                    <img src="/logo.png" alt="Lucas Oliveira" style={{ height: '40px', width: 'auto' }} />
                </Link>

                <div className={`navbar-links ${isOpen ? 'open' : ''}`}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={isActive(link.path) ? 'active' : ''}
                            onClick={() => setIsOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}

                    <div className="navbar-lang">
                        <button
                            onClick={() => changeLanguage('pt')}
                            className={i18n.language === 'pt' ? 'lang-btn active' : 'lang-btn'}
                        >
                            PT
                        </button>
                        <span className="lang-separator">|</span>
                        <button
                            onClick={() => changeLanguage('en')}
                            className={i18n.language === 'en' ? 'lang-btn active' : 'lang-btn'}
                        >
                            EN
                        </button>
                    </div>

                    <a
                        href="mailto:soareslucas031@gmail.com"
                        className="btn-contact"
                        onClick={() => setIsOpen(false)}
                    >
                        {t('nav.contact')}
                    </a>
                </div>

                <button
                    className="navbar-toggle"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        </nav>
    );
}

export default Navbar;
