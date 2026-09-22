import React, { useState, useEffect } from 'react';
import { Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import {
  extractNationalDigits,
  detectCarrier,
  isValidEthiopianPhone,
  normalizeEthiopianPhone,
} from '../utils/phone';

/**
 * Custom Ethiopian Phone Number Input
 * Supports +251 country code prefix and live operator detection:
 *  - Ethio Telecom (starts with 9)
 *  - Safaricom Ethiopia (starts with 7)
 */
export default function EthiopianPhoneInput({
  value = '',
  onChange,
  required = false,
  label = null,
  disabled = false,
  error = null,
}) {
  const { t } = useLanguage();

  // Internal state stores only the 9 national digits
  const [digits, setDigits] = useState(() => extractNationalDigits(value));
  const [touched, setTouched] = useState(false);

  // Sync internal digits when external value changes
  useEffect(() => {
    const extDigits = extractNationalDigits(value);
    if (extDigits !== digits) {
      setDigits(extDigits);
    }
  }, [value]);

  const carrier = detectCarrier(digits);
  const isValid = isValidEthiopianPhone(digits);
  const startsWithInvalid = digits.length > 0 && !digits.startsWith('9') && !digits.startsWith('7');

  const handleInputChange = (e) => {
    const rawVal = e.target.value;
    const cleaned = extractNationalDigits(rawVal);
    setDigits(cleaned);
    setTouched(true);

    if (onChange) {
      const normalized = cleaned ? normalizeEthiopianPhone(cleaned) : '';
      onChange(normalized, cleaned, detectCarrier(cleaned));
    }
  };

  const handleBlur = () => {
    setTouched(true);
  };

  let inlineError = null;
  if (touched || error) {
    if (error) {
      inlineError = error;
    } else if (required && !digits) {
      inlineError = t('common.required') + ': ' + t('customers.phone');
    } else if (startsWithInvalid) {
      inlineError = t('customers.phoneInvalidCarrier');
    } else if (digits.length > 0 && digits.length < 9) {
      inlineError = `${t('customers.phoneIncomplete')} (${digits.length}/9)`;
    }
  }

  return (
    <div className="form-group" style={{ marginBottom: '0.95rem' }}>
      <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
        <span>
          {label || t('customers.phone')}
          {required && <span style={{ color: 'var(--color-danger)', marginLeft: '0.25rem' }}>*</span>}
        </span>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>
          {t('customers.carrierHint')}
        </span>
      </label>

      {/* Input Group with Fixed +251 Prefix */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-input)',
          border: `1px solid ${
            inlineError
              ? 'var(--color-danger)'
              : isValid
              ? 'var(--color-primary)'
              : 'var(--border-subtle)'
          }`,
          borderRadius: 'var(--radius-md)',
          padding: '2px 6px 2px 0',
          transition: 'all var(--transition-fast)',
          boxShadow: isValid ? '0 0 0 1px var(--color-primary-glow)' : 'none',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Fixed Country Code Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.6rem 0.65rem',
            background: 'var(--bg-hover)',
            borderTopLeftRadius: 'calc(var(--radius-md) - 2px)',
            borderBottomLeftRadius: 'calc(var(--radius-md) - 2px)',
            borderRight: '1px solid var(--border-subtle)',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            userSelect: 'none',
            flexShrink: 0,
          }}
          title="Ethiopia (+251)"
        >
          <span style={{ fontSize: '1rem', lineHeight: 1 }}>🇪🇹</span>
          <span>+251</span>
        </div>

        {/* 9-digit Input Field */}
        <input
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={9}
          disabled={disabled}
          value={digits}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={t('customers.phonePlaceholder')}
          style={{
            flex: 1,
            minWidth: 0,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            padding: '0.6rem 0.65rem',
            fontSize: '1rem',
            fontWeight: 600,
            letterSpacing: '0.03em',
            color: 'var(--text-primary)',
            fontFamily: 'monospace, var(--sans)',
            width: '100%',
          }}
        />

        {/* Right Status / Carrier Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
          {carrier === 'ethio_telecom' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.15rem 0.45rem',
                borderRadius: '999px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
              <span>{t('customers.ethioTelecom')}</span>
            </span>
          )}

          {carrier === 'safaricom' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.15rem 0.45rem',
                borderRadius: '999px',
                background: 'rgba(14, 165, 233, 0.15)',
                color: '#0284c7',
                border: '1px solid rgba(14, 165, 233, 0.3)',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0284c7' }} />
              <span>{t('customers.safaricom')}</span>
            </span>
          )}

          {isValid && (
            <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} />
          )}
        </div>
      </div>

      {/* Helper text & Live Error Feedback */}
      <div style={{ marginTop: '0.3rem', minHeight: '1rem' }}>
        {inlineError ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              color: 'var(--color-danger)',
              fontSize: '0.78rem',
              fontWeight: 500,
            }}
          >
            <AlertCircle size={13} style={{ flexShrink: 0 }} />
            <span>{inlineError}</span>
          </div>
        ) : digits.length > 0 && !isValid ? (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {t('customers.phonePrefix')} {digits} • {digits.length}/9 digits
          </div>
        ) : isValid ? (
          <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 500 }}>
            ✓ {t('customers.phonePrefix')} {digits.slice(0, 3)} {digits.slice(3, 6)} {digits.slice(6, 9)} ({carrier === 'ethio_telecom' ? t('customers.ethioTelecom') : t('customers.safaricom')})
          </div>
        ) : null}
      </div>
    </div>
  );
}
