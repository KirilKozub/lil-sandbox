/**
 * Convert a nested object into application/x-www-form-urlencoded string.
 * Example: { user: { name: 'John', age: 30 } }
 * → 'user.name=John&user.age=30'
 *
 * @param {Record<string, any>} obj - Source object.
 * @param {string} [prefix=''] - Internal use for recursion.
 * @returns {string}
 */
export function toFormUrlEncoded(obj, prefix = '') {
  const pairs = [];

  /**
   * @param {any} value
   * @returns {string}
   */
  function encode(value) {
    return encodeURIComponent(String(value));
  }

  /**
   * @param {Record<string, any>} current
   * @param {string} path
   */
  function build(current, path) {
    if (current === null || current === undefined) {
      pairs.push(`${path}=`);
      return;
    }

    if (typeof current === 'object' && !Array.isArray(current)) {
      Object.keys(current).forEach((key) => {
        const safeKey = key.trim();
        if (safeKey === '__proto__' || safeKey === 'constructor' || safeKey === 'prototype') return;
        const nextPath = path ? `${path}.${safeKey}` : safeKey;
        build(current[key], nextPath);
      });
    } else if (Array.isArray(current)) {
      current.forEach((val, i) => {
        const nextPath = `${path}.${i}`;
        build(val, nextPath);
      });
    } else {
      pairs.push(`${path}=${encode(current)}`);
    }
  }

  build(obj, prefix);

  return pairs.join('&');
}