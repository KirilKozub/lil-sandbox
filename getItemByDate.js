/**
 * Get item by date with flexible strategy
 *
 * @param {Array<Object>} items
 * @param {string} dateKey - key in object with date (ISO string or Date)
 * @param {Object} options
 * @param {'nearestFuture'|'earliest'|'latest'} [options.mode='nearestFuture']
 * @param {'first'|'last'} [options.pick='last'] - if equal dates
 * @returns {Object|null}
 */
export function getItemByDate(items, dateKey, options = {}) {
  const { mode = 'nearestFuture', pick = 'last' } = options;

  if (!Array.isArray(items) || items.length === 0) return null;

  const now = Date.now();

  /**
   * Normalize items with index
   */
  const normalized = items
    .map((item, index) => {
      const time = new Date(item[dateKey]).getTime();

      if (Number.isNaN(time)) return null;

      return {
        item,
        index,
        time,
      };
    })
    .filter(Boolean);

  if (normalized.length === 0) return null;

  /**
   * Filter depending on mode
   */
  let filtered;

  if (mode === 'nearestFuture') {
    filtered = normalized.filter((el) => el.time >= now);
  } else {
    filtered = normalized;
  }

  if (filtered.length === 0) return null;

  /**
   * Find target timestamp
   */
  let targetTime;

  if (mode === 'latest') {
    targetTime = Math.max(...filtered.map((el) => el.time));
  } else {
    // nearestFuture OR earliest
    targetTime = Math.min(...filtered.map((el) => el.time));
  }

  /**
   * Filter equal dates
   */
  const candidates = filtered.filter((el) => el.time === targetTime);

  /**
   * Pick first or last in original array
   */
  const selected =
    pick === 'first'
      ? candidates.reduce((a, b) => (a.index < b.index ? a : b))
      : candidates.reduce((a, b) => (a.index > b.index ? a : b));

  return selected.item;
}