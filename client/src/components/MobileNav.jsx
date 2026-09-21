import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { LayoutDashboard, Users, History, Settings } from 'lucide-react';

export default function MobileNav({ activePage, setActivePage }) {
  const { t } = useLanguage();

  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'customers', label: t('nav.customers'), icon: Users },
    { id: 'activity', label: t('nav.activity'), icon: History },
    { id: 'settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activePage === item.id;
        return (
          <button
            key={item.id}
            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setActivePage(item.id)}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
