import React, { useState, useEffect, useTransition } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { customersAPI } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import CustomerModal from '../components/CustomerModal';
import CreditModal from '../components/CreditModal';
import PaymentModal from '../components/PaymentModal';
import { formatEthiopianPhone } from '../utils/phone';
import {
  Search,
  UserPlus,
  Phone,
  MapPin,
  Filter,
  Plus,
  Receipt,
  User,
} from 'lucide-react';

export default function CustomersPage({ onSelectCustomer }) {
  const { t, formatCurrency } = useLanguage();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'blacklisted' | 'has_debt'
  const [, startTransition] = useTransition();

  // Modals state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [actionCustomerId, setActionCustomerId] = useState(null);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await customersAPI.list({
        search: searchTerm,
        status: statusFilter === 'has_debt' ? undefined : statusFilter,
        limit: 200,
      });
      let list = res.data.customers || [];
      if (statusFilter === 'has_debt') {
        list = list.filter((c) => parseFloat(c.balance || 0) > 0);
      }
      setCustomers(list);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        fetchCustomers();
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter]);

  const handleOpenCredit = (e, custId) => {
    e.stopPropagation();
    setActionCustomerId(custId);
    setIsCreditModalOpen(true);
  };

  const handleOpenPayment = (e, custId) => {
    e.stopPropagation();
    setActionCustomerId(custId);
    setIsPaymentModalOpen(true);
  };

  return (
    <div className="customers-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('customers.title')}</h1>
          <p className="page-subtitle">{t('customers.subtitle')}</p>
        </div>

        <div className="page-actions">
          <button
            className="btn btn-primary"
            onClick={() => setIsCustomerModalOpen(true)}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <UserPlus size={18} />
            <span>{t('customers.addCustomer')}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '0.85rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-wrapper" style={{ flex: '1 1 240px' }}>
            <Search size={17} className="search-icon" />
            <input
              type="text"
              className="form-input search-input"
              placeholder={t('customers.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              paddingBottom: '2px',
              maxWidth: '100%',
              width: 'auto',
            }}
          >
            <Filter size={15} style={{ color: 'var(--text-muted)', flexShrink: 0, marginRight: '0.15rem' }} />
            <button
              className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter('all')}
              style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              {t('customers.allStatus')}
            </button>
            <button
              className={`btn btn-sm ${statusFilter === 'active' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter('active')}
              style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              {t('customers.active')}
            </button>
            <button
              className={`btn btn-sm ${statusFilter === 'has_debt' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter('has_debt')}
              style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              {t('customers.hasDebtOnly')}
            </button>
            <button
              className={`btn btn-sm ${statusFilter === 'blacklisted' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter('blacklisted')}
              style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              {t('customers.blacklisted')}
            </button>
          </div>
        </div>
      </div>

      {/* Customers List / Grid */}
      {loading ? (
        <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          {t('common.loading')}
        </div>
      ) : customers.length === 0 ? (
        <div className="card" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'var(--bg-surface-elevated)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.85rem',
              color: 'var(--text-muted)',
            }}
          >
            <User size={22} />
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {searchTerm || statusFilter !== 'all'
              ? t('customers.noCustomersFound')
              : t('customers.emptyState')}
          </p>
        </div>
      ) : (
        <div className="customer-grid">
          {customers.map((c) => {
            const bal = parseFloat(c.balance || 0);
            const hasDebt = bal > 0;

            return (
              <div
                key={c.id}
                className="card customer-card card-hover"
                onClick={() => onSelectCustomer(c.id)}
              >
                <div>
                  <div className="customer-card-header">
                    <div className="customer-card-info">
                      <div className="customer-avatar">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h2 className="customer-name">{c.name}</h2>
                        <div className="customer-sub">
                          {c.phone ? (
                            <>
                              <Phone size={12} style={{ flexShrink: 0 }} />
                              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {formatEthiopianPhone(c.phone)}
                              </span>
                            </>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>No phone</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={c.status} type="customer" />
                  </div>

                  {(c.block || c.house_number) && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                        marginTop: '0.65rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      <MapPin size={12} style={{ flexShrink: 0 }} />
                      <span>
                        {c.block ? `${c.block}` : ''}
                        {c.block && c.house_number ? ', ' : ''}
                        {c.house_number ? `House #${c.house_number}` : ''}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="customer-balance-box">
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {t('customers.balance')}
                    </span>
                    <span className={`customer-balance-val ${hasDebt ? 'balance-has-debt' : 'balance-cleared'}`}>
                      {formatCurrency(bal)}
                    </span>
                  </div>

                  {/* Quick card action buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem', marginTop: '0.65rem' }}>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={(e) => handleOpenCredit(e, c.id)}
                      disabled={c.status === 'blacklisted'}
                    >
                      <Plus size={14} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('credits.recordCredit')}</span>
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={(e) => handleOpenPayment(e, c.id)}
                    >
                      <Receipt size={14} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('payments.recordPayment')}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSaved={(newCust) => {
          fetchCustomers();
          if (newCust?.id) onSelectCustomer(newCust.id);
        }}
      />

      <CreditModal
        isOpen={isCreditModalOpen}
        onClose={() => {
          setIsCreditModalOpen(false);
          setActionCustomerId(null);
        }}
        customerId={actionCustomerId}
        onSaved={fetchCustomers}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setActionCustomerId(null);
        }}
        customerId={actionCustomerId}
        onSaved={fetchCustomers}
      />
    </div>
  );
}
