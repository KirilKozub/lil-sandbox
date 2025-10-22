 /* eslint-disable no-restricted-syntax */
/**
 * @file toFormUrlEncoded.js
 * @description Convert a plain (possibly nested) object into an application/x-www-form-urlencoded string.
 * @see RFC 3986, HTML Living Standard (form submission), URL encoding rules.
 */

/**
 * Encode a JS value as form-urlencoded pairs (supports nested objects and arrays).
 * - Objects → `parent[key]=...`
 * - Arrays  → `parent[key][index]=...`
 * - null/undefined → `key=` (empty value)
 *
 * @param {Record<string, any>} obj - Source object.
 * @param {string} [prefix] - Internal recursion prefix.
 * @returns {string} Form-URL-encoded string.
 */
export function toFormUrlEncoded(obj, prefix) {
  /** @type {string[]} */
  const pairs = [];

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

    const value = obj[key];
    const encodedKey = prefix
      ? `${prefix}[${encodeURIComponent(key)}]`
      : encodeURIComponent(key);

    if (value === null || typeof value === 'undefined') {
      // Nullish → keep key with empty value
      pairs.push(`${encodedKey}=`);
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((v, idx) => {
        const arrayKey = `${encodedKey}[${idx}]`;
        if (v === null || typeof v === 'undefined') {
          pairs.push(`${arrayKey}=`);
          return;
        }
        if (typeof v === 'object') {
          pairs.push(toFormUrlEncoded(v, arrayKey));
          return;
        }
        pairs.push(`${arrayKey}=${encodeURIComponent(String(v))}`);
      });
      continue;
    }

    if (typeof value === 'object') {
      pairs.push(toFormUrlEncoded(value, encodedKey));
      continue;
    }

    pairs.push(`${encodedKey}=${encodeURIComponent(String(value))}`);
  }

  return pairs.join('&');
}


