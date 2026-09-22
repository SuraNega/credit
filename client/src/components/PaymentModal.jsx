import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useLanguage } from '../context/LanguageContext';
import { paymentsAPI, customersAPI, creditsAPI } from '../api/client';
import confetti from 'canvas-confetti';
import { User, Wallet, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PaymentModal({
  isOpen,
  onClose,
  customerId = null,
  onSaved,
}) {
  const { t, formatCurrency } = useLanguage();

  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customerId || '');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerCredits, setCustomerCredits] = useState([]);

  const [amountPaid, setAmountPaid] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [creditTransactionId, setCreditTransactionId] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (!customerId) {
        customersAPI
          .list({ limit: 100 })
          .then((res) => {
            const list = res.data.customers || [];
            setCustomers(list);
          })
          .catch(() => {});
      }
      setAmountPaid('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setCreditTransactionId('');
      setNotes('');
      setError('');
    }
  }, [isOpen, customerId]);

  useEffect(() => {
    const activeCustId = customerId || selectedCustomerId;
    if (activeCustId && isOpen) {
      Promise.all([
        customersAPI.getById(activeCustId),
        creditsAPI.listByCustomer(activeCustId),
      ])
        .then(([custRes, credRes]) => {
          const cust = custRes.data;
          setSelectedCustomer(cust);
          const activeCredits = (credRes.data || []).filter((c) => c.status !== 'paid');
          setCustomerCredits(activeCredits);

          const bal = parseFloat(cust.balance || 0);
          if (bal > 0) {
            setAmountPaid(bal.toString());
          }
        })
        .catch(() => {
          setSelectedCustomer(null);
          setCustomerCredits([]);
        });
    } else {
      setSelectedCustomer(null);
      setCustomerCredits([]);
      setAmountPaid('');
    }
  }, [customerId, selectedCustomerId, isOpen]);

  const handlePayFull = () => {
    if (selectedCustomer) {
      const bal = parseFloat(selectedCustomer.balance || 0);
      setAmountPaid(bal > 0 ? bal.toString() : '');
    }
  };

  const currentDebt = parseFloat(selectedCustomer?.balance || 0);
  const numPaid = parseFloat(amountPaid) || 0;
  const remainingDebt = Math.max(0, currentDebt - numPaid);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const activeCustId = customerId || selectedCustomerId;

    if (!activeCustId) {
      setError(t('common.selectCustomer'));
      return;
    }
    if (!amountPaid || parseFloat(amountPaid) <= 0) {
      setError(t('common.required') + ': ' + t('payments.amountPaid'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        amount_paid: parseFloat(amountPaid),
        payment_date: paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString(),
        credit_transaction_id: creditTransactionId ? parseInt(creditTransactionId) : null,
        notes: notes.trim() || null,
      };

      const res = await paymentsAPI.create(activeCustId, payload);

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {
        // ignore if not supported
      }

      onSaved(res.data);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('payments.modalTitle')} maxWidth="520px">
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

          {/* Customer Selection if not pre-passed */}
          {!customerId && (
            <div className="form-group">
              <label className="form-label">
                <span>{t('payments.selectCustomer')}</span>
                <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem' }}>*</span>
              </label>
              <select
                className="form-select"
                required
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
              >
                <option value="">-- {t('payments.selectCustomerPlaceholder')} --</option>
                {customers.map((c) => {
                  const bal = parseFloat(c.balance || 0);
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''} — Debt: {formatCurrency(bal)}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Current Debt Banner & Pay Full Button */}
          {selectedCustomer && (
            <div
              style={{
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: currentDebt > 0 ? 'var(--color-danger-subtle)' : 'var(--color-primary-subtle)',
                border: '1px solid ' + (currentDebt > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'),
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: currentDebt > 0 ? 'var(--color-danger)' : 'var(--color-primary)', fontWeight: 600 }}>
                    {t('payments.currentDebt')}
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: currentDebt > 0 ? 'var(--color-danger)' : 'var(--color-primary)', lineHeight: 1.1 }}>
                    {formatCurrency(currentDebt)}
                  </div>
                </div>

                {currentDebt > 0 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={handlePayFull}
                  >
                    <CheckCircle2 size={14} />
                    <span>{t('payments.payFull')}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Specific Credit Item Selection (Optional) */}
          {customerCredits.length > 0 && (
            <div className="form-group">
              <label className="form-label">{t('payments.linkedCredit')}</label>
              <select
                className="form-select"
                value={creditTransactionId}
                onChange={(e) => {
                  const val = e.target.value;
                  setCreditTransactionId(val);
                  if (val) {
                    const found = customerCredits.find((c) => c.id === parseInt(val));
                    if (found) setAmountPaid(found.remaining.toString());
                  }
                }}
              >
                <option value="">{t('payments.allGeneral')}</option>
                {customerCredits.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.item} (Remaining: {formatCurrency(c.remaining)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Amount Paid Field */}
          <div className="form-group">
            <label className="form-label">
              <span>{t('payments.amountPaid')} ({t('app.currency')})</span>
              <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem' }}>*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="form-input"
              required
              placeholder={t('payments.amountPaidPlaceholder')}
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--color-primary)' }}
            />
          </div>

          {/* Live Remaining Balance Calculation Preview */}
          {selectedCustomer && currentDebt > 0 && numPaid > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.6rem 0.8rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.82rem',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '0.35rem',
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>Remaining after payment:</span>
              <strong style={{ color: remainingDebt === 0 ? 'var(--color-primary)' : 'var(--color-warning)' }}>
                {remainingDebt === 0 ? '0.00 ' + t('app.currency') + ' (Fully Cleared! 🎉)' : formatCurrency(remainingDebt)}
              </strong>
            </div>
          )}

          {/* Payment Date */}
          <div className="form-group">
            <label className="form-label">{t('payments.paymentDate')}</label>
            <input
              type="date"
              className="form-input"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('payments.notes')}</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="e.g. Paid in cash, via CBE Birr, Telebirr..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading} style={{ flex: '1 1 auto' }}>
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !selectedCustomer}
            style={{ flex: '1 1 auto' }}
          >
            {loading ? t('common.saving') : t('payments.recordPayment')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
