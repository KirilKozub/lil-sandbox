import { normalizeVisibleText } from '../utils/normalizeVisibleText';

/**
 * Preprocesses viewValue to replace diacritics and recalculates caret index.
 *
 * @param {string} viewValue - The current input value (with possible pasted content).
 * @param {Object} opts - Options including caret position and previous value.
 * @param {number} opts.currentCaretIndex - Caret index after the insertion.
 * @param {string} opts.prevViewValue - Previous value before the change.
 * @returns {{ viewValue: string, caretIndex: number }}
 */
export const DiacriticPreprocessor = (viewValue = '', opts = {}) => {
  console.log('DiacriticPreprocessor ~ opts:', opts);

  const { currentCaretIndex = 0, prevViewValue = '' } = opts;

  const normalize = (value) => normalizeVisibleText(value)
    .replaceAll('ä', 'ae')
    .replaceAll('Ä', 'Ae')
    .replaceAll('ö', 'oe')
    .replaceAll('Ö', 'Oe')
    .replaceAll('ü', 'ue')
    .replaceAll('Ü', 'Ue')
    .replaceAll('ß', 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const normalizedValue = normalize(viewValue);

  // Calculate caret shift by comparing lengths
  const lengthDiff = normalizedValue.length - viewValue.length;
  const newCaretIndex = currentCaretIndex + lengthDiff;

  return {
    viewValue: normalizedValue,
    caretIndex: newCaretIndex
  };
};