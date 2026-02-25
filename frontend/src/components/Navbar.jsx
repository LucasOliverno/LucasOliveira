import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLangOpen, setIsLangOpen] = useState(false);
    const location = useLocation();
    const { t, i18n } = useTranslation();
    const langDropdownRef = useRef(null);

    const isActive = (path) => location.pathname === path;

    const changeLanguage = (lang) => {
        i18n.changeLanguage(lang);
        setIsLangOpen(false);
    };

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
                setIsLangOpen(false);
            }
        };

        if (isLangOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isLangOpen]);

    const languages = [
        { code: 'pt', label: 'PT - Português' },
        { code: 'en', label: 'EN - English' },
        { code: 'es', label: 'ES - Español' },
    ];

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

                    <div className="lang-dropdown-wrapper" ref={langDropdownRef}>
                        <button
                            onClick={() => setIsLangOpen(!isLangOpen)}
                            className="lang-switcher"
                            aria-haspopup="true"
                            aria-expanded={isLangOpen}
                        >
                            {i18n.language.toUpperCase()}
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ transform: isLangOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                            >
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>

                        {isLangOpen && (
                            <div className="lang-dropdown-menu">
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => changeLanguage(lang.code)}
                                        className={i18n.language === lang.code ? 'active' : ''}
                                    >
                                        {lang.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
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
