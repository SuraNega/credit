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
 * Clean Ethiopian Phone Number Input
 * Fixed +251 country code prefix and live operator detection:
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
      <label className="form-label">
        <span>
          {label || t('customers.phone')}
          {required && <span style={{ color: 'var(--color-danger)', marginLeft: '0.25rem' }}>*</span>}
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
          padding: '2px 8px 2px 0',
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
            gap: '0.35rem',
            padding: '0.65rem 0.75rem',
            background: 'var(--bg-hover)',
            borderTopLeftRadius: 'calc(var(--radius-md) - 2px)',
            borderBottomLeftRadius: 'calc(var(--radius-md) - 2px)',
            borderRight: '1px solid var(--border-subtle)',
            fontSize: '0.9rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            userSelect: 'none',
            flexShrink: 0,
          }}
          title="Ethiopia (+251)"
        >
          <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>🇪🇹</span>
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
          placeholder="911223344"
          style={{
            flex: 1,
            minWidth: 0,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            padding: '0.65rem 0.75rem',
            fontSize: '1rem',
            fontWeight: 600,
            letterSpacing: '0.04em',
            color: 'var(--text-primary)',
            width: '100%',
          }}
        />

        {/* Right Status / Carrier Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
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
            <CheckCircle2 size={17} style={{ color: '#10b981', flexShrink: 0 }} />
          )}
        </div>
      </div>

      {/* Helper / Error Feedback */}
      {inlineError && (
        <div
          style={{
            marginTop: '0.3rem',
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
      )}
    </div>
  );
}
