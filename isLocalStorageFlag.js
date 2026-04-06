/**
 * Checks if a value in localStorage matches expected value (stringified)
 * @param {string} key
 * @param {unknown} expectedValue
 * @returns {boolean}
 */
export function isLocalStorageFlag(key, expectedValue) {
  const value = window.localStorage.getItem(key);

  if (value === null) {
    return false;
  }

  return value === String(expectedValue);
}