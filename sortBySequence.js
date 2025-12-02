/**
 * Sorts base array according to order in sequence array.
 * Items not found in sequence keep their original order **after** sorted ones.
 * @param {string[]} base
 * @param {string[]} sequence
 * @returns {string[]}
 */
export function sortBySequence(base, sequence) {
  /** @type {Map<string, number>} */
  const order = new Map();

  sequence.forEach((item, index) => {
    order.set(item, index);
  });

  return [...base].sort((a, b) => {
    const aOrder = order.has(a) ? order.get(a) : Infinity;
    const bOrder = order.has(b) ? order.get(b) : Infinity;

    if (aOrder < bOrder) return -1;
    if (aOrder > bOrder) return 1;
    return 0;
  });
}