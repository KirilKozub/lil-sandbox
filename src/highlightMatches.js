import { html } from 'lit';

/**
 * @typedef {string | ((text: string) => string)} Normalizer
 */

/**
 * Highlight function for text search and marking.
 *
 * Supports:
 * - Lit TemplateResult[] output
 * - Plain HTML string output
 * - Optional browser CSS Highlight API (if enabled via options)
 *
 * Options:
 * @typedef {Object} HighlightOptions
 * @property {string} [key] - Unique key for Highlight API (used only if useHighlightAPI=true). Default: auto-generated.
 * @property {boolean} [multipleMatches=true] - Highlight all matches (true) or only the first (false).
 * @property {boolean} [splitWords=true] - Split query into words by spaces and highlight each separately.
 * @property {Normalizer | Normalizer[]} [normalizers=[]] - Normalizer function(s) or preset name(s). Presets: 'lowercase', 'trim', 'no-diacritics', 'de-german', 'alnum', 'iban'.
 * @property {'template' | 'html'} [output='template'] - Output format: `'template'` for Lit TemplateResult[], `'html'` for plain string.
 * @property {boolean} [useHighlightAPI=false] - If true, enables browser CSS Highlight API. Default: false.
 *
 * @param {string} text - The text to highlight.
 * @param {string} query - The search query string.
 * @param {HighlightOptions} [options={}] - Highlighting configuration.
 * @returns {string | import('lit').TemplateResult[]} Highlighted result.
 */
export function highlightMatches(text, query, options = {}) {
  const outputMode = options.output || 'template';
  const effectiveOptions = withPresetDefaults(options);

  if (options.useHighlightAPI && supportsHighlightAPI()) {
    highlightUsingAPI(text, query, effectiveOptions);
    return outputMode === 'template' ? [html`${text}`] : text;
  }

  return outputMode === 'template'
    ? highlightToTemplate(text, query, effectiveOptions)
    : highlightToHTML(text, query, effectiveOptions);
}

/**
 * Checks if browser supports the CSS Highlight API.
 * @returns {boolean}
 */
function supportsHighlightAPI() {
  return typeof Highlight !== 'undefined' &&
    typeof CSSHighlightRegistry !== 'undefined' &&
    'highlights' in navigator;
}

/**
 * Performs highlighting using the browser CSS Highlight API.
 *
 * @param {string} text
 * @param {string} query
 * @param {object} options
 */
function highlightUsingAPI(text, query, options) {
  const {
    key = generateUniqueKey(),
    multipleMatches = true,
    splitWords = true,
    normalizers = [],
  } = options;

  const registry = navigator.highlights;

  if (!query?.trim()) {
    registry.delete(key);
    return;
  }

  const normalizerChain = resolveNormalizers(normalizers);
  const words = splitWords ? query.trim().split(/\s+/) : [query.trim()];
  const normWords = words.map(w => applyNormalizers(w, normalizerChain));
  const ranges = [];

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const normText = applyNormalizers(node.textContent, normalizerChain);

    normWords.forEach(word => {
      if (!word) return;
      const re = new RegExp(escapeRegExp(word), multipleMatches ? 'gi' : 'i');
      let match;
      while ((match = re.exec(normText))) {
        const range = document.createRange();
        range.setStart(node, match.index);
        range.setEnd(node, match.index + match[0].length);
        ranges.push(range);
        if (!multipleMatches) return;
      }
    });
  }

  registry.set(key, new Highlight(...ranges));
}

/**
 * Generates a unique random key for Highlight API.
 * @returns {string}
 */
function generateUniqueKey() {
  return `highlight-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Returns array of [start, end] ranges for matches inside the text.
 *
 * @param {string} text
 * @param {string} query
 * @param {object} options
 * @returns {Array<[number, number]>}
 */
function getMatchRanges(text, query, options) {
  const {
    multipleMatches = true,
    splitWords = true,
    normalizers = [],
  } = options;

  if (!query || typeof text !== 'string') return [];

  const chain = resolveNormalizers(normalizers);
  const normQueryWords = (splitWords ? query.trim().split(/\s+/) : [query.trim()])
    .map(q => applyNormalizers(q, chain));

  const normText = applyNormalizers(text, chain);
  const pattern = normQueryWords.filter(Boolean).map(escapeRegExp).join('|');
  if (!pattern) return [];

  const re = new RegExp(pattern, multipleMatches ? 'gi' : 'i');
  const ranges = [];
  let match;

  while ((match = re.exec(normText))) {
    const start = getRawSliceIndex(text, normText, 0, match.index);
    const end = getRawSliceIndex(text, normText, 0, re.lastIndex);
    ranges.push([start, end]);
    if (!multipleMatches) break;
  }

  return ranges;
}

/**
 * Converts text + match ranges to Lit TemplateResult[].
 *
 * @param {string} text
 * @param {string} query
 * @param {object} options
 * @returns {import('lit').TemplateResult[]}
 */
function highlightToTemplate(text, query, options) {
  const ranges = getMatchRanges(text, query, options);
  if (!ranges.length) return [html`${text}`];

  const result = [];
  let last = 0;

  for (const [start, end] of ranges) {
    if (start > last) result.push(html`${text.slice(last, start)}`);
    result.push(html`<mark>${text.slice(start, end)}</mark>`);
    last = end;
  }

  if (last < text.length) result.push(html`${text.slice(last)}`);
  return result;
}

/**
 * Converts text + match ranges to plain HTML string with <mark> tags.
 *
 * @param {string} text
 * @param {string} query
 * @param {object} options
 * @returns {string}
 */
function highlightToHTML(text, query, options) {
  const ranges = getMatchRanges(text, query, options);
  if (!ranges.length) return escapeHTML(text);

  let htmlStr = '';
  let last = 0;

  for (const [start, end] of ranges) {
    htmlStr += escapeHTML(text.slice(last, start));
    htmlStr += `<mark>${escapeHTML(text.slice(start, end))}</mark>`;
    last = end;
  }

  htmlStr += escapeHTML(text.slice(last));
  return htmlStr;
}

/**
 * Escapes HTML special characters.
 *
 * @param {string} str
 * @returns {string}
 */
function escapeHTML(str) {
  return str.replace(/[&<>"']/g, ch => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}

/**
 * Maps normalized index back to original text index.
 *
 * @param {string} original
 * @param {string} normalized
 * @param {number} from
 * @param {number} to
 * @returns {number}
 */
function getRawSliceIndex(original, normalized, from, to) {
  const raw = applyNormalizers(original.slice(0, to), []);
  return raw.length;
}

/**
 * Applies all normalizers sequentially.
 *
 * @param {string} input
 * @param {Function[]} normalizers
 * @returns {string}
 */
function applyNormalizers(input, normalizers) {
  return normalizers.reduce((acc, fn) => fn(acc), input);
}

/**
 * Resolves normalizers from preset names and functions into function array.
 *
 * @param {Normalizer | Normalizer[]} raw
 * @returns {Function[]}
 */
function resolveNormalizers(raw) {
  const list = Array.isArray(raw) ? raw : [raw];
  return list.map(n => {
    if (typeof n === 'function') return n;
    if (typeof n === 'string') return getPresetNormalizer(n);
    return x => x;
  });
}

/**
 * Applies default behavior for known presets (e.g., IBAN disables splitWords).
 *
 * @param {object} options
 * @returns {object}
 */
function withPresetDefaults(options) {
  const normalizers = Array.isArray(options.normalizers) ? options.normalizers : [options.normalizers];
  if (normalizers.includes('iban')) {
    return {
      ...options,
      splitWords: false,
      normalizers,
    };
  }
  return options;
}

/**
 * Returns predefined normalizer functions for known presets.
 *
 * Supported presets:
 * - 'lowercase': Converts text to lowercase.
 * - 'trim': Trims leading and trailing spaces.
 * - 'no-diacritics': Removes diacritical marks (accents).
 * - 'de-german': Converts German umlauts and ß (e.g., ä → ae, ß → ss).
 * - 'alnum': Keeps only alphanumeric characters (removes spaces and symbols).
 * - 'iban': Removes spaces and converts to uppercase (special handling for IBAN matching).
 *
 * @param {string} name
 * @returns {(text: string) => string}
 */
function getPresetNormalizer(name) {
  switch (name.toLowerCase()) {
    case 'lowercase': return s => s.toLowerCase();
    case 'trim': return s => s.trim();
    case 'no-diacritics': return s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    case 'de-german': return s =>
      s.replace(/ß/g, 'ss').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue');
    case 'alnum': return s => s.replace(/[^\p{L}\p{N}]/gu, '');
    case 'iban': return s => s.replace(/\s+/g, '').toUpperCase();
    default: return s => s;
  }
}

/**
 * Escapes special RegExp characters.
 *
 * @param {string} str
 * @returns {string}
 */
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}