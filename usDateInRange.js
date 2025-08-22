/**
 * Checks if a given date is within the specified range.
 * @param {string|Date} date - Date to check (string in YYYY-MM-DD or Date object).
 * @param {string|Date} start - Start of the range.
 * @param {string|Date} end - End of the range.
 * @returns {boolean} True if the date is within the range, otherwise false.
 */
function isDateInRange(date, start, end) {
  const d = new Date(date);
  const s = new Date(start);
  const e = new Date(end);

  if (isNaN(d) || isNaN(s) || isNaN(e)) {
    throw new Error('Invalid date format');
  }

  return d >= s && d <= e;
}

// Пример использования:
console.log(isDateInRange('2025-08-22', '2025-01-01', '2025-12-31')); // true
console.log(isDateInRange('2024-12-31', '2025-01-01', '2025-12-31')); // false