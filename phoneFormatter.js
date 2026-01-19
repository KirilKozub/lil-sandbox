/**
 * Very simple German phone formatter.
 * Assumes the number is already a valid German number.
 *
 * Input examples:
 *  - +496994322250
 *  - 06994322250
 *
 * Output:
 *  - local: "069 / 943 222 50"
 *  - international: "+49 69 / 943 222 50"
 */

/**
 * @param {string} input
 * @returns {{ local: string, international: string }}
 */
export function formatGermanPhoneSimple(input) {
  const digits = String(input).replace(/[^\d+]/g, '');

  // normalize to national starting with 0
  let national;
  if (digits.startsWith('+49')) {
    national = `0${digits.slice(3)}`;
  } else if (digits.startsWith('49')) {
    national = `0${digits.slice(2)}`;
  } else {
    national = digits;
  }

  // Frankfurt-style split: 0XX / XXX XXX XX
  const area = national.slice(0, 3);        // 069
  const rest = national.slice(3);            // 94322250

  const subscriber =
    `${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`.trim();

  return {
    local: `${area} / ${subscriber}`,
    international: `+49 ${area.slice(1)} / ${subscriber}`,
  };
}