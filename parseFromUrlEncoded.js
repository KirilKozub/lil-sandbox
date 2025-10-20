/**
 * Parse application/x-www-form-urlencoded string into a deeply nested object.
 * Supports dotted keys (e.g., user.name.first=John → { user: { name: { first: 'John' }}}).
 * Converts "true"/"false"/"null"/numbers" to proper JS types.
 * Prevents prototype pollution.
 *
 * @param {string} encodedStr - URL-encoded string (e.g., a=b&user.name=John)
 * @returns {Record<string, any>} - Nested object.
 */
export function parseFormUrlEncoded(encodedStr) {
  const result = {};
  const params = new URLSearchParams(encodedStr);

  /**
   * @param {string} raw - raw value
   * @returns {any}
   */
  function castType(raw) {
    const value = raw.trim();

    if (/^(true|false)$/i.test(value)) {
      return value.toLowerCase() === 'true';
    }
    if (/^null$/i.test(value)) {
      return null;
    }
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return Number(value);
    }
    return value;
  }

  /**
   * @param {Record<string, any>} target
   * @param {string[]} path
   * @param {any} value
   */
  function setNestedValue(target, path, value) {
    let current = target;

    for (let i = 0; i < path.length; i += 1) {
      const key = path[i];
      const isLast = i === path.length - 1;

      // Avoid prototype pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return;
      }

      // Detect if next key is array index
      const nextKey = path[i + 1];
      const nextIsIndex = !Number.isNaN(Number(nextKey));

      if (isLast) {
        current[key] = value;
      } else if (current[key] === undefined) {
        current[key] = nextIsIndex ? [] : {};
      } else if (
        typeof current[key] !== 'object' ||
        current[key] === null
      ) {
        // Skip overriding non-objects
        return;
      }

      current = current[key];
    }
  }

  for (const [rawKey, rawValue] of params.entries()) {
    const path = rawKey.split('.').filter(Boolean);
    const value = castType(rawValue);
    setNestedValue(result, path, value);
  }

  return result;
}