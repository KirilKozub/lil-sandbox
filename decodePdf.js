/**
 * @typedef {Object} PdfResponse
 * @property {string} filename
 * @property {string} data        // base64 (в т.ч. url-safe)
 */

/**
 * Безопасно декодирует base64 (поддерживает url-safe вариант).
 * @param {string} b64
 * @returns {Uint8Array}
 */
function decodeBase64ToBytes(b64) {
  if (typeof b64 !== 'string' || b64.length === 0) {
    throw new Error('Empty base64 payload');
  }

  // Нормализуем url-safe base64 и убираем пробелы/переводы строки
  const normalized = b64.replace(/[\r\n\s]/g, '').replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + '='.repeat(padLen);

  const binary = atob(padded);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Генерирует Blob URL для PDF.
 * @param {PdfResponse} resp
 * @returns {string} Blob URL (подходит для href/src/window.open)
 */
export function generatePdfUrl(resp) {
  if (!resp || typeof resp.data !== 'string') {
    throw new Error('Invalid response: missing data');
  }
  const bytes = decodeBase64ToBytes(resp.data);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}

/**
 * Открывает PDF в новой вкладке и корректно освобождает URL.
 * @param {PdfResponse} resp
 */
export function openPdfInNewTab(resp) {
  const url = generatePdfUrl(resp);

  // Пытаемся открыть во вкладке (popup-блокер может помешать, вызывать по клику)
  const win = window.open(url, '_blank', 'noopener');
  // Страховка: освобождаем URL через таймер и при закрытии текущей страницы
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  window.addEventListener('beforeunload', () => URL.revokeObjectURL(url), { once: true });

  return win; // может быть null, если заблокировано
}