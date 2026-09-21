import React from 'react';
import Modal from './Modal';
import { useLanguage } from '../context/LanguageContext';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  isDestructive = true,
  loading = false,
}) {
  const { t } = useLanguage();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || t('common.confirm')} maxWidth="420px">
      <div className="modal-body" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div
          style={{
            padding: '0.65rem',
            borderRadius: 'var(--radius-md)',
            background: isDestructive ? 'var(--color-danger-subtle)' : 'var(--color-warning-subtle)',
            color: isDestructive ? 'var(--color-danger)' : 'var(--color-warning)',
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={24} />
        </div>
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: '1.5' }}>
            {message}
          </p>
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
          {t('common.cancel')}
        </button>
        <button
          className={`btn ${isDestructive ? 'btn-danger' : 'btn-primary'}`}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? t('common.loading') : confirmLabel || t('common.confirm')}
        </button>
      </div>
    </Modal>
  );
}
