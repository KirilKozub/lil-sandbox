/** query-manager.js */

// Stores current query values per key
const queryStore = new Map();

// Stores subscribers per key to notify on changes
const listeners = new Map();

// Stores options (e.g., highlight settings) per key
const queryOptions = new Map();

// Caches normalized results for performance
const normalizationCache = new Map();

/**
 * Clears the normalization cache (for debug or reset)
 */
export function clearNormalizationCache() {
  normalizationCache.clear();
}

/**
 * Sets a query value by key and notifies all subscribers
 * @param {string} key
 * @param {string} value
 * @param {object} [options]
 */
export function setQuery(key, value, options) {
  queryStore.set(key, value);
  if (options) {
    queryOptions.set(key, options);
  }
  const subs = listeners.get(key);
  if (subs) subs.forEach((cb) => cb(value, queryOptions.get(key)));
}

/**
 * Gets the current query value for the given key
 * @param {string} key
 * @returns {string | undefined}
 */
export function getQuery(key) {
  return queryStore.get(key);
}

/**
 * Gets the current options for the given key
 * @param {string} key
 * @returns {object | undefined}
 */
export function getQueryOptions(key) {
  return queryOptions.get(key);
}

/**
 * Subscribes to changes of query for a given key
 * @param {string} key
 * @param {(value: string, options?: object) => void} callback
 * @returns {() => void} unsubscribe function
 */
export function subscribeQuery(key, callback) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key).add(callback);
  return () => listeners.get(key)?.delete(callback);
}

/**
 * Built-in normalizer presets
 */
export const normalizerPresets = {
  default: [defaultNormalize],
  strict: [
    (s) => s.normalize('NFD'),
    (s) => s.replace(/\p{Diacritic}/gu, ''),
    (s) => s.replace(/ß/g, 'ss'),
    (s) => s.replace(/ä/g, 'ae'),
    (s) => s.replace(/ö/g, 'oe'),
    (s) => s.replace(/ü/g, 'ue'),
    (s) => s.replace(/[^a-z0-9]/gi, ''),
    (s) => s.toLowerCase(),
  ],
};

/**
 * Allows user to register a custom normalizer preset
 * @param {string} name
 * @param {(input: string) => string}[] steps
 */
export function registerNormalizerPreset(name, steps) {
  if (!Array.isArray(steps) || steps.some(fn => typeof fn !== 'function')) {
    throw new Error('Normalizer preset must be an array of functions');
  }
  if (normalizerPresets[name]) {
    console.warn(`[highlight] Preset "${name}" already exists and will be overwritten.`);
  }
  normalizerPresets[name] = steps;
}

/**
 * Highlights matches inside container based on query
 * @param {HTMLElement} container
 * @param {string} query
 * @param {{ splitWords?: boolean, exactMatch?: boolean, normalizers?: string | Function | Function[] }} [options]
 */
export function highlightMatches(container, query, options = {}) {
  if (!query) return;
  const terms = options.splitWords ? query.split(/\s+/).filter(Boolean) : [query];
  const normalizers = resolveNormalizers(options.normalizers);
  const normalizedTerms = terms.map((term) => applyNormalizers(term, normalizers));
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);

  /** @type {Text[]} */
  const textNodes = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node?.parentElement?.closest('[data-highlight]')) textNodes.push(node);
  }

  textNodes.forEach((node) => {
    const parent = node.parentElement;
    if (!parent) return;
    const originalText = node.textContent;
    if (!originalText) return;

    const markReplaced = getMarkedHTML(originalText, normalizedTerms, options.exactMatch, normalizers);
    if (markReplaced !== originalText) {
      const span = document.createElement('span');
      span.innerHTML = markReplaced;
      parent.replaceChild(span, node);
    }
  });
}

/**
 * Resolves normalizers from string, function or array format
 * @param {string | Function | Function[]} input
 * @returns {Function[]}
 */
function resolveNormalizers(input) {
  if (!input) return normalizerPresets.default;
  if (typeof input === 'string') return normalizerPresets[input] || normalizerPresets.default;
  if (typeof input === 'function') return [input];
  if (Array.isArray(input)) {
    const resolved = [];
    for (const item of input) {
      if (typeof item === 'string' && normalizerPresets[item]) {
        resolved.push(...normalizerPresets[item]);
      } else if (typeof item === 'function') {
        resolved.push(item);
      }
    }
    return resolved;
  }
  return normalizerPresets.default;
}

/**
 * Default normalization logic
 * @param {string} input
 * @returns {string}
 */
function defaultNormalize(input) {
  return input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/ß/g, 'ss')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .toLowerCase();
}

/**
 * Applies an array of normalizers to a string with caching
 * @param {string} input
 * @param {Function[]} normalizers
 * @returns {string}
 */
function applyNormalizers(input, normalizers) {
  const key = normalizers.map(fn => fn.name || '[anon]').join('|') + '::' + input;
  if (normalizationCache.has(key)) return normalizationCache.get(key);
  const result = normalizers.reduce((acc, fn) => fn(acc), input);
  normalizationCache.set(key, result);
  return result;
}

/**
 * Wraps all matches in <mark> tags
 * @param {string} text
 * @param {string[]} normalizedTerms
 * @param {boolean} [exactMatch=false]
 * @param {Function[]} normalizers
 * @returns {string}
 */
function getMarkedHTML(text, normalizedTerms, exactMatch = false, normalizers = normalizerPresets.default) {
  let result = '';
  let cursor = 0;
  const normText = applyNormalizers(text, normalizers);
  const matches = [];

  for (const term of normalizedTerms) {
    const boundaryRegex = exactMatch
      ? new RegExp(`(?<!\\w)${term}(?!\\w)`, 'gi')
      : new RegExp(term, 'gi');

    let match;
    while ((match = boundaryRegex.exec(normText)) !== null) {
      matches.push({ index: match.index, length: term.length });
    }
  }

  matches.sort((a, b) => a.index - b.index);
  const nonOverlapping = [];
  let lastEnd = 0;
  for (const m of matches) {
    if (m.index >= lastEnd) {
      nonOverlapping.push(m);
      lastEnd = m.index + m.length;
    }
  }

  for (const { index, length } of nonOverlapping) {
    const rawStart = [...text].slice(0, index).join('').length;
    const rawMatch = [...text].slice(rawStart, rawStart + length).join('');
    result += text.substring(cursor, rawStart);
    result += '<mark>' + rawMatch + '</mark>';
    cursor = rawStart + rawMatch.length;
  }

  result += text.substring(cursor);
  return result || text;
}

/**
 * Lit mixin to wire components to query state
 * @template {import('lit').ReactiveElement} T
 * @param {T} Base
 * @param {{ type: 'source' | 'target', key: string, highlightOptions?: object }} options
 * @returns {T}
 */
export function mixinQuerySync(Base, { type, key, highlightOptions }) {
  return class extends Base {
    connectedCallback() {
      super.connectedCallback?.();
      if (type === 'target') {
        this.__unsub = subscribeQuery(key, (query, opts) => {
          const activeOptions = opts || getQueryOptions(key) || {};
          highlightMatches(this.renderRoot, query, activeOptions);
        });
        const current = getQuery(key);
        if (current) highlightMatches(this.renderRoot, current, getQueryOptions(key) || {});
      }
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
      if (type === 'target') this.__unsub?.();
    }

    /** Used in source components to push new query */
    updateQuery(value) {
      if (type === 'source') setQuery(key, value, highlightOptions);
    }
  };
}
