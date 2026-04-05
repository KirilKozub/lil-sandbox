/**
 * @typedef {{ category: string, message?: string, code?: string }} Message
 */

/**
 * Inverts mapping from message -> code to code -> message
 *
 * @param {Record<string, string>} mapping
 * @returns {Record<string, string>}
 */
function invertMapping(mapping) {
  return Object.entries(mapping).reduce((acc, [message, code]) => {
    acc[code] = message;
    return acc;
  }, {});
}

/**
 * Collects error messages where message matches expected code from mapping
 *
 * @param {Message[]} messages
 * @param {Record<string, string>} mapping // message -> code
 * @param {string} [prefix='']
 * @param {string} DEFAULT_ERROR_CODE
 * @returns {string[]}
 */
export function collectMatchingErrorMessages(
  messages,
  mapping,
  prefix = '',
  DEFAULT_ERROR_CODE
) {
  return messages
    .filter(item => item.category === 'ERROR')
    .map(item => {
      const expectedCode = mapping[item.message];

      if (expectedCode && expectedCode === item.code) {
        return `${prefix}.${item.message}`;
      }

      return DEFAULT_ERROR_CODE;
    });
}

/**
 * Collects error messages based on code (reverse lookup)
 *
 * @param {Message[]} messages
 * @param {Record<string, string>} mapping // message -> code
 * @param {string} [prefix='']
 * @returns {string[]}
 */
export function collectErrorMessagesByCode(
  messages,
  mapping,
  prefix = ''
) {
  const codeToMessage = invertMapping(mapping);

  return messages
    .filter(item => item.category === 'ERROR')
    .map(item => {
      const message = codeToMessage[item.code];
      return message ? `${prefix}.${message}` : null;
    })
    .filter(Boolean);
}