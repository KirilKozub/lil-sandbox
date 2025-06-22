/** query-manager.js */

// Stores current query values per key
const queryStore = new Map();
const listeners = new Map();
const queryOptions = new Map();
const normalizationCache = new Map();
const originalHTMLCache = new WeakMap();

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
  if (options) queryOptions.set(key, options);
  const subs = listeners.get(key);
  if (subs) subs.forEach((cb) => cb(value, queryOptions.get(key)));
}

/**
 * Gets the current query or options for a key
 */
export const getQuery = (key) => queryStore.get(key);
export const getQueryOptions = (key) => queryOptions.get(key);

/**
 * Subscribes to changes of query for a given key
 */
export function subscribeQuery(key, callback) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key).add(callback);
  return () => listeners.get(key)?.delete(callback);
}

/**
 * Normalization presets
 */
export const normalizerPresets = {
  default: [defaultNormalize],
  strict: [
    s => s.normalize('NFD'),
    s => s.replace(/\p{Diacritic}/gu, ''),
    s => s.replace(/ß/g, 'ss'),
    s => s.replace(/ä/g, 'ae'),
    s => s.replace(/ö/g, 'oe'),
    s => s.replace(/ü/g, 'ue'),
    s => s.replace(/[^a-z0-9]/gi, ''),
    s => s.toLowerCase(),
  ],
};

export function registerNormalizerPreset(name, steps) {
  if (!Array.isArray(steps) || steps.some(fn => typeof fn !== 'function')) {
    throw new Error('Normalizer preset must be an array of functions');
  }
  if (normalizerPresets[name]) {
    console.warn(`[highlight] Preset "${name}" will be overwritten.`);
  }
  normalizerPresets[name] = steps;
}

/**
 * Resets highlights by restoring original HTML
 */
export function resetHighlights(container) {
  container.querySelectorAll('[data-highlight]').forEach(el => {
    const original = originalHTMLCache.get(el);
    if (original !== undefined) el.innerHTML = original;
  });
}

/**
 * Highlights text matches in a container
 */
export function highlightMatches(container, query, options = {}) {
  resetHighlights(container);

  const highlightEls = container.querySelectorAll('[data-highlight]');
  highlightEls.forEach(el => {
    if (!originalHTMLCache.has(el)) {
      originalHTMLCache.set(el, el.innerHTML);
    }
  });

  if (!query?.trim()) return { hasLocalMatch: false };

  const terms = options.splitWords ? query.split(/\s+/).filter(Boolean) : [query];
  const normalizers = resolveNormalizers(options.normalizers);
  const normalizedTerms = terms.map(t => applyNormalizers(t, normalizers));

  let hasMatch = false;

  highlightEls.forEach(el => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node?.parentElement?.closest('[data-highlight]')) {
        textNodes.push(node);
      }
    }

    textNodes.forEach(node => {
      // Prevent modifying Lit-managed parts
      if (!(node.parentNode instanceof Element)) return;
      const originalText = node.textContent;
      if (!originalText) return;

      const marked = getMarkedHTML(originalText, normalizedTerms, options.exactMatch, normalizers);
      if (marked !== originalText) {
        const wrapper = document.createElement('span');
        wrapper.innerHTML = marked;
        try {
          node.replaceWith(...wrapper.childNodes);
          hasMatch = true;
        } catch (err) {
          console.warn('[highlight] DOM replace error:', err);
        }
      }
    });
  });

  return { hasLocalMatch: hasMatch };
}

/**
 * Helpers
 */
function resolveNormalizers(input) {
  if (!input) return normalizerPresets.default;
  if (typeof input === 'string') return normalizerPresets[input] || normalizerPresets.default;
  if (typeof input === 'function') return [input];
  if (Array.isArray(input)) {
    return input.flatMap(item =>
      typeof item === 'string' && normalizerPresets[item]
        ? normalizerPresets[item]
        : typeof item === 'function'
          ? [item]
          : []
    );
  }
  return normalizerPresets.default;
}

function defaultNormalize(s) {
  return s.normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/ß/g, 'ss')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .toLowerCase();
}

function applyNormalizers(str, normalizers) {
  const key = normalizers.map(fn => fn.name || '[anon]').join('|') + '::' + str;
  if (normalizationCache.has(key)) return normalizationCache.get(key);
  const result = normalizers.reduce((acc, fn) => fn(acc), str);
  normalizationCache.set(key, result);
  return result;
}

function getMarkedHTML(text, terms, exact = false, normalizers = normalizerPresets.default) {
  let result = '';
  let cursor = 0;
  const normText = applyNormalizers(text, normalizers);
  const matches = [];

  for (const term of terms) {
    const pattern = exact ? `(?<!\\w)${term}(?!\\w)` : term;
    const re = new RegExp(pattern, 'gi');
    let m;
    while ((m = re.exec(normText)) !== null) {
      matches.push({ index: m.index, length: term.length });
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
    const rawStart = index;
    const rawMatch = text.substring(rawStart, rawStart + length);
    result += text.substring(cursor, rawStart);
    result += `<mark>${rawMatch}</mark>`;
    cursor = rawStart + rawMatch.length;
  }

  result += text.substring(cursor);
  return result || text;
}

/**
 * LitElement mixin to sync source/target components with query updates
 */
export function mixinQuerySync(Base, { type, key, highlightOptions }) {
  return class extends Base {
    static properties = {
      hasQuery: { type: Boolean, reflect: true, attribute: 'has-query' },
      hasLocalMatch: { type: Boolean, reflect: true, attribute: 'has-local-match' },
      hasShadowMatch: { type: Boolean, reflect: true, attribute: 'has-shadow-match' },
      hasAnyMatch: { type: Boolean, reflect: true, attribute: 'has-any-match' },
    };

    connectedCallback() {
      super.connectedCallback?.();
      if (type === 'target') {
        this.__unsub = subscribeQuery(key, (query, opts) => {
          this.hasQuery = Boolean(query?.trim());
          const activeOptions = opts || getQueryOptions(key) || {};
          const { hasLocalMatch } = highlightMatches(this.renderRoot, query, activeOptions);
          this.hasLocalMatch = hasLocalMatch;
          this.hasShadowMatch = Array.from(this.renderRoot?.querySelectorAll('[has-local-match]') || [])
            .some((el) => el.hasAttribute('has-local-match'));
          this.hasAnyMatch = this.hasLocalMatch || this.hasShadowMatch;
        });

        const current = getQuery(key);
        if (current) {
          const { hasLocalMatch } = highlightMatches(this.renderRoot, current, getQueryOptions(key) || {});
          this.hasQuery = Boolean(current?.trim());
          this.hasLocalMatch = hasLocalMatch;
          this.hasShadowMatch = Array.from(this.renderRoot?.querySelectorAll('[has-local-match]') || [])
            .some((el) => el.hasAttribute('has-local-match'));
          this.hasAnyMatch = this.hasLocalMatch || this.hasShadowMatch;
        }
      }
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
      if (type === 'target') this.__unsub?.();
    }

    updateQuery(value) {
      if (type === 'source') {
        setQuery(key, value, highlightOptions);
      }
    }
  };
}
