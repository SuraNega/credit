import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useLanguage } from '../context/LanguageContext';
import { customersAPI } from '../api/client';

export default function CustomerModal({ isOpen, onClose, customer = null, onSaved }) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    block: '',
    house_number: '',
    language: 'am',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        block: customer.block || '',
        house_number: customer.house_number || '',
        language: customer.language || 'am',
        notes: customer.notes || '',
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        block: '',
        house_number: '',
        language: 'am',
        notes: '',
      });
    }
    setError('');
  }, [customer, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError(t('common.required') + ': ' + t('customers.name'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      let saved;
      if (customer) {
        const res = await customersAPI.update(customer.id, formData);
        saved = res.data;
      } else {
        const res = await customersAPI.create(formData);
        saved = res.data;
      }
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save customer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? t('customers.editCustomer') : t('customers.addCustomer')}
    >
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          {error && (
            <div
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-danger-subtle)',
                color: 'var(--color-danger)',
                fontSize: '0.85rem',
                marginBottom: '1rem',
              }}
            >
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              <span>{t('customers.name')}</span>
              <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem' }}>*</span>
            </label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="e.g. Abebe Kebede"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('customers.phone')}</label>
            <input
              type="tel"
              className="form-input"
              placeholder="0911223344"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">{t('customers.block')}</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Block A"
                value={formData.block}
                onChange={(e) => setFormData({ ...formData, block: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('customers.houseNumber')}</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 12"
                value={formData.house_number}
                onChange={(e) => setFormData({ ...formData, house_number: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('customers.preferredLanguage')}</label>
            <select
              className="form-select"
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
            >
              <option value="am">አማርኛ (Amharic)</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('customers.notes')}</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Notes or special remarks..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
