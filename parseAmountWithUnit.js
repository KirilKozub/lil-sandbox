/**
 * Splits a string like "10M" into number and unit.
 *
 * @param {string} value - Input value (e.g. "10M").
 * @returns {{ amount: number, unit: string } | null}
 */
export const parseAmountWithUnit = (value) => {
  const match = value.match(/^(\d+)([A-Za-z])$/);

  if (!match) {
    return null;
  }

  const [, amount, unit] = match;

  return {
    amount: Number(amount),
    unit,
  };
};