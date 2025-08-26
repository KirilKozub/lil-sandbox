/**
 * Check if a date (YYYY-MM-DD) is exactly tomorrow
 * @param {string} dateStr - Date in format "YYYY-MM-DD"
 * @returns {boolean} true if date is tomorrow, false otherwise
 */
function isTomorrow(dateStr) {
  // Проверка формата
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;

  const inputDate = new Date(`${dateStr}T00:00:00`);

  // Проверка валидности
  if (isNaN(inputDate.getTime())) return false;

  // Сегодня
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Завтра
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  return inputDate.getTime() === tomorrow.getTime();
}

// Примеры:
console.log(isTomorrow("2025-08-25")); // false (сегодня)
console.log(isTomorrow("2025-08-26")); // true (завтра)
console.log(isTomorrow("2025-08-27")); // false (послезавтра)
console.log(isTomorrow("2025-02-30")); // false (некорректная дата)