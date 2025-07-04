/**
 * Normalize a string by removing invisible Unicode characters, line breaks, and collapsing whitespace.
 *
 * @param {string} str - The input string to normalize.
 * @returns {string} - The cleaned and normalized string.
 */
function normalizeString(str) {
  if (typeof str !== 'string') return '';

  // 1. Replace all types of line breaks (\r, \n, \r\n) with a single space
  let result = str.replace(/[\r\n]+/g, ' ');

  // 2. Remove invisible Unicode characters:
  // - Zero-width characters: U+200B to U+200F
  // - Directional formatting characters: U+202A to U+202E
  // - Invisible operators: U+2060 to U+206F
  // - Byte Order Mark (BOM): U+FEFF
  // - No-break space: U+00A0
  // - Braille blank: U+2800
  // - Hangul fillers: U+3164, U+115F, U+1160
  result = result.replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF\u00A0\u2800\u3164\u115F\u1160]/g, '');

  // 3. Collapse multiple spaces into a single space and trim leading/trailing spaces
  result = result.replace(/\s+/g, ' ').trim();

  return result;
}