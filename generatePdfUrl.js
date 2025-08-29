/**
 * @typedef {Object} PdfResponse
 * @property {string} filename  // Name of the file
 * @property {string} data      // Base64 string (may be URL-safe)
 */

/**
 * Decodes a Base64 string (including URL-safe format) into a Uint8Array.
 * @param {string} b64 - The Base64 string to decode.
 * @returns {Uint8Array} - The decoded binary data as a byte array.
 */
export function decodeBase64ToBytes(b64) {
  if (typeof b64 !== 'string' || b64.length === 0) {
    throw new Error('Base64 string is empty or invalid');
  }

  // Normalize URL-safe Base64 and remove whitespace
  const normalized = b64.replace(/[\r\n\s]/g, '').replace(/-/g, '+').replace(/_/g, '/');
  const padding = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + '='.repeat(padding);

  // Decode to binary
  const binary = atob(padded);
  const { length } = binary;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generates a Blob URL for a PDF file.
 * This URL can be used in `href`, `src`, or `window.open`.
 * Using ArrayBuffer ensures compatibility with TypeScript DOM types.
 *
 * @param {PdfResponse} resp - The response object containing filename and Base64 data.
 * @returns {string} - A Blob URL representing the PDF file.
 */
export function generatePdfUrl(resp) {
  if (!resp || typeof resp.data !== 'string') {
    throw new Error('Invalid response: missing base64 data');
  }

  // Decode Base64 into bytes
  const bytes = decodeBase64ToBytes(resp.data);

  // Convert Uint8Array into an ArrayBuffer for Blob compatibility
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

  // Create a Blob and generate an Object URL
  const blob = new Blob([buffer], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}

/**
 * Opens a PDF in a new browser tab and revokes the URL automatically after a delay.
 *
 * @param {PdfResponse} resp - The response object with filename and Base64 data.
 * @returns {Window|null} - The reference to the opened window (may be null if blocked by popup settings).
 */
export function openPdfInNewTab(resp) {
  const url = generatePdfUrl(resp);

  // Open the Blob URL in a new tab
  const win = window.open(url, '_blank', 'noopener');

  // Revoke the URL after 60 seconds to free memory
  setTimeout(() => URL.revokeObjectURL(url), 60_000);

  // Also revoke the URL when the page is unloaded
  window.addEventListener('beforeunload', () => URL.revokeObjectURL(url), { once: true });

  return win;
}