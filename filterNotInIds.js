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
 * Returns objects whose ids are NOT present in provided id list
 *
 * @template T
 * @param {T[]} items
 * @param {Array<string | number>} ids
 * @param {string | function(T): any} selector
 * @returns {T[]}
 */
function filterNotInIds(items, ids, selector = 'id') {
  const getKey = normalizeSelector(selector);

  const idSet = new Set(ids);

  return items.filter((item) => {
    const key = getKey(item);
    return !idSet.has(key);
  });
}