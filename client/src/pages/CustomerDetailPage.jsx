import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { customersAPI, creditsAPI, paymentsAPI, activityAPI } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import CustomerModal from '../components/CustomerModal';
import CreditModal from '../components/CreditModal';
import PaymentModal from '../components/PaymentModal';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  Trash2,
  Ban,
  CheckCircle2,
  PlusCircle,
  Receipt,
  Clock,
} from 'lucide-react';

export default function CustomerDetailPage({ customerId, onBack }) {
  const { t, formatCurrency, formatDate } = useLanguage();

  const [customer, setCustomer] = useState(null);
  const [credits, setCredits] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activeTab, setActiveTab] = useState('credits'); // 'credits' | 'payments' | 'activity'
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedCreditForEdit, setSelectedCreditForEdit] = useState(null);

  // Dialogs state
  const [confirmDeleteCustomer, setConfirmDeleteCustomer] = useState(false);
  const [confirmDeleteCredit, setConfirmDeleteCredit] = useState(null);
  const [confirmDeletePayment, setConfirmDeletePayment] = useState(null);
  const [confirmToggleBlacklist, setConfirmToggleBlacklist] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      const [custRes, credRes, payRes, actRes] = await Promise.all([
        customersAPI.getById(customerId),
        creditsAPI.listByCustomer(customerId),
        paymentsAPI.listByCustomer(customerId),
        activityAPI.listByCustomer(customerId),
      ]);

      setCustomer(custRes.data);
      setCredits(credRes.data || []);
      setPayments(payRes.data || []);
      setActivities(actRes.data || []);
    } catch (err) {
      console.error('Failed to load customer details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchCustomerDetails();
    }
  }, [customerId]);

  const handleDeleteCustomer = async () => {
    try {
      setDialogLoading(true);
      await customersAPI.delete(customerId);
      setConfirmDeleteCustomer(false);
      onBack();
    } catch (err) {
      alert(err.message);
    } finally {
      setDialogLoading(false);
    }
  };

  const handleToggleBlacklist = async () => {
    try {
      setDialogLoading(true);
      const newStatus = customer.status === 'blacklisted' ? 'active' : 'blacklisted';
      const reason = newStatus === 'blacklisted' ? 'Marked as untrusted / overdue' : null;
      await customersAPI.updateStatus(customerId, newStatus, reason);
      setConfirmToggleBlacklist(false);
      fetchCustomerDetails();
    } catch (err) {
      alert(err.message);
    } finally {
      setDialogLoading(false);
    }
  };

  const handleDeleteCredit = async () => {
    if (!confirmDeleteCredit) return;
    try {
      setDialogLoading(true);
      await creditsAPI.delete(confirmDeleteCredit);
      setConfirmDeleteCredit(null);
      fetchCustomerDetails();
    } catch (err) {
      alert(err.message);
    } finally {
      setDialogLoading(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!confirmDeletePayment) return;
    try {
      setDialogLoading(true);
      await paymentsAPI.delete(confirmDeletePayment);
      setConfirmDeletePayment(null);
      fetchCustomerDetails();
    } catch (err) {
      alert(err.message);
    } finally {
      setDialogLoading(false);
    }
  };

  if (loading && !customer) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        {t('common.loading')}
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        <p>{t('customers.noCustomersFound')}</p>
        <button className="btn btn-secondary" onClick={onBack} style={{ marginTop: '1rem' }}>
          {t('customerDetail.back')}
        </button>
      </div>
    );
  }

  const balance = parseFloat(customer.balance || 0);
  const totalCreditSum = parseFloat(customer.total_credit || 0);
  const totalPaidSum = parseFloat(customer.total_paid || 0);
  const isBlacklisted = customer.status === 'blacklisted';

  return (
    <div className="customer-detail-page">
      {/* Back Button */}
      <div style={{ marginBottom: '1.25rem' }}>
        <button
          className="btn btn-sm btn-secondary"
          onClick={onBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ArrowLeft size={16} />
          <span>{t('customerDetail.back')}</span>
        </button>
      </div>

      {/* Customer Profile Header Card */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.75rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                className="customer-avatar"
                style={{ width: '56px', height: '56px', fontSize: '1.4rem' }}
              >
                {customer.name.charAt(0).toUpperCase()}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {customer.name}
                  </h1>
                  <StatusBadge status={customer.status} type="customer" />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.35rem', flexWrap: 'wrap', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {customer.phone && (
                    <a
                      href={`tel:${customer.phone}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        color: 'var(--color-primary)',
                        fontWeight: 500,
                      }}
                    >
                      <Phone size={14} />
                      <span>{customer.phone}</span>
                    </a>
                  )}

                  {(customer.block || customer.house_number) && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <MapPin size={14} />
                      <span>
                        {customer.block ? `${customer.block}` : ''}
                        {customer.block && customer.house_number ? ', ' : ''}
                        {customer.house_number ? `#${customer.house_number}` : ''}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setIsEditModalOpen(true)}
                title={t('customers.edit')}
              >
                <Edit2 size={15} />
                <span>{t('customers.edit')}</span>
              </button>

              <button
                className={`btn btn-sm ${isBlacklisted ? 'btn-secondary' : 'btn-outline-danger'}`}
                onClick={() => setConfirmToggleBlacklist(true)}
                title={isBlacklisted ? t('customers.activate') : t('customers.blacklist')}
              >
                {isBlacklisted ? <CheckCircle2 size={15} /> : <Ban size={15} />}
                <span>{isBlacklisted ? t('customers.activate') : t('customers.blacklist')}</span>
              </button>

              <button
                className="btn-icon"
                onClick={() => setConfirmDeleteCustomer(true)}
                title={t('customers.delete')}
                style={{ color: 'var(--color-danger)' }}
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>

          {/* Notes or Blacklist reason alert */}
          {isBlacklisted && customer.blacklist_reason && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-danger-subtle)',
                color: 'var(--color-danger)',
                fontSize: '0.85rem',
              }}
            >
              <strong>{t('customers.blacklistReason')}:</strong> {customer.blacklist_reason}
            </div>
          )}

          {customer.notes && (
            <div
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                fontStyle: 'italic',
                background: 'var(--bg-surface-elevated)',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
              }}
            >
              "{customer.notes}"
            </div>
          )}

          {/* Balance & Totals Ribbon */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                {t('customerDetail.balanceDue')}
              </div>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  marginTop: '0.2rem',
                  color: balance > 0 ? 'var(--color-danger)' : 'var(--color-primary)',
                }}
              >
                {formatCurrency(balance)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                {t('customerDetail.totalCredits')}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: '0.2rem', color: 'var(--text-primary)' }}>
                {formatCurrency(totalCreditSum)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                {t('customerDetail.totalPayments')}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: '0.2rem', color: 'var(--color-primary)' }}>
                {formatCurrency(totalPaidSum)}
              </div>
            </div>

            {/* Quick action buttons right next to the balance */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'center' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setSelectedCreditForEdit(null);
                  setIsCreditModalOpen(true);
                }}
                disabled={isBlacklisted}
              >
                <PlusCircle size={15} />
                <span>{t('customerDetail.addCreditBtn')}</span>
              </button>

              <button
                className="btn btn-sm"
                style={{ background: 'var(--color-info)', color: '#fff' }}
                onClick={() => setIsPaymentModalOpen(true)}
              >
                <Receipt size={15} />
                <span>{t('customerDetail.addPaymentBtn')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'credits' ? 'active' : ''}`}
          onClick={() => setActiveTab('credits')}
        >
          {t('customerDetail.tabs.credits')} ({credits.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          {t('customerDetail.tabs.payments')} ({payments.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          {t('customerDetail.tabs.activity')} ({activities.length})
        </button>
      </div>

      {/* TAB 1: CREDITS */}
      {activeTab === 'credits' && (
        <div>
          {credits.length === 0 ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>{t('customerDetail.noCredits')}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('credits.item')}</th>
                    <th>{t('credits.amount')}</th>
                    <th>{t('credits.paid')}</th>
                    <th>{t('credits.remaining')}</th>
                    <th>{t('credits.status')}</th>
                    <th>{t('credits.creditDate')}</th>
                    <th style={{ textAlign: 'right' }}>{t('customers.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {credits.map((cr) => (
                    <tr key={cr.id}>
                      <td style={{ fontWeight: 600 }}>{cr.item}</td>
                      <td>{formatCurrency(cr.amount)}</td>
                      <td style={{ color: 'var(--color-primary)' }}>{formatCurrency(cr.paid_amount)}</td>
                      <td style={{ fontWeight: 700, color: cr.remaining > 0 ? 'var(--color-danger)' : 'var(--color-primary)' }}>
                        {formatCurrency(cr.remaining)}
                      </td>
                      <td>
                        <StatusBadge status={cr.status} type="credit" />
                      </td>
                      <td>{formatDate(cr.credit_date)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                          <button
                            className="btn-icon"
                            onClick={() => {
                              setSelectedCreditForEdit(cr);
                              setIsCreditModalOpen(true);
                            }}
                            title={t('credits.editCredit')}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => setConfirmDeleteCredit(cr.id)}
                            title={t('credits.deleteCredit')}
                            style={{ color: 'var(--color-danger)' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PAYMENTS */}
      {activeTab === 'payments' && (
        <div>
          {payments.length === 0 ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>{t('customerDetail.noPayments')}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('payments.amountPaid')}</th>
                    <th>{t('payments.paymentDate')}</th>
                    <th>{t('payments.linkedCredit')}</th>
                    <th>{t('payments.notes')}</th>
                    <th style={{ textAlign: 'right' }}>{t('customers.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1rem' }}>
                        +{formatCurrency(p.amount_paid)}
                      </td>
                      <td>{formatDate(p.payment_date)}</td>
                      <td>{p.credit_item ? `"${p.credit_item}"` : t('payments.allGeneral')}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{p.notes || '—'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn-icon"
                          onClick={() => setConfirmDeletePayment(p.id)}
                          title={t('payments.deletePayment')}
                          style={{ color: 'var(--color-danger)' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ACTIVITY */}
      {activeTab === 'activity' && (
        <div className="card">
          {activities.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>{t('activity.empty')}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {activities.map((act) => (
                <div
                  key={act.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    paddingBottom: '0.85rem',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-surface-elevated)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-primary)',
                      flexShrink: 0,
                    }}
                  >
                    <Clock size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {act.details}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {formatDate(act.created_at)} • {act.user_name || 'Admin'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals & Dialogs */}
      <CustomerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        customer={customer}
        onSaved={fetchCustomerDetails}
      />

      <CreditModal
        isOpen={isCreditModalOpen}
        onClose={() => {
          setIsCreditModalOpen(false);
          setSelectedCreditForEdit(null);
        }}
        customerId={customerId}
        credit={selectedCreditForEdit}
        onSaved={fetchCustomerDetails}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        customerId={customerId}
        onSaved={fetchCustomerDetails}
      />

      <ConfirmDialog
        isOpen={confirmDeleteCustomer}
        onClose={() => setConfirmDeleteCustomer(false)}
        onConfirm={handleDeleteCustomer}
        title={t('customers.delete')}
        message={t('customers.confirmDelete')}
        confirmLabel={t('common.delete')}
        loading={dialogLoading}
      />

      <ConfirmDialog
        isOpen={confirmToggleBlacklist}
        onClose={() => setConfirmToggleBlacklist(false)}
        onConfirm={handleToggleBlacklist}
        title={isBlacklisted ? t('customers.activate') : t('customers.blacklist')}
        message={
          isBlacklisted
            ? 'Restore this customer to Active status so they can take credit again?'
            : 'Blacklisting will prevent this customer from receiving new credit until unblocked.'
        }
        confirmLabel={isBlacklisted ? t('customers.activate') : t('customers.blacklist')}
        isDestructive={!isBlacklisted}
        loading={dialogLoading}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmDeleteCredit)}
        onClose={() => setConfirmDeleteCredit(null)}
        onConfirm={handleDeleteCredit}
        title={t('credits.deleteCredit')}
        message={t('credits.confirmDeleteCredit')}
        confirmLabel={t('common.delete')}
        loading={dialogLoading}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmDeletePayment)}
        onClose={() => setConfirmDeletePayment(null)}
        onConfirm={handleDeletePayment}
        title={t('payments.deletePayment')}
        message={t('payments.confirmDeletePayment')}
        confirmLabel={t('common.delete')}
        loading={dialogLoading}
      />
    </div>
  );
}
