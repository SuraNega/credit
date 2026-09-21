import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function StatusBadge({ status, type = 'credit' }) {
  const { t } = useLanguage();

  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          className: 'badge-success',
          label: t('customers.active'),
        };
      case 'blacklisted':
        return {
          className: 'badge-danger',
          label: t('customers.blacklisted'),
        };
      case 'paid':
        return {
          className: 'badge-success',
          label: t('credits.paid'),
        };
      case 'partial':
        return {
          className: 'badge-warning',
          label: t('credits.partial'),
        };
      case 'unpaid':
        return {
          className: 'badge-danger',
          label: t('credits.unpaid'),
        };
      default:
        return {
          className: 'badge-neutral',
          label: status,
        };
    }
  };

  const { className, label } = getStatusConfig();

  return (
    <span className={`badge ${className}`}>
      <span className="badge-dot" />
      {label}
    </span>
  );
}
