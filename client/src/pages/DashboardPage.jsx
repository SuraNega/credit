import React, { useState, useEffect, useTransition } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, customersAPI, activityAPI } from '../api/client';
import StatCard from '../components/StatCard';
import CreditModal from '../components/CreditModal';
import PaymentModal from '../components/PaymentModal';
import {
  Wallet,
  Users,
  TrendingUp,
  PlusCircle,
  Receipt,
  Search,
  Phone,
  MapPin,
  Clock,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

export default function DashboardPage({ setActivePage, onSelectCustomer }) {
  const { t, formatCurrency, formatDate } = useLanguage();
  const { user } = useAuth();

  const [summary, setSummary] = useState(null);
  const [debtors, setDebtors] = useState([]);
  const [filteredDebtors, setFilteredDebtors] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  // Modals state
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedCustomerIdForAction, setSelectedCustomerIdForAction] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sumRes, debtorsRes, actRes] = await Promise.all([
        dashboardAPI.getSummary(),
        dashboardAPI.getTopDebtors(100),
        activityAPI.list({ limit: 6 }),
      ]);

      setSummary(sumRes.data);
      const withDebt = debtorsRes.data || [];
      setDebtors(withDebt);
      setFilteredDebtors(withDebt);
      setRecentActivities(actRes.data?.activities || []);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Filter debtors in real-time as user types
  useEffect(() => {
    startTransition(() => {
      const q = searchTerm.trim().toLowerCase();
      if (!q) {
        setFilteredDebtors(debtors);
      } else {
        setFilteredDebtors(
          debtors.filter(
            (d) =>
              d.name?.toLowerCase().includes(q) ||
              d.phone?.includes(q) ||
              d.block?.toLowerCase().includes(q) ||
              d.house_number?.toLowerCase().includes(q)
          )
        );
      }
    });
  }, [searchTerm, debtors]);

  const handleOpenCredit = (e, custId = null) => {
    if (e) e.stopPropagation();
    setSelectedCustomerIdForAction(custId);
    setIsCreditModalOpen(true);
  };

  const handleOpenPayment = (e, custId = null) => {
    if (e) e.stopPropagation();
    setSelectedCustomerIdForAction(custId);
    setIsPaymentModalOpen(true);
  };

  const outstanding = summary?.balance ? parseFloat(summary.balance.total_outstanding) : 0;
  const totalPaid = summary?.balance ? parseFloat(summary.balance.total_paid) : 0;
  const activeDebtorsCount = debtors.length;

  return (
    <div className="dashboard-page">
      {/* Top Banner with Shopkeeper Greeting & Primary Actions */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">{t('dashboard.overview')}</h1>
          <p className="page-subtitle">
            {t('auth.welcomeBack')}, <strong style={{ color: 'var(--text-primary)' }}>{user?.name || user?.username}</strong>
          </p>
        </div>

        {/* 2 Big Primary Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={(e) => handleOpenCredit(e, null)}
            style={{ padding: '0.75rem 1.4rem', fontSize: '1rem', fontWeight: 600 }}
          >
            <PlusCircle size={20} />
            <span>{t('dashboard.recordCredit')}</span>
          </button>

          <button
            className="btn"
            style={{
              background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
              color: '#ffffff',
              padding: '0.75rem 1.4rem',
              fontSize: '1rem',
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(14, 165, 233, 0.35)',
            }}
            onClick={(e) => handleOpenPayment(e, null)}
          >
            <Receipt size={20} />
            <span>{t('dashboard.receivePayment')}</span>
          </button>
        </div>
      </div>

      {/* 3 Clean Summary Stat Cards */}
      <div
        className="stats-grid"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginBottom: '1.75rem' }}
      >
        <StatCard
          label={t('dashboard.totalOutstanding')}
          value={formatCurrency(outstanding)}
          icon={Wallet}
          accentColor={outstanding > 0 ? '#ef4444' : '#10b981'}
          bgColor={outstanding > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)'}
          textColor={outstanding > 0 ? '#ef4444' : '#10b981'}
        />

        <StatCard
          label={t('dashboard.activeDebtors')}
          value={activeDebtorsCount}
          icon={Users}
          accentColor="#f59e0b"
          bgColor="rgba(245, 158, 11, 0.12)"
          textColor="#f59e0b"
        />

        <StatCard
          label={t('dashboard.totalCollected')}
          value={formatCurrency(totalPaid)}
          icon={TrendingUp}
          accentColor="#10b981"
          bgColor="rgba(16, 185, 129, 0.12)"
          textColor="#10b981"
        />
      </div>

      {/* Main Active Debt Ledger */}
      <div className="card" style={{ marginBottom: '1.75rem', padding: '1.25rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {t('dashboard.topDebtors')} ({debtors.length})
            </h2>
          </div>

          {/* Quick Search inside Ledger */}
          <div className="search-wrapper" style={{ maxWidth: '340px' }}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="form-input search-input"
              placeholder={t('dashboard.searchLedger')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            {t('common.loading')}
          </div>
        ) : filteredDebtors.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <UserCheck size={40} style={{ color: 'var(--color-primary)', margin: '0 auto 0.75rem', opacity: 0.8 }} />
            <p style={{ fontWeight: 500 }}>
              {searchTerm ? t('customers.noCustomersFound') : t('dashboard.noDebts')}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredDebtors.map((debtor) => {
              const bal = parseFloat(debtor.balance || 0);

              return (
                <div
                  key={debtor.id}
                  onClick={() => onSelectCustomer(debtor.id)}
                  className="card card-hover"
                  style={{
                    padding: '1rem 1.25rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    background: 'var(--bg-surface-elevated)',
                  }}
                >
                  {/* Left: Customer Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: '1 1 240px' }}>
                    <div
                      className="customer-avatar"
                      style={{ width: '42px', height: '42px', fontSize: '1.1rem' }}
                    >
                      {debtor.name.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.02rem', color: 'var(--text-primary)' }}>
                        {debtor.name}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          fontSize: '0.8125rem',
                          color: 'var(--text-secondary)',
                          marginTop: '0.2rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        {debtor.phone && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Phone size={13} />
                            <span>{debtor.phone}</span>
                          </span>
                        )}

                        {(debtor.block || debtor.house_number) && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <MapPin size={13} />
                            <span>
                              {debtor.block ? `${debtor.block}` : ''}
                              {debtor.block && debtor.house_number ? ' ' : ''}
                              {debtor.house_number ? `#${debtor.house_number}` : ''}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Debt amount and 2 fast action buttons */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1.25rem',
                      flexWrap: 'wrap',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <div style={{ textAlign: 'right', minWidth: '100px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', fontWeight: 600 }}>
                        {t('dashboard.debt')}
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-danger)' }}>
                        {formatCurrency(bal)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={(e) => handleOpenPayment(e, debtor.id)}
                        style={{ padding: '0.45rem 0.85rem' }}
                      >
                        <Receipt size={14} />
                        <span>{t('dashboard.pay')}</span>
                      </button>

                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={(e) => handleOpenCredit(e, debtor.id)}
                        style={{ padding: '0.45rem 0.85rem' }}
                      >
                        <PlusCircle size={14} />
                        <span>{t('dashboard.addMoreCredit')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Activity Timeline at the bottom */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {t('dashboard.recentActivity')}
          </h2>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => setActivePage('activity')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <span>{t('dashboard.viewAll')}</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {recentActivities.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{t('activity.empty')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {recentActivities.map((act) => (
              <div
                key={act.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface-elevated)',
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Clock size={15} style={{ color: 'var(--color-primary)' }} />
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{act.details}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {formatDate(act.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unified Modals */}
      <CreditModal
        isOpen={isCreditModalOpen}
        onClose={() => {
          setIsCreditModalOpen(false);
          setSelectedCustomerIdForAction(null);
        }}
        customerId={selectedCustomerIdForAction}
        onSaved={fetchDashboardData}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedCustomerIdForAction(null);
        }}
        customerId={selectedCustomerIdForAction}
        onSaved={fetchDashboardData}
      />
    </div>
  );
}
