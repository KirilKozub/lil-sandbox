/**
 * Extracts tax entries from a serialized taxIds object.
 *
 * @param {object} taxIds - The taxIds object from formSerializedValue.
 * @returns {{countryOfIssue: string, value: string}[]} Normalized tax data.
 */
function extractTaxList(taxIds) {
  /** @type {{countryOfIssue: string, value: string}[]} */
  const result = [];

  const countries = [];
  const numbers = [];

  Object.keys(taxIds).forEach((key) => {
    if (key.startsWith('countryOfTaxResidence_')) {
      const index = Number(key.split('_')[1]);
      countries[index] = taxIds[key];
    }

    if (key.startsWith('taxNumber_')) {
      const index = Number(key.split('_')[1]) - 1; // numbering is 1-based
      numbers[index] = taxIds[key];
    }
  });

  for (let i = 0; i < countries.length; i++) {
    if (countries[i] && numbers[i]) {
      result.push({
        countryOfIssue: countries[i],
        value: numbers[i],
      });
    }
  }

  return result;
}