import { html } from 'lit';
import { highlightMatches } from './highlightMatches.js';

/**
 * HighlightableMixin adds text highlight tracking to Lit components.
 *
 * Features:
 * - Allows multiple calls to `this.highlight()` inside render().
 * - Automatically tracks if the component (or any child) contains at least one match.
 * - Sets `matched="true"` or `matched="false"` after each render, based on match presence.
 * - Ensures compatibility with both Shadow DOM and Light DOM components.
 *
 * Expected usage:
 * - Call `this.highlight()` inside your `render()` method instead of `highlightMatches()`.
 * - Use the `matched` attribute (true/false) for filtering or styling.
 *
 * Behavior when query is empty:
 * - Automatically sets `matched="true"` to indicate "no filter" mode (all items visible).
 *
 * @template {import('lit').LitElement} T
 * @param {T} Base - The LitElement-based class to extend
 * @returns {T & { highlight: Function }}
 */
export const HighlightableMixin = (Base) => class extends Base {
  constructor() {
    super();
    /** @private {boolean} True if any local highlight match was found during the current render cycle */
    this._highlightMatchFound = false;

    /** @private {string} Stores the last query passed to highlight() during this render */
    this._currentQuery = '';
  }

  /**
   * Highlight wrapper to be used inside render().
   * Tracks local matches and stores the query for later attribute update.
   *
   * @param {string} text - The text content to highlight.
   * @param {string} query - The search query.
   * @param {object} [options] - Highlighting options (normalizers, splitWords, etc.).
   * @returns {any} Either a Lit TemplateResult[] or an HTML string, based on rendering context.
   */
  highlight(text, query, options = {}) {
    this._currentQuery = query;
    const result = highlightMatches(text, query, options);

    if (this._checkLocalMatch(result)) {
      this._highlightMatchFound = true;
    }

    return result;
  }

  /**
   * Getter: returns true if at least one local match was found during this render.
   *
   * @returns {boolean}
   */
  get hasLocalMatch() {
    return this._highlightMatchFound;
  }

  /**
   * Lifecycle method called after each update/render.
   * Sets the "matched" attribute based on:
   * - If the current query is empty → always "true".
   * - If local matches exist.
   * - If any descendants (in renderRoot) have matched="true".
   */
  updated() {
    super.updated?.();

    const queryIsEmpty = !this._currentQuery?.trim();
    const hasDescendantMatch = this._hasDescendantWithMatched();
    const shouldBeMatched = queryIsEmpty || this.hasLocalMatch || hasDescendantMatch;

    this.setAttribute('matched', String(shouldBeMatched));

    // Reset local match flag for the next render cycle
    this._highlightMatchFound = false;
  }

  /**
   * Internal helper to check if a highlight result contains at least one <mark> tag.
   * Works for both Lit TemplateResults and plain HTML strings.
   *
   * @private
   * @param {any} result - The result returned from highlightMatches().
   * @returns {boolean}
   */
  _checkLocalMatch(result) {
    if (Array.isArray(result)) {
      // For Lit TemplateResults: check if any template string contains "<mark"
      return result.some(part =>
        part.strings?.some?.(s => s.includes('<mark'))
      );
    }
    if (typeof result === 'string') {
      // For HTML strings: simple substring check
      return result.includes('<mark>');
    }
    return false;
  }

  /**
   * Checks if any child element within the component's renderRoot has matched="true".
   * This ensures that parent components become "matched" if their descendants are matched.
   *
   * @private
   * @returns {boolean}
   */
  _hasDescendantWithMatched() {
    const root = this.renderRoot ?? this.shadowRoot ?? this;
    return root.querySelector?.('[matched="true"]') !== null;
  }
};