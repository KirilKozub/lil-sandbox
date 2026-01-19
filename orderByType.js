/**
 * Sort objects by type order.
 *
 * @template T
 * @param {T[]} items - Array of objects to sort
 * @param {string[]} order - Ordered list of allowed types
 * @param {(item: T) => string} getType - Function to extract type
 * @returns {T[]}
 */
function sortByTypeOrder(items, order, getType) {
  const orderIndexMap = new Map(
    order.map((type, index) => [type, index]),
  );

  return [...items].sort((a, b) => {
    const aIndex = orderIndexMap.get(getType(a));
    const bIndex = orderIndexMap.get(getType(b));

    const aRank = aIndex !== undefined ? aIndex : Number.MAX_SAFE_INTEGER;
    const bRank = bIndex !== undefined ? bIndex : Number.MAX_SAFE_INTEGER;

    return aRank - bRank;
  });
}