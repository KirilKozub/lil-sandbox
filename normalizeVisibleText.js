/**
 * Normalize visible text by replacing invisible Unicode characters, line breaks, tabs, and unusual spaces
 * with normal spaces, collapsing multiple spaces, and trimming the result.
 *
 * @param {string} str - The input string to normalize.
 * @returns {string} - The cleaned, readable string containing only visible text.
 */
function normalizeVisibleText(str) {
  if (typeof str !== 'string') return '';

  // 1. Replace line breaks (\r, \n) and tabs (\t) with spaces
  let result = str.replace(/[\r\n\t]+/g, ' ');

  // 2. Replace invisible Unicode characters with spaces
  result = result.replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF\u00A0\u2800\u3164\u115F\u1160]/g, ' ');

  // 3. Collapse multiple whitespace characters (including any remaining tabs, non-breaking spaces, etc.)
  // and trim leading/trailing whitespace
  result = result.replace(/\s+/g, ' ').trim();

  return result;
}