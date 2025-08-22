/**
 * Returns a date string (YYYY-MM-DD) from a base date or today by default.
 * @param {number} [offsetDays=0] - Days to add (positive) or subtract (negative).
 * @param {Date|string|number} [baseDate=new Date()] - Base date (optional). Accepts Date or any value for `new Date()`.
 * @returns {string} Date string in YYYY-MM-DD format.
 */
export function getDate(offsetDays = 0, baseDate = new Date()) {
  const base = baseDate instanceof Date ? new Date(baseDate.getTime()) : new Date(baseDate);
  if (Number.isNaN(base.getTime())) throw new TypeError('Invalid baseDate');

  const shifted = new Date(base.getTime());
  shifted.setDate(shifted.getDate() + Number(offsetDays || 0));

  const year = shifted.getFullYear();
  const month = String(shifted.getMonth() + 1).padStart(2, '0');
  const day = String(shifted.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}