/**
 * @typedef {'daily'|'weekly'|'two-weekly'|'monthly'|'quarterly'|'yearly'} Period
 */

/**
 * @param {Date} date
 * @returns {Date} new Date at local start of day (00:00:00.000)
 */
const startOfLocalDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

/**
 * @param {Date} date
 * @param {number} days
 * @returns {Date}
 */
const addDays = (date, days) => {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
};

/**
 * Adds months using native Date overflow rules.
 * ⚠️ Example: Jan 31 + 1 month => Mar 2/3 depending on timezone/DST.
 *
 * @param {Date} date
 * @param {number} months
 * @returns {Date}
 */
const addMonths = (date, months) => {
  const d = new Date(date.getTime());
  d.setMonth(d.getMonth() + months);
  return d;
};

/**
 * @param {Date} date
 * @param {number} years
 * @returns {Date}
 */
const addYears = (date, years) => {
  const d = new Date(date.getTime());
  d.setFullYear(d.getFullYear() + years);
  return d;
};

/**
 * Calculates the minimum valid date for the candidate based on period:
 * min = reference + period + 1 day
 *
 * @param {Date} referenceDate
 * @param {Period} period
 * @returns {Date}
 */
export const getMinValidCandidateDate = (referenceDate, period) => {
  const refDay = startOfLocalDay(referenceDate);

  if (period === 'daily') return addDays(refDay, 1);
  if (period === 'weekly') return addDays(refDay, 8);
  if (period === 'two-weekly') return addDays(refDay, 15);
  if (period === 'monthly') return addDays(addMonths(refDay, 1), 1);
  if (period === 'quarterly') return addDays(addMonths(refDay, 3), 1);
  if (period === 'yearly') return addDays(addYears(refDay, 1), 1);

  // Defensive fallback (should never happen if Period is used correctly)
  return addDays(refDay, 1);
};

/**
 * Returns true if candidateDate is the same day or after the minimum valid day.
 * (Time is ignored; comparison is by calendar day.)
 *
 * @param {Date} referenceDate
 * @param {Date} candidateDate
 * @param {Period} period
 * @returns {boolean}
 */
export const isCandidateValidForPeriod = (referenceDate, candidateDate, period) => {
  const minValid = getMinValidCandidateDate(referenceDate, period);
  const candDay = startOfLocalDay(candidateDate);
  return candDay.getTime() >= minValid.getTime();
};