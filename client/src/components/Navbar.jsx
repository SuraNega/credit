import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  History,
  Settings,
  Sun,
  Moon,
  LogOut,
  Globe,
  CreditCard,
} from 'lucide-react';

export default function Navbar({ activePage, setActivePage }) {
  const { t, lang, toggleLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'customers', label: t('nav.customers'), icon: Users },
    { id: 'activity', label: t('nav.activity'), icon: History },
    { id: 'settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <header className="navbar">
      <div className="nav-brand" role="button" onClick={() => setActivePage('dashboard')} style={{ cursor: 'pointer' }}>
        <div className="brand-icon-wrap">
          <CreditCard size={20} />
        </div>
        <span className="brand-text">{t('app.title')}</span>
      </div>

      <nav className="nav-links">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              className={`nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="nav-actions">
        {/* Language Switcher Pill */}
        <button
          className="lang-toggle-btn"
          onClick={toggleLang}
          title={lang === 'en' ? 'ወደ አማርኛ ቀይር' : 'Switch to English'}
          aria-label="Toggle language"
        >
          <Globe size={15} />
          <span>{lang === 'en' ? 'አማርኛ' : 'English'}</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          className="btn-icon"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        {/* User Info & Logout */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: '0.5rem' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'var(--color-primary-subtle)',
                border: '1px solid var(--color-primary)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '0.85rem',
              }}
              title={user.name || user.username}
            >
              {(user.name || user.username || 'D').charAt(0).toUpperCase()}
            </div>

            <button
              className="btn-icon"
              onClick={logout}
              title={t('nav.logout')}
              aria-label={t('nav.logout')}
              style={{ color: 'var(--color-danger)' }}
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
