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
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.5rem',
        background: 'radial-gradient(ellipse at top, rgba(16, 185, 129, 0.15), transparent 70%), var(--bg-app)',
      }}
    >
      {/* Top Bar with Language & Theme Switches */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '460px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="brand-icon-wrap" style={{ width: '34px', height: '34px' }}>
            <CreditCard size={18} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
            {t('app.title')}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button className="lang-toggle-btn" onClick={toggleLang}>
            <Globe size={14} />
            <span>{lang === 'en' ? 'አማርኛ' : 'EN'}</span>
          </button>
          <button className="btn-icon" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* Center Card */}
      <div style={{ width: '100%', maxWidth: '440px', margin: '2rem auto' }}>
        <div className="card card-glass" style={{ padding: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              {t('auth.welcomeBack')}
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              {t('auth.loginSubtitle')}
            </p>
          </div>

          {error && (
            <div
              style={{
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-danger-subtle)',
                color: 'var(--color-danger)',
                fontSize: '0.875rem',
                marginBottom: '1.25rem',
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
                <User size={18} className="search-icon" />
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

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">{t('auth.password')}</label>
              <div className="search-wrapper">
                <Lock size={18} className="search-icon" />
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
              style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', fontWeight: 600 }}
            >
              {loading ? t('auth.loggingIn') : t('auth.loginBtn')}
            </button>
          </form>

          {/* Quick Demo Credentials Autofill */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleFillDemo}
              style={{ width: '100%', fontSize: '0.8125rem' }}
            >
              <Sparkles size={14} style={{ color: 'var(--color-warning)' }} />
              {t('auth.demoCredentials')}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        © {new Date().getFullYear()} {t('app.title')} — {t('app.subtitle')}
      </footer>
    </div>
  );
}
