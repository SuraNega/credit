import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useLanguage } from '../context/LanguageContext';
import { customersAPI } from '../api/client';
import EthiopianPhoneInput from './EthiopianPhoneInput';
import { isValidEthiopianPhone } from '../utils/phone';

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
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setError(t('common.required') + ': ' + t('customers.name') + ' (min 2 characters)');
      return;
    }

    if (!formData.phone || !isValidEthiopianPhone(formData.phone)) {
      setError(t('customers.phoneInvalidCarrier') + ' — ' + t('customers.phoneIncomplete'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        block: formData.block.trim() || null,
        house_number: formData.house_number.trim() || null,
        language: formData.language || 'am',
        notes: formData.notes.trim() || null,
      };

      let saved;
      if (customer) {
        const res = await customersAPI.update(customer.id, payload);
        saved = res.data;
      } else {
        const res = await customersAPI.create(payload);
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
      maxWidth="500px"
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

          <EthiopianPhoneInput
            value={formData.phone}
            required
            onChange={(normalizedPhone) => setFormData({ ...formData, phone: normalizedPhone })}
          />

          <div className="form-grid-2">
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
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading} style={{ flex: '1 1 auto' }}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: '1 1 auto' }}>
            {loading ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
