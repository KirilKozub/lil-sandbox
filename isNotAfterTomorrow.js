/**
 * Check if a date (YYYY-MM-DD) is today, tomorrow, or in the past
 * @param {string} dateStr - Date in format "YYYY-MM-DD"
 * @returns {boolean} true if date <= tomorrow, false otherwise
 */
function isNotAfterTomorrow(dateStr) {
  // Проверка формата
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;

  const inputDate = new Date(`${dateStr}T00:00:00`); // ISO-строка безопасна

  // Проверка валидности даты
  if (isNaN(inputDate.getTime())) return false;

  // Нормализация для сравнения
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  return inputDate <= tomorrow;
}

// Примеры:
console.log(isNotAfterTomorrow("2025-08-25")); // true (сегодня)
console.log(isNotAfterTomorrow("2025-08-26")); // true (завтра)
console.log(isNotAfterTomorrow("2025-08-27")); // false (послезавтра)
console.log(isNotAfterTomorrow("2025-02-30")); // false (некорректная дата)