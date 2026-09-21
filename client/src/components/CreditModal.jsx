import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { useLanguage } from '../context/LanguageContext';
import { creditsAPI, customersAPI } from '../api/client';
import { User, Phone, MapPin, Check, Sparkles, Clock, AlertCircle } from 'lucide-react';

export default function CreditModal({
  isOpen,
  onClose,
  customerId = null,
  credit = null,
  onSaved,
}) {
  const { t, formatCurrency } = useLanguage();

  // Autocomplete state
  const [customerName, setCustomerName] = useState('');
  const [matchingCustomers, setMatchingCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef(null);

  // Form fields
  const [phone, setPhone] = useState('');
  const [block, setBlock] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');
  const [creditDate, setCreditDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // When modal opens or props change
  useEffect(() => {
    if (isOpen) {
      if (credit) {
        setItem(credit.item || '');
        setAmount(credit.amount || '');
        setCreditDate(credit.credit_date ? credit.credit_date.split('T')[0] : '');
        setNotes(credit.notes || '');
      } else {
        setItem('');
        setAmount('');
        setCreditDate(new Date().toISOString().split('T')[0]);
        setNotes('');
      }

      if (customerId) {
        customersAPI
          .getById(customerId)
          .then((res) => {
            const c = res.data;
            setSelectedCustomer(c);
            setCustomerName(c.name);
            setPhone(c.phone || '');
            setBlock(c.block || '');
            setHouseNumber(c.house_number || '');
          })
          .catch(() => {});
      } else if (!credit) {
        setSelectedCustomer(null);
        setCustomerName('');
        setPhone('');
        setBlock('');
        setHouseNumber('');
      }
      setError('');
      setMatchingCustomers([]);
      setShowSuggestions(false);
    }
  }, [isOpen, customerId, credit]);

  // Live search autocomplete as user types name
  useEffect(() => {
    if (!isOpen || customerId || credit) return;

    const trimmed = customerName.trim();
    if (trimmed.length > 0 && (!selectedCustomer || selectedCustomer.name !== customerName)) {
      const timer = setTimeout(() => {
        customersAPI
          .list({ search: trimmed, limit: 6 })
          .then((res) => {
            const list = res.data.customers || [];
            setMatchingCustomers(list);
            setShowSuggestions(list.length > 0);
          })
          .catch(() => setMatchingCustomers([]));
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setMatchingCustomers([]);
      setShowSuggestions(false);
    }
  }, [customerName, selectedCustomer, isOpen, customerId, credit]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = (c) => {
    setSelectedCustomer(c);
    setCustomerName(c.name);
    setPhone(c.phone || '');
    setBlock(c.block || '');
    setHouseNumber(c.house_number || '');
    setShowSuggestions(false);
  };

  const handleNameChange = (val) => {
    setCustomerName(val);
    if (selectedCustomer && selectedCustomer.name !== val) {
      setSelectedCustomer(null); // Back to new customer mode
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!customerName.trim()) {
      setError(t('common.required') + ': ' + t('credits.customerName'));
      return;
    }
    if (!item.trim()) {
      setError(t('common.required') + ': ' + t('credits.item'));
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError(t('common.required') + ': ' + t('credits.amount'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      let targetCustId = selectedCustomer?.id || customerId;

      // If new customer, auto-register them first!
      if (!targetCustId) {
        const createRes = await customersAPI.create({
          name: customerName.trim(),
          phone: phone.trim() || null,
          block: block.trim() || null,
          house_number: houseNumber.trim() || null,
          language: 'am',
        });
        targetCustId = createRes.data.id;
      }

      const payload = {
        item: item.trim(),
        amount: parseFloat(amount),
        credit_date: creditDate ? new Date(creditDate).toISOString() : new Date().toISOString(),
        notes: notes.trim() || null,
      };

      let res;
      if (credit) {
        res = await creditsAPI.update(credit.id, payload);
      } else {
        res = await creditsAPI.create(targetCustId, payload);
      }

      onSaved(res.data);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record credit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={credit ? t('credits.editCredit') : t('credits.modalTitle')}
      maxWidth="540px"
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
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Customer Name with Typeahead Suggestions */}
          <div className="form-group" style={{ position: 'relative' }} ref={dropdownRef}>
            <label className="form-label">
              <span>{t('credits.customerName')}</span>
              <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem' }}>*</span>
            </label>
            <div className="search-wrapper">
              <User size={18} className="search-icon" />
              <input
                type="text"
                className="form-input search-input"
                required
                placeholder={t('credits.customerPlaceholder')}
                value={customerName}
                onChange={(e) => handleNameChange(e.target.value)}
                onFocus={() => {
                  if (matchingCustomers.length > 0) setShowSuggestions(true);
                }}
                disabled={Boolean(credit)}
                autoComplete="off"
              />
            </div>

            {/* Suggestions Popover */}
            {showSuggestions && matchingCustomers.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 20,
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  marginTop: '4px',
                  maxHeight: '220px',
                  overflowY: 'auto',
                }}
              >
                <div style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
                  {t('credits.existingCustomer')}
                </div>
                {matchingCustomers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectSuggestion(c)}
                    style={{
                      padding: '0.65rem 0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {c.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {c.phone || 'No phone'} {c.block ? `• ${c.block}` : ''} {c.house_number ? `#${c.house_number}` : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: parseFloat(c.balance || 0) > 0 ? 'var(--color-danger)' : 'var(--color-primary)' }}>
                        {formatCurrency(c.balance || 0)}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {t('credits.currentDebt')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Existing Customer Status Banner */}
            {selectedCustomer && (
              <div
                style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-primary-subtle)',
                  color: 'var(--color-primary)',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Check size={14} />
                  <span>{t('credits.existingCustomer')}: <strong>{selectedCustomer.name}</strong></span>
                </div>
                <div>
                  {t('credits.currentDebt')}: <strong>{formatCurrency(selectedCustomer.balance || 0)}</strong>
                </div>
              </div>
            )}

            {!selectedCustomer && customerName.trim().length > 1 && !showSuggestions && (
              <div
                style={{
                  marginTop: '0.4rem',
                  padding: '0.4rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-hover)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Sparkles size={13} style={{ color: 'var(--color-accent)' }} />
                <span>{t('credits.newCustomer')}</span>
              </div>
            )}
          </div>

          {/* Phone & Block/House (for quick customer details) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.65rem' }}>
            <div className="form-group">
              <label className="form-label">{t('credits.phone')}</label>
              <input
                type="tel"
                className="form-input"
                placeholder={t('credits.phonePlaceholder')}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('credits.block')}</label>
              <input
                type="text"
                className="form-input"
                placeholder="Block A"
                value={block}
                onChange={(e) => setBlock(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('credits.houseNumber')}</label>
              <input
                type="text"
                className="form-input"
                placeholder="#12"
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value)}
              />
            </div>
          </div>

          {/* Item Taken & Amount */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">
                <span>{t('credits.item')}</span>
                <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                required
                placeholder={t('credits.itemPlaceholder')}
                value={item}
                onChange={(e) => setItem(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>{t('credits.amount')} ({t('app.currency')})</span>
                <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem' }}>*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                required
                placeholder={t('credits.amountPlaceholder')}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-danger)' }}
              />
            </div>
          </div>

          {/* Date Taken */}
          <div className="form-group">
            <label className="form-label">{t('credits.creditDate')}</label>
            <input
              type="date"
              className="form-input"
              value={creditDate}
              onChange={(e) => setCreditDate(e.target.value)}
            />
          </div>

          {/* Optional Notes */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('credits.notes')}</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="e.g. Will pay at the end of the month..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t('common.saving') : t('credits.recordCredit')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
