import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const { t, i18n } = useTranslation();

    const isActive = (path) => location.pathname === path;

    const toggleLanguage = () => {
        const languages = ['pt', 'en', 'es'];
        const currentIndex = languages.indexOf(i18n.language);
        const nextIndex = (currentIndex + 1) % languages.length;
        i18n.changeLanguage(languages[nextIndex]);
    };

    const navLinks = [
        { path: '/', label: t('nav.home') },
        { path: '/engenharia', label: t('nav.engineering') },
        { path: '/tech', label: t('nav.tech') },
        { path: '/sobre', label: t('nav.about') },
    ];

    return (
        <nav className="navbar">
            <div className="container">
                <Link to="/" className="navbar-logo" style={{ display: 'flex', alignItems: 'center' }}>
                    <img src="/logo.png" alt="Logo" style={{ height: '45px', width: 'auto' }} />
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

                    <button onClick={toggleLanguage} className="lang-switcher">
                        {i18n.language.toUpperCase()}
                    </button>
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
