import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';
import Navbar from './components/Navbar';
import MobileNav from './components/MobileNav';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import ActivityPage from './pages/ActivityPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const { user, token, loading } = useAuth();
  const { t } = useLanguage();

  const [activePage, setActivePage] = useState('dashboard');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  const handleNavChange = (page) => {
    setActivePage(page);
    setSelectedCustomerId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCustomer = (customerId) => {
    setActivePage('customers');
    setSelectedCustomerId(customerId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          background: 'var(--bg-app)',
          color: 'var(--text-secondary)',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '3px solid var(--border-subtle)',
            borderTopColor: 'var(--color-primary)',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{t('common.loading')}</span>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Not logged in -> Show Login Page
  if (!token || !user) {
    return <LoginPage />;
  }

  return (
    <div className="app-shell">
      <Navbar activePage={activePage} setActivePage={handleNavChange} />

      <main className="main-container">
        {activePage === 'dashboard' && (
          <DashboardPage
            setActivePage={handleNavChange}
            onSelectCustomer={handleSelectCustomer}
          />
        )}

        {activePage === 'customers' && (
          <>
            {selectedCustomerId ? (
              <CustomerDetailPage
                customerId={selectedCustomerId}
                onBack={() => setSelectedCustomerId(null)}
              />
            ) : (
              <CustomersPage onSelectCustomer={handleSelectCustomer} />
            )}
          </>
        )}

        {activePage === 'activity' && (
          <ActivityPage onSelectCustomer={handleSelectCustomer} />
        )}

        {activePage === 'settings' && <SettingsPage />}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav activePage={activePage} setActivePage={handleNavChange} />
    </div>
  );
}
