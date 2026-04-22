/**
 * Returns end of next month at 00:00:00 (local time)
 * @param {string} isoString
 * @returns {Date}
 */
export function getEndOfNextMonth(isoString) {
  const date = new Date(isoString);

  // Move to first day of month AFTER next
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstOfMonthAfterNext = new Date(year, month + 2, 1);

  // Go one day back → last day of next month
  const endOfNextMonth = new Date(firstOfMonthAfterNext - 1);

  // Set time to 00:00:00
  endOfNextMonth.setHours(0, 0, 0, 0);

  return endOfNextMonth;
}