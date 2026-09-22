import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { CreditCard, Sun, Moon, Globe, Lock, User, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const { t, lang, toggleLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    setError('');

    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setUsername('admin');
    setPassword('admin123');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1rem',
        background: 'radial-gradient(ellipse at top, rgba(16, 185, 129, 0.15), transparent 70%), var(--bg-app)',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Bar with Language & Theme Switches */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '460px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div className="brand-icon-wrap" style={{ width: '32px', height: '32px' }}>
            <CreditCard size={17} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            {t('app.title')}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button className="lang-toggle-btn" onClick={toggleLang}>
            <Globe size={13} />
            <span>{lang === 'en' ? 'አማርኛ' : 'EN'}</span>
          </button>
          <button className="btn-icon" onClick={toggleTheme} style={{ minWidth: '32px', minHeight: '32px', padding: '0.35rem' }}>
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      {/* Center Card */}
      <div style={{ width: '100%', maxWidth: '440px', margin: '1.5rem auto' }}>
        <div className="card card-glass" style={{ padding: '1.5rem 1.25rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>
              {t('auth.welcomeBack')}
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
              {t('auth.loginSubtitle')}
            </p>
          </div>

          {error && (
            <div
              style={{
                padding: '0.75rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-danger-subtle)',
                color: 'var(--color-danger)',
                fontSize: '0.85rem',
                marginBottom: '1rem',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">{t('auth.username')}</label>
              <div className="search-wrapper">
                <User size={17} className="search-icon" />
                <input
                  type="text"
                  className="form-input search-input"
                  required
                  placeholder={t('auth.usernamePlaceholder')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">{t('auth.password')}</label>
              <div className="search-wrapper">
                <Lock size={17} className="search-icon" />
                <input
                  type="password"
                  className="form-input search-input"
                  required
                  placeholder={t('auth.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '0.7rem', fontSize: '0.95rem', fontWeight: 600 }}
            >
              {loading ? t('auth.loggingIn') : t('auth.loginBtn')}
            </button>
          </form>

          {/* Quick Demo Credentials Autofill */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleFillDemo}
              style={{ width: '100%', fontSize: '0.8rem' }}
            >
              <Sparkles size={14} style={{ color: 'var(--color-warning)' }} />
              <span>{t('auth.demoCredentials')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        © {new Date().getFullYear()} {t('app.title')} — {t('app.subtitle')}
      </footer>
    </div>
  );
}
