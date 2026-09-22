import React, { useState, useEffect, useTransition } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, customersAPI, activityAPI } from '../api/client';
import StatCard from '../components/StatCard';
import CreditModal from '../components/CreditModal';
import PaymentModal from '../components/PaymentModal';
import { formatEthiopianPhone } from '../utils/phone';
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
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function DashboardPage({ setActivePage, onSelectCustomer }) {
  const { t, formatCurrency, formatDate, lang } = useLanguage();
  const { user } = useAuth();

  const [summary, setSummary] = useState(null);
  const [debtors, setDebtors] = useState([]);
  const [filteredDebtors, setFilteredDebtors] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
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
        activityAPI.list({ limit: 25 }),
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
        const qDigits = q.replace(/[\s\-\(\)\.]/g, '');
        let qNational = qDigits;
        if (qNational.startsWith('+251')) qNational = qNational.slice(4);
        else if (qNational.startsWith('251')) qNational = qNational.slice(3);
        else if (qNational.startsWith('0')) qNational = qNational.slice(1);

        setFilteredDebtors(
          debtors.filter(
            (d) =>
              d.name?.toLowerCase().includes(q) ||
              d.phone?.includes(q) ||
              (qNational && d.phone && d.phone.replace(/[\s\-\(\)\.]/g, '').includes(qNational)) ||
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
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('dashboard.overview')}</h1>
          <p className="page-subtitle">
            {t('auth.welcomeBack')}, <strong style={{ color: 'var(--text-primary)' }}>{user?.name || user?.username}</strong>
          </p>
        </div>

        {/* 2 Big Primary Action Buttons (Responsive grid / stack on mobile, flex on desktop) */}
        <div className="hero-action-buttons">
          <button
            className="btn btn-primary"
            onClick={(e) => handleOpenCredit(e, null)}
          >
            <PlusCircle size={18} style={{ flexShrink: 0 }} />
            <span>{t('dashboard.recordCredit')}</span>
          </button>

          <button
            className="btn"
            style={{
              background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(14, 165, 233, 0.35)',
            }}
            onClick={(e) => handleOpenPayment(e, null)}
          >
            <Receipt size={18} style={{ flexShrink: 0 }} />
            <span>{t('dashboard.receivePayment')}</span>
          </button>
        </div>
      </div>

      {/* 3 Clean Summary Stat Cards */}
      <div className="stats-grid">
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
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.85rem',
            marginBottom: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(245, 158, 11, 0.15))',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-danger)',
                flexShrink: 0,
              }}
            >
              <Users size={19} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h2
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                    margin: 0,
                  }}
                >
                  {t('dashboard.topDebtors')}
                </h2>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.55rem',
                    borderRadius: '999px',
                    background: 'var(--color-danger-subtle)',
                    color: 'var(--color-danger)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                  }}
                >
                  {debtors.length}
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                {t('dashboard.topDebtorsSubtitle')}
              </p>
            </div>
          </div>

          {/* Quick Search inside Ledger */}
          <div className="search-wrapper" style={{ flex: '1 1 220px', maxWidth: '340px' }}>
            <Search size={17} className="search-icon" />
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
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            {t('common.loading')}
          </div>
        ) : filteredDebtors.length === 0 ? (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <UserCheck size={36} style={{ color: 'var(--color-primary)', margin: '0 auto 0.65rem', opacity: 0.8 }} />
            <p style={{ fontWeight: 500, fontSize: '0.9rem' }}>
              {searchTerm ? t('customers.noCustomersFound') : t('dashboard.noDebts')}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {filteredDebtors.map((debtor) => {
              const bal = parseFloat(debtor.balance || 0);

              return (
                <div
                  key={debtor.id}
                  onClick={() => onSelectCustomer(debtor.id)}
                  className="debtor-card"
                >
                  {/* Left / Top: Customer Info */}
                  <div className="debtor-card-info">
                    <div className="customer-avatar">
                      {debtor.name.charAt(0).toUpperCase()}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {debtor.name}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.78rem',
                          color: 'var(--text-secondary)',
                          marginTop: '0.15rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        {debtor.phone && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Phone size={12} />
                            <span>{formatEthiopianPhone(debtor.phone)}</span>
                          </span>
                        )}

                        {(debtor.block || debtor.house_number) && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <MapPin size={12} />
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

                  {/* Right / Bottom: Debt amount and fast action buttons */}
                  <div className="debtor-card-actions">
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-danger)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {t('dashboard.debt')}
                      </div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-danger)', lineHeight: 1.1 }}>
                        {formatCurrency(bal)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={(e) => handleOpenPayment(e, debtor.id)}
                      >
                        <Receipt size={14} />
                        <span>{t('dashboard.pay')}</span>
                      </button>

                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={(e) => handleOpenCredit(e, debtor.id)}
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

      {/* Recent Activity Dropdown Accordion */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Clickable / Touchable Dropdown Header */}
        <div
          onClick={() => setIsActivityOpen(!isActivityOpen)}
          style={{
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            userSelect: 'none',
            background: isActivityOpen ? 'var(--bg-surface-elevated)' : 'transparent',
            transition: 'background var(--transition-fast)',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          {(() => {
            const todayDateStr = new Date().toISOString().split('T')[0];
            const todayActivities = recentActivities.filter((act) => {
              if (!act.created_at) return false;
              return new Date(act.created_at).toISOString().split('T')[0] === todayDateStr;
            });

            return (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-primary-subtle)',
                      color: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Clock size={16} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {t('dashboard.recentActivity')}
                    </span>
                    <span
                      style={{
                        marginLeft: '0.45rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                        background: todayActivities.length > 0 ? 'var(--color-primary-subtle)' : 'var(--bg-hover)',
                        color: todayActivities.length > 0 ? 'var(--color-primary)' : 'var(--text-muted)',
                      }}
                    >
                      {todayActivities.length}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePage('activity');
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}
                  >
                    <span>{t('dashboard.viewAll')}</span>
                    <ArrowRight size={13} />
                  </button>

                  <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                    {isActivityOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {/* Collapsible Dropdown Content */}
        {isActivityOpen && (
          <div style={{ padding: '0.85rem 1rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
            {(() => {
              const todayDateStr = new Date().toISOString().split('T')[0];
              const todayActivities = recentActivities.filter((act) => {
                if (!act.created_at) return false;
                return new Date(act.created_at).toISOString().split('T')[0] === todayDateStr;
              });

              if (todayActivities.length === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: '1.25rem 0.5rem', color: 'var(--text-secondary)' }}>
                    <p style={{ fontSize: '0.85rem', marginBottom: '0.65rem' }}>
                      {t('dashboard.noActivityToday')}
                    </p>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => setActivePage('activity')}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <span>{t('dashboard.viewAll')}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {todayActivities.map((act) => {
                    const custName = act.customer_name || 'Customer';
                    const isPayment = act.action?.includes('PAYMENT');
                    
                    let cleanDetails = act.details || '';
                    if (act.customer_name) {
                      cleanDetails = cleanDetails
                        .replace(new RegExp(`\\s+(for|from)\\s+${act.customer_name}`, 'i'), '')
                        .replace(new RegExp(`^Created customer:\\s*${act.customer_name}`, 'i'), t('activity.CREATE_CUSTOMER'));
                    }

                    let timeStr = '';
                    try {
                      if (act.created_at) {
                        const d = new Date(act.created_at);
                        timeStr = d.toLocaleTimeString(lang === 'am' ? 'am-ET' : 'en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                      }
                    } catch {}

                    return (
                      <div
                        key={act.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.65rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-surface-elevated)',
                          fontSize: '0.85rem',
                          flexWrap: 'wrap',
                          gap: '0.45rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: '1 1 220px', minWidth: 0 }}>
                          <div
                            className="customer-avatar"
                            style={{
                              width: '28px',
                              height: '28px',
                              fontSize: '0.8rem',
                              background: isPayment ? 'var(--color-primary-subtle)' : 'var(--color-warning-subtle)',
                              color: isPayment ? 'var(--color-primary)' : 'var(--color-warning)',
                              border: 'none',
                              flexShrink: 0,
                            }}
                          >
                            {custName.charAt(0).toUpperCase()}
                          </div>

                          <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {act.customer_id ? (
                              <button
                                onClick={() => onSelectCustomer(act.customer_id)}
                                style={{
                                  fontWeight: 700,
                                  color: 'var(--text-primary)',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  display: 'inline',
                                  marginRight: '0.35rem',
                                  fontSize: '0.85rem',
                                  textDecoration: 'underline',
                                }}
                              >
                                {custName}:
                              </button>
                            ) : (
                              <strong style={{ color: 'var(--text-primary)', marginRight: '0.35rem', fontSize: '0.85rem' }}>
                                {custName}:
                              </strong>
                            )}
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                              {cleanDetails}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          <Clock size={12} style={{ color: 'var(--color-primary)' }} />
                          <span>{timeStr || formatDate(act.created_at)}</span>
                        </div>
                      </div>
                    );
                  })}

                  <div style={{ textAlign: 'center', paddingTop: '0.4rem', borderTop: '1px solid var(--border-subtle)', marginTop: '0.2rem' }}>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => setActivePage('activity')}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <span>{t('dashboard.viewAll')}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })()}
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
