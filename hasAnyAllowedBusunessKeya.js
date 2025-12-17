/**
 * Checks if at least one object has a questionBusinessKey
 * that exists in the allowed keys list.
 *
 * @param {Array<{ questionBusinessKey?: string }>} items
 * @param {string[]} allowedKeys
 * @returns {boolean}
 */
function hasAnyAllowedBusinessKey(items, allowedKeys) {
  if (!Array.isArray(items) || !Array.isArray(allowedKeys)) {
    return false;
  }

  const allowedSet = new Set(allowedKeys);

  return items.some(
    (item) => typeof item?.questionBusinessKey === 'string'
      && allowedSet.has(item.questionBusinessKey)
  );
}