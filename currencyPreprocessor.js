/**
 * Currency input preprocessor.
 * Allows digits, comma and dot.
 * Normalizes comma to dot and keeps only one decimal separator.
 *
 * @param {string} value
 * @returns {string}
 */
export const currencyPreprocessor = (value = '') => {
  // keep only digits, comma and dot
  const cleaned = value.replace(/[^\d.,]/g, '');

  // normalize comma to dot
  const normalized = cleaned.replace(/,/g, '.');

  // allow only one dot
  const parts = normalized.split('.');
  if (parts.length === 1) {
    return parts[0];
  }

  return `${parts[0]}.${parts.slice(1).join('')}`;
};