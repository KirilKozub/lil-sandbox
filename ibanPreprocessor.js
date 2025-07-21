/**
 * @param {string} value - текущий value инпута (с пробелами)
 * @param {number} caretIndex - текущая позиция курсора
 * @returns {{ viewValue: string, caretIndex: number }}
 */
const ibanPreprocessor = (value, caretIndex) => {
  // Удаляем пробелы
  const raw = value.replace(/\s+/g, '').toUpperCase();

  // Защита префикса DE
  const forced = raw.startsWith('DE') ? raw : 'DE' + raw.replace(/^DE/, '');
  
  // Определим позицию курсора в "сырых" символах
  const charsBeforeCaret = value.slice(0, caretIndex).replace(/\s+/g, '').length;

  // Форматируем строку: по 4 символа
  const groups = forced.match(/.{1,4}/g) || [];
  const viewValue = groups.join(' ');

  // Теперь пересчитываем caretIndex: сколько символов до charsBeforeCaret в форматированной строке
  let newCaret = 0;
  let count = 0;

  for (const group of groups) {
    for (const char of group) {
      if (count === charsBeforeCaret) break;
      newCaret++;
      count++;
    }
    if (count === charsBeforeCaret) break;
    newCaret++; // добавляем пробел
  }

  return {
    viewValue,
    caretIndex: newCaret,
  };
};