/**
 * Ethiopian Mobile Phone Number Utility (Client-Side)
 * Supports Ethio Telecom (9...) and Safaricom Ethiopia (7...)
 */

/**
 * Extracts the 9 national digits from any formatted string,
 * automatically removing +251, 251, leading 0, spaces, and punctuation.
 *
 * Examples:
 *  "+251911223344" -> "911223344"
 *  "0911223344"    -> "911223344"
 *  "0712345678"    -> "712345678"
 *  "911223344"     -> "911223344"
 */
export function extractNationalDigits(phone) {
  if (!phone || typeof phone !== 'string') return '';

  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');

  if (cleaned.startsWith('+251')) {
    cleaned = cleaned.slice(4);
  } else if (cleaned.startsWith('251')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }

  // Only keep numbers up to 9 digits
  cleaned = cleaned.replace(/\D/g, '').slice(0, 9);
  return cleaned;
}

/**
 * Detects whether the input is Ethio Telecom (9...) or Safaricom (7...).
 *
 * @param {string} phone
 * @returns {'ethio_telecom' | 'safaricom' | null}
 */
export function detectCarrier(phone) {
  const digits = extractNationalDigits(phone);
  if (digits.startsWith('9')) return 'ethio_telecom';
  if (digits.startsWith('7')) return 'safaricom';
  return null;
}

/**
 * Checks if the phone number is a valid 9-digit Ethiopian mobile number.
 *
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidEthiopianPhone(phone) {
  const digits = extractNationalDigits(phone);
  return /^[97]\d{8}$/.test(digits);
}

/**
 * Normalizes input to canonical international format "+2519XXXXXXXX" or "+2517XXXXXXXX".
 * Returns empty string or null if empty or invalid.
 *
 * @param {string} phone
 * @returns {string}
 */
export function normalizeEthiopianPhone(phone) {
  const digits = extractNationalDigits(phone);
  if (/^[97]\d{8}$/.test(digits)) {
    return `+251${digits}`;
  }
  return digits ? `+251${digits}` : '';
}

/**
 * Formats a phone number for user-friendly display:
 *  - "+251 911 223 344"
 *  - "+251 712 345 678"
 *
 * @param {string} phone
 * @returns {string}
 */
export function formatEthiopianPhone(phone) {
  if (!phone) return '';
  const digits = extractNationalDigits(phone);
  if (/^[97]\d{8}$/.test(digits)) {
    return `+251 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
  }
  return phone;
}
