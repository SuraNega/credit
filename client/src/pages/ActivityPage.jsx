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
      // Fetch up to 100 recent activities
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

  // Helper to format time (e.g. 3:45 PM)
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
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">{t('activity.title')}</h1>
          <p className="page-subtitle">{t('activity.subtitle')}</p>
        </div>
      </div>

      {/* Filter and Search Controls Bar */}
      <div
        className="card"
        style={{
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Live Search Input */}
          <div className="search-wrapper" style={{ flex: '1 1 260px' }}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="form-input search-input"
              placeholder={t('common.searchActivity')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Calendar Date Picker Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="date"
                className="form-input"
                style={{ padding: '0.55rem 0.85rem', fontSize: '0.875rem', width: 'auto' }}
                value={selectedCalendarDate}
                onChange={(e) => setSelectedCalendarDate(e.target.value)}
                title={t('common.filterByDate')}
              />
              {selectedCalendarDate && (
                <button
                  className="btn-icon btn-sm"
                  onClick={() => setSelectedCalendarDate('')}
                  title="Clear Date"
                  style={{ marginLeft: '0.25rem' }}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Quick Date Pills: All, Today, Yesterday */}
            <div style={{ display: 'flex', gap: '0.35rem' }}>
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
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          {t('common.loading')}
        </div>
      ) : dateKeys.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <History size={40} style={{ margin: '0 auto 1rem', opacity: 0.6, color: 'var(--text-muted)' }} />
          <p style={{ fontWeight: 500 }}>
            {searchTerm || selectedCalendarDate
              ? t('common.noActivityForDate')
              : t('activity.empty')}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
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
                    gap: '0.5rem',
                    padding: '0.4rem 0.9rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '0.75rem',
                  }}
                >
                  <Calendar size={15} style={{ color: 'var(--color-primary)' }} />
                  <span>{headerLabel}</span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      marginLeft: '0.25rem',
                    }}
                  >
                    ({dateActivities.length})
                  </span>
                </div>

                {/* Customer-Centric Activity Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
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
                          padding: '0.9rem 1.15rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '1rem',
                          background: 'var(--bg-surface)',
                          transition: 'border-color var(--transition-fast)',
                        }}
                      >
                        {/* Left: Customer Profile Avatar & Details */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: '1 1 280px' }}>
                          <div
                            className="customer-avatar"
                            style={{
                              width: '42px',
                              height: '42px',
                              fontSize: '1.1rem',
                              background: badgeConfig.bg,
                              color: badgeConfig.color,
                              border: 'none',
                            }}
                          >
                            {customerInitial}
                          </div>

                          <div>
                            {/* Customer Name & Action Pill */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              {act.customer_id ? (
                                <button
                                  onClick={() => onSelectCustomer(act.customer_id)}
                                  style={{
                                    fontSize: '1rem',
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
                                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {customerName}
                                </span>
                              )}

                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: 'var(--radius-sm)',
                                  background: badgeConfig.bg,
                                  color: badgeConfig.color,
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                }}
                              >
                                <ActionIcon size={12} />
                                <span>{actionLabel}</span>
                              </span>
                            </div>

                            {/* Customer Phone / Block & Description */}
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                              {act.details}
                            </div>

                            {(act.customer_phone || act.customer_block) && (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.75rem',
                                  fontSize: '0.78rem',
                                  color: 'var(--text-muted)',
                                  marginTop: '0.25rem',
                                  flexWrap: 'wrap',
                                }}
                              >
                                {act.customer_phone && (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Phone size={12} />
                                    <span>{act.customer_phone}</span>
                                  </span>
                                )}
                                {(act.customer_block || act.customer_house_number) && (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <MapPin size={12} />
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
                        <div style={{ textAlign: 'right', minWidth: '110px' }}>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                            }}
                          >
                            <Clock size={13} style={{ color: 'var(--color-primary)' }} />
                            <span>{timeLabel || formatDate(act.created_at)}</span>
                          </div>

                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
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
