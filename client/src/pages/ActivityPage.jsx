import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { activityAPI } from '../api/client';
import {
  History,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export default function ActivityPage({ onSelectCustomer }) {
  const { t, formatDate } = useLanguage();

  const [activities, setActivities] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const fetchActivity = async (page = 1) => {
    try {
      setLoading(true);
      const res = await activityAPI.list({ page, limit: 25 });
      setActivities(res.data.activities || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1 });
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity(1);
  }, []);

  const getActionBadgeColor = (action) => {
    if (action?.includes('PAYMENT')) return { bg: 'var(--color-primary-subtle)', color: 'var(--color-primary)' };
    if (action?.includes('CREDIT')) return { bg: 'var(--color-warning-subtle)', color: 'var(--color-warning)' };
    if (action?.includes('BLACKLIST') || action?.includes('DELETE')) return { bg: 'var(--color-danger-subtle)', color: 'var(--color-danger)' };
    return { bg: 'var(--color-accent-subtle)', color: 'var(--color-accent)' };
  };

  return (
    <div className="activity-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('activity.title')}</h1>
          <p className="page-subtitle">{t('activity.subtitle')}</p>
        </div>
      </div>

      <div className="card" style={{ padding: '1.25rem' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            {t('common.loading')}
          </div>
        ) : activities.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <History size={36} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>{t('activity.empty')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activities.map((act) => {
              const { bg, color } = getActionBadgeColor(act.action);
              const actionLabel = t(`activity.${act.action}`, act.action);

              return (
                <div
                  key={act.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: '1 1 300px' }}>
                    <div
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        background: bg,
                        color: color,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        marginTop: '0.1rem',
                      }}
                    >
                      {actionLabel}
                    </div>

                    <div>
                      <div style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {act.details}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <User size={13} />
                          <span>{act.user_name || 'Admin'}</span>
                        </span>

                        {act.customer_id && act.customer_name && (
                          <button
                            onClick={() => onSelectCustomer(act.customer_id)}
                            style={{
                              color: 'var(--color-primary)',
                              fontWeight: 500,
                              textDecoration: 'underline',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                            }}
                          >
                            {act.customer_name}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    <Clock size={13} />
                    <span>{formatDate(act.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination controls */}
        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              className="btn btn-sm btn-secondary"
              disabled={pagination.page <= 1}
              onClick={() => fetchActivity(pagination.page - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              className="btn btn-sm btn-secondary"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchActivity(pagination.page + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
