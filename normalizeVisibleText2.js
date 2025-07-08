/**
 * Normalize visible text for SEPA inputs by:
 * 1. Replacing line breaks, tabs, soft hyphens, and exotic Unicode spaces with normal spaces.
 * 2. Removing truly invisible zero-width and control characters that may sneak in via copy-paste.
 *
 * @param {string} str - The input string to normalize.
 * @returns {string} - The normalized string.
 */
export function normalizeVisibleText(str) {
  if (typeof str !== 'string') return str;

  let result = str;

  // 1. Replace line breaks, tabs, and soft hyphen with a normal space:
  // \r → Carriage Return — invisible line break from Windows or old systems
  // \n → Line Feed — standard line break (Unix, MacOS, Linux)
  // \t → Horizontal Tab — invisible tab character
  // \u2028 → Line Separator — invisible line break (PDF, Mac, some JSON)
  // \u2029 → Paragraph Separator — invisible paragraph separator
  // \u00AD → Soft Hyphen — invisible unless text wraps (Word, PDFs)
  result = result.replace(/[\r\n\t\u2028\u2029\u00AD]/g, ' ');

  // 2. Replace exotic Unicode spaces with a normal space:
  // \u00A0 → No-Break Space — visually like space, prevents line break (Word, HTML &nbsp;)
  // \u2000 → EN QUAD — slightly wider space
  // \u2001 → EM QUAD — even wider space
  // \u2002 → EN SPACE — typographic narrow space
  // \u2003 → EM SPACE — wide typographic space
  // \u2004 → THREE-PER-EM SPACE — narrow space
  // \u2005 → FOUR-PER-EM SPACE — narrower space
  // \u2006 → SIX-PER-EM SPACE — ultra-narrow space
  // \u2007 → FIGURE SPACE — fixed-width space for digits
  // \u2008 → PUNCTUATION SPACE — space for punctuation alignment
  // \u2009 → THIN SPACE — very thin space
  // \u200A → HAIR SPACE — ultra-thin space (almost invisible)
  result = result.replace(/[\u00A0\u2000-\u200A\u2007\u2008\u2009]/g, ' ');

  // 3. Remove zero-width and invisible control characters completely:
  // \u200B → ZERO WIDTH SPACE — completely invisible, often in web content, Telegram, PDFs
  // \u200C → ZERO WIDTH NON-JOINER — invisible, used in Persian, Arabic scripts
  // \u200D → ZERO WIDTH JOINER — invisible, used for ligatures and emoji sequences
  // \u2060 → WORD JOINER — prevents line break, fully invisible
  // \uFEFF → ZERO WIDTH NO-BREAK SPACE (BOM) — invisible, from UTF-8 BOM
  // \u180E → MONGOLIAN VOWEL SEPARATOR — deprecated, invisible character from old systems or OCR
  result = result.replace(/[\u200B\u200C\u200D\u2060\uFEFF\u180E]/g, '');

  return result;
}