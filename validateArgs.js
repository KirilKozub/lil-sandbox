/**
 * Validate required arguments with customizable invalid values.
 *
 * @param {Record<string, unknown>} args - key/value pairs to validate
 * @param {unknown[]} [invalidValues=[undefined, null, '']] - values considered invalid
 * @throws {Error} if any argument is invalid
 */
function validateArgs(args, invalidValues = [undefined, null, '']) {
  const missing = Object.entries(args)
    .filter(([_, value]) => invalidValues.includes(value))
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Invalid or missing argument(s): ${missing.join(', ')}`);
  }
}