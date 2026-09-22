/**
 * Ethiopian Mobile Phone Number Utility (Ethio Telecom & Safaricom Ethiopia)
 *
 * Country Code: +251
 * Mobile Number Length: 9 digits (following country code or leading 0)
 * Ethio Telecom: starts with 9 (e.g. 911223344, 0911223344, +251911223344)
 * Safaricom:     starts with 7 (e.g. 712345678, 0712345678, +251712345678)
 */

/**
 * Strips formatting, spaces, dashes, and country prefixes (+251, 251, 0)
 * to extract the 9 national mobile digits.
 *
 * @param {string} phone
 * @returns {string} 9 digits starting with 9 or 7, or empty string if invalid
 */
export function extractNationalDigits(phone) {
  if (!phone || typeof phone !== 'string') return '';

  // Remove whitespace, dashes, parentheses, dots
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');

  if (cleaned.startsWith('+251')) {
    cleaned = cleaned.slice(4);
  } else if (cleaned.startsWith('251')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }

  return cleaned;
}

/**
 * Checks if a phone number is a valid Ethiopian mobile number.
 *
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidEthiopianPhone(phone) {
  const digits = extractNationalDigits(phone);
  // Must be exactly 9 digits and start with 9 (Ethio Telecom) or 7 (Safaricom)
  return /^[97]\d{8}$/.test(digits);
}

/**
 * Detects whether the number belongs to Ethio Telecom or Safaricom.
 *
 * @param {string} phone
 * @returns {'Ethio Telecom' | 'Safaricom' | null}
 */
export function detectCarrier(phone) {
  const digits = extractNationalDigits(phone);
  if (digits.startsWith('9')) return 'Ethio Telecom';
  if (digits.startsWith('7')) return 'Safaricom';
  return null;
}

/**
 * Normalizes an Ethiopian phone number to canonical E.164 format (+251XXXXXXXXX).
 *
 * @param {string} phone
 * @returns {string | null} Normalized format "+2519XXXXXXXX" or "+2517XXXXXXXX", or null if invalid
 */
export function normalizeEthiopianPhone(phone) {
  const digits = extractNationalDigits(phone);
  if (/^[97]\d{8}$/.test(digits)) {
    return `+251${digits}`;
  }
  return null;
}

/**
 * Formats a phone number cleanly for visual display (e.g. "+251 911 223 344").
 *
 * @param {string} phone
 * @returns {string}
 */
export function formatEthiopianPhone(phone) {
  const digits = extractNationalDigits(phone);
  if (/^[97]\d{8}$/.test(digits)) {
    return `+251 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
  }
  return phone || '';
}
