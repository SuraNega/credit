import React, { useState, useEffect, useTransition, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { activityAPI } from '../api/client';
import {
  History,
  Clock,
  User,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  Phone,
  MapPin,
  ArrowRight,
  X,
  CreditCard,
  Receipt,
  UserPlus,
} from 'lucide-react';

export default function ActivityPage({ onSelectCustomer }) {
  const { t, formatDate, lang } = useLanguage();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(''); // 'YYYY-MM-DD' or ''
  const [, startTransition] = useTransition();

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await activityAPI.list({ limit: 100 });
      setActivities(res.data.activities || []);
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  // Filter activities based on search term and selected calendar date
  const filteredActivities = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return activities.filter((act) => {
      // Date filter
      if (selectedCalendarDate) {
        if (!act.created_at) return false;
        const actDate = new Date(act.created_at).toISOString().split('T')[0];
        if (actDate !== selectedCalendarDate) return false;
      }

      // Search filter
      if (q) {
        const matchesName = act.customer_name?.toLowerCase().includes(q);
        const matchesPhone = act.customer_phone?.includes(q);
        const matchesDetails = act.details?.toLowerCase().includes(q);
        const matchesUser = act.user_name?.toLowerCase().includes(q);
        const matchesAction = act.action?.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesDetails && !matchesUser && !matchesAction) {
          return false;
        }
      }

      return true;
    });
  }, [activities, searchTerm, selectedCalendarDate]);

  // Group filtered activities by Date String (YYYY-MM-DD)
  const groupedByDate = useMemo(() => {
    const groups = {};

    filteredActivities.forEach((act) => {
      const dateKey = act.created_at
        ? new Date(act.created_at).toISOString().split('T')[0]
        : 'other';

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(act);
    });

    return groups;
  }, [filteredActivities]);

  // Helper to format date headers into "Today", "Yesterday", or full formatted date
  const getDateHeaderLabel = (dateStr) => {
    if (dateStr === 'other') return t('common.all');

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dateStr === todayStr) {
      return `${t('common.today')} — ${formatDate(dateStr)}`;
    }
    if (dateStr === yesterdayStr) {
      return `${t('common.yesterday')} — ${formatDate(dateStr)}`;
    }

    return formatDate(dateStr);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString(lang === 'am' ? 'am-ET' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const getActionBadge = (action) => {
    if (action?.includes('PAYMENT')) {
      return {
        bg: 'var(--color-primary-subtle)',
        color: 'var(--color-primary)',
        icon: Receipt,
      };
    }
    if (action?.includes('CREDIT')) {
      return {
        bg: 'var(--color-warning-subtle)',
        color: 'var(--color-warning)',
        icon: CreditCard,
      };
    }
    if (action?.includes('BLACKLIST') || action?.includes('DELETE')) {
      return {
        bg: 'var(--color-danger-subtle)',
        color: 'var(--color-danger)',
        icon: X,
      };
    }
    return {
      bg: 'var(--color-accent-subtle)',
      color: 'var(--color-accent)',
      icon: UserPlus,
    };
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  const dateKeys = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  return (
    <div className="activity-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('activity.title')}</h1>
          <p className="page-subtitle">{t('activity.subtitle')}</p>
        </div>
      </div>

      {/* Filter and Search Controls Bar */}
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
          {/* Live Search Input */}
          <div className="search-wrapper" style={{ flex: '1 1 220px' }}>
            <Search size={17} className="search-icon" />
            <input
              type="text"
              className="form-input search-input"
              placeholder={t('common.searchActivity')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Calendar Date Picker Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="date"
                className="form-input"
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', width: 'auto', minHeight: '36px' }}
                value={selectedCalendarDate}
                onChange={(e) => setSelectedCalendarDate(e.target.value)}
                title={t('common.filterByDate')}
              />
              {selectedCalendarDate && (
                <button
                  className="btn-icon btn-sm"
                  onClick={() => setSelectedCalendarDate('')}
                  title="Clear Date"
                  style={{ marginLeft: '0.2rem' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Quick Date Pills */}
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
              <button
                className={`btn btn-sm ${!selectedCalendarDate ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedCalendarDate('')}
              >
                {t('common.allDates')}
              </button>
              <button
                className={`btn btn-sm ${selectedCalendarDate === todayStr ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedCalendarDate(todayStr)}
              >
                {t('common.today')}
              </button>
              <button
                className={`btn btn-sm ${selectedCalendarDate === yesterdayStr ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedCalendarDate(yesterdayStr)}
              >
                {t('common.yesterday')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Activities Grouped by Date */}
      {loading ? (
        <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          {t('common.loading')}
        </div>
      ) : dateKeys.length === 0 ? (
        <div className="card" style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <History size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.6, color: 'var(--text-muted)' }} />
          <p style={{ fontWeight: 500, fontSize: '0.9rem' }}>
            {searchTerm || selectedCalendarDate
              ? t('common.noActivityForDate')
              : t('activity.empty')}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {dateKeys.map((dateKey) => {
            const dateActivities = groupedByDate[dateKey];
            const headerLabel = getDateHeaderLabel(dateKey);

            return (
              <div key={dateKey}>
                {/* Date Header Ribbon */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '0.65rem',
                  }}
                >
                  <Calendar size={14} style={{ color: 'var(--color-primary)' }} />
                  <span>{headerLabel}</span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      marginLeft: '0.2rem',
                    }}
                  >
                    ({dateActivities.length})
                  </span>
                </div>

                {/* Customer-Centric Activity Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {dateActivities.map((act) => {
                    const badgeConfig = getActionBadge(act.action);
                    const ActionIcon = badgeConfig.icon;
                    const actionLabel = t(`activity.${act.action}`, act.action);
                    const timeLabel = formatTime(act.created_at);

                    const customerName = act.customer_name || 'General Account';
                    const customerInitial = customerName.charAt(0).toUpperCase();

                    return (
                      <div
                        key={act.id}
                        className="card card-hover"
                        style={{
                          padding: '0.8rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '0.65rem',
                          background: 'var(--bg-surface)',
                          transition: 'border-color var(--transition-fast)',
                        }}
                      >
                        {/* Left: Customer Profile Avatar & Details */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 240px', minWidth: 0 }}>
                          <div
                            className="customer-avatar"
                            style={{
                              width: '38px',
                              height: '38px',
                              fontSize: '1rem',
                              background: badgeConfig.bg,
                              color: badgeConfig.color,
                              border: 'none',
                            }}
                          >
                            {customerInitial}
                          </div>

                          <div style={{ minWidth: 0 }}>
                            {/* Customer Name & Action Pill */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                              {act.customer_id ? (
                                <button
                                  onClick={() => onSelectCustomer(act.customer_id)}
                                  style={{
                                    fontSize: '0.95rem',
                                    fontWeight: 700,
                                    color: 'var(--text-primary)',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                  }}
                                  title="View customer ledger"
                                >
                                  <span>{customerName}</span>
                                  <ArrowRight size={13} style={{ color: 'var(--color-primary)', opacity: 0.8 }} />
                                </button>
                              ) : (
                                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {customerName}
                                </span>
                              )}

                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  padding: '0.12rem 0.45rem',
                                  borderRadius: 'var(--radius-sm)',
                                  background: badgeConfig.bg,
                                  color: badgeConfig.color,
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                }}
                              >
                                <ActionIcon size={11} />
                                <span>{actionLabel}</span>
                              </span>
                            </div>

                            {/* Customer Description */}
                            <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                              {act.details}
                            </div>

                            {(act.customer_phone || act.customer_block) && (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.65rem',
                                  fontSize: '0.76rem',
                                  color: 'var(--text-muted)',
                                  marginTop: '0.2rem',
                                  flexWrap: 'wrap',
                                }}
                              >
                                {act.customer_phone && (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                    <Phone size={11} />
                                    <span>{act.customer_phone}</span>
                                  </span>
                                )}
                                {(act.customer_block || act.customer_house_number) && (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                    <MapPin size={11} />
                                    <span>
                                      {act.customer_block ? act.customer_block : ''}
                                      {act.customer_block && act.customer_house_number ? ' #' : ''}
                                      {act.customer_house_number ? act.customer_house_number : ''}
                                    </span>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: Timestamp and Recorded By User */}
                        <div style={{ textAlign: 'right', minWidth: '95px' }}>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                            }}
                          >
                            <Clock size={12} style={{ color: 'var(--color-primary)' }} />
                            <span>{timeLabel || formatDate(act.created_at)}</span>
                          </div>

                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                            {act.user_name || 'Admin'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
