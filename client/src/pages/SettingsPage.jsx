import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/client';
import { User, Lock, Globe, Check, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const { t, lang, setLang } = useLanguage();
  const { user, updateUser } = useAuth();

  // Profile Form
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileLang, setProfileLang] = useState(user?.language || lang || 'en');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState(false);
  const [passError, setPassError] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess(false);
    setProfileError('');

    try {
      const res = await authAPI.updateProfile({
        name: profileName,
        language: profileLang,
      });
      updateUser(res.data);
      setLang(profileLang);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPassError(t('settings.passwordMismatch'));
      return;
    }

    setPassLoading(true);
    setPassSuccess(false);
    setPassError('');

    try {
      await authAPI.updateProfile({
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPassSuccess(true);
      setTimeout(() => setPassSuccess(false), 3000);
    } catch (err) {
      setPassError(err.message || 'Failed to update password.');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="settings-page" style={{ maxWidth: '680px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('settings.title')}</h1>
        </div>
      </div>

      {/* Profile Section */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <User size={20} style={{ color: 'var(--color-primary)' }} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {t('settings.profileInfo')}
          </h2>
        </div>

        {profileSuccess && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary-subtle)',
              color: 'var(--color-primary)',
              fontSize: '0.875rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Check size={16} />
            <span>{t('settings.profileUpdated')}</span>
          </div>
        )}

        {profileError && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-danger-subtle)',
              color: 'var(--color-danger)',
              fontSize: '0.875rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{profileError}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile}>
          <div className="form-group">
            <label className="form-label">{t('settings.fullName')}</label>
            <input
              type="text"
              className="form-input"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('settings.username')}</label>
            <input
              type="text"
              className="form-input"
              value={user?.username || ''}
              disabled
              style={{ opacity: 0.7, cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Globe size={15} />
                <span>{t('settings.languagePref')}</span>
              </span>
            </label>
            <select
              className="form-select"
              value={profileLang}
              onChange={(e) => setProfileLang(e.target.value)}
            >
              <option value="am">አማርኛ (Amharic)</option>
              <option value="en">English</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" disabled={profileLoading}>
            {profileLoading ? t('common.saving') : t('settings.saveChanges')}
          </button>
        </form>
      </div>

      {/* Password Change Section */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <Lock size={20} style={{ color: 'var(--color-accent)' }} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {t('settings.security')}
          </h2>
        </div>

        {passSuccess && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary-subtle)',
              color: 'var(--color-primary)',
              fontSize: '0.875rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Check size={16} />
            <span>{t('settings.passwordUpdated')}</span>
          </div>
        )}

        {passError && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-danger-subtle)',
              color: 'var(--color-danger)',
              fontSize: '0.875rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{passError}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePassword}>
          <div className="form-group">
            <label className="form-label">{t('settings.currentPassword')}</label>
            <input
              type="password"
              className="form-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('settings.newPassword')}</label>
            <input
              type="password"
              className="form-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('settings.confirmNewPassword')}</label>
            <input
              type="password"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="btn btn-secondary" disabled={passLoading}>
            {passLoading ? t('common.saving') : t('settings.changePassword')}
          </button>
        </form>
      </div>
    </div>
  );
}
