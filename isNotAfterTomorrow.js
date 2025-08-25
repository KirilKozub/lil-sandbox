/**
 * Check if a date (YYYY.MM.DD) is today, tomorrow, or in the past
 * @param {string} dateStr - Date in format "YYYY.MM.DD"
 * @returns {boolean} true if date <= tomorrow, false otherwise
 */
function isNotAfterTomorrow(dateStr) {
  // Validate format YYYY.MM.DD
  const regex = /^\d{4}\.\d{2}\.\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const [year, month, day] = dateStr.split('.').map(Number);
  const inputDate = new Date(year, month - 1, day);

  // Validate that date is real (e.g., no "2025.02.30")
  if (
    inputDate.getFullYear() !== year ||
    inputDate.getMonth() !== month - 1 ||
    inputDate.getDate() !== day
  ) {
    return false;
  }

  // Normalize to midnight for comparison
  inputDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return inputDate <= tomorrow;
}

// Примеры:
console.log(isNotAfterTomorrow("2025.08.25")); // true (сегодня)
console.log(isNotAfterTomorrow("2025.08.26")); // true (завтра)
console.log(isNotAfterTomorrow("2025.08.27")); // false (послезавтра)
console.log(isNotAfterTomorrow("2025.02.30")); // false (некорректная дата)
console.log(isNotAfterTomorrow("2025-08-25")); // false (неверный формат)