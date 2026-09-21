import React from 'react';

export default function StatCard({ label, value, icon: Icon, accentColor, bgColor, textColor }) {
  const style = {
    '--stat-accent': accentColor || '#10b981',
    '--stat-bg': bgColor || 'rgba(16, 185, 129, 0.12)',
    '--stat-color': textColor || accentColor || '#10b981',
  };

  return (
    <div className="stat-card" style={style}>
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
      </div>
      {Icon && (
        <div className="stat-icon">
          <Icon size={22} />
        </div>
      )}
    </div>
  );
}
