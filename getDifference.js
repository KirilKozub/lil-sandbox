/**
 * Safely gets value by path (e.g. "user.id")
 *
 * @param {Object} obj
 * @param {string} path
 * @returns {*}
 */
function getByPath(obj, path) {
  return path.split('.').reduce((acc, key) => {
    if (acc == null) return undefined;
    return acc[key];
  }, obj);
}

/**
 * Normalizes selector to function
 *
 * @param {string | function(any): any} selector
 * @returns {function(any): any}
 */
function normalizeSelector(selector) {
  if (typeof selector === 'function') {
    return selector;
  }

  return (item) => getByPath(item, selector);
}

/**
 * Returns items from second array that are not present in first array
 * based on selector (key or nested path or function)
 *
 * @template T
 * @param {T[]} first
 * @param {T[]} second
 * @param {string | function(T): any} selector
 * @returns {T[]}
 */
function getDifference(first, second, selector) {
  const getKey = normalizeSelector(selector);

  const firstSet = new Set(
    first.map((item) => getKey(item))
  );

  return second.filter(
    (item) => !firstSet.has(getKey(item))
  );
}