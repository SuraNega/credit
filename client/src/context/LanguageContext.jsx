import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../i18n/en.json';
import am from '../i18n/am.json';

const translations = { en, am };

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('dagi_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('dagi_lang', lang);
    document.documentElement.lang = lang;
    if (lang === 'am') {
      document.body.classList.add('lang-am');
    } else {
      document.body.classList.remove('lang-am');
    }
  }, [lang]);

  const toggleLang = () => {
    setLang((prev) => (prev === 'en' ? 'am' : 'en'));
  };

  /**
   * Helper function to get translated string by dot notation path (e.g. 'dashboard.totalOutstanding')
   */
  const t = (path, fallback = '') => {
    const keys = path.split('.');
    let current = translations[lang];
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to English if translation is missing in Amharic
        let fallbackVal = translations.en;
        for (const fbKey of keys) {
          if (fallbackVal && typeof fallbackVal === 'object' && fbKey in fallbackVal) {
            fallbackVal = fallbackVal[fbKey];
          } else {
            return fallback || path;
          }
        }
        return fallbackVal || fallback || path;
      }
    }
    return current;
  };

  /**
   * Format currency values nicely (e.g. 1,250.00 ETB or 1,250.00 ብር)
   */
  const formatCurrency = (val) => {
    const num = parseFloat(val) || 0;
    const formatted = num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${formatted} ${t('app.currency')}`;
  };

  /**
   * Format dates nicely
   */
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(lang === 'am' ? 'am-ET' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t, formatCurrency, formatDate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
