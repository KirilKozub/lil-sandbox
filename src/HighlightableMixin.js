import { html } from 'lit';
import { highlightMatches } from './highlightMatches.js';

/**
 * Mixin that adds highlight-tracking and filtering state to a Lit component.
 *
 * Features:
 * - Allows multiple calls to `this.highlight()` inside a single render cycle.
 * - Tracks both local matches (from this component's highlight calls) and descendant matches (from child components with the same mixin).
 * - Automatically sets and reflects the following attributes:
 *    - `matched`: `"true"` / `"false"`, used for filtering visibility.
 *    - `localMatchCount`: number of local highlight matches in this component.
 *    - `descendantMatchCount`: number of child components with `matched="true"`.
 *
 * Behavior when query is empty:
 * - Always sets `matched="true"`, meaning "visible by default when no filter is applied".
 *
 * Usage:
 * - Use `this.highlight()` inside your `render()`.
 * - In your CSS or filtering logic, use `[matched="true"]` and `[matched="false"]` as needed.
 *
 * @template {import('lit').LitElement} T
 * @param {T} Base - Base LitElement class to extend.
 * @returns {T & { highlight: Function }}
 */
export const HighlightableMixin = (Base) => class extends Base {
  static properties = {
    /**
     * Total number of highlight matches from this component's own `highlight()` calls.
     * @type {number}
     */
    localMatchCount: { type: Number, reflect: true },

    /**
     * Total number of descendant elements (inside renderRoot) with `matched="true"`.
     * @type {number}
     */
    descendantMatchCount: { type: Number, reflect: true },

    /**
     * Indicates if this component (or its descendants) currently match the search/filter.
     * Always reflects to the DOM as "true" or "false".
     * @type {boolean}
     */
    matched: { type: Boolean, reflect: true },
  };

  constructor() {
    super();
    /** @private {boolean} Tracks if this component had any local matches during the current render */
    this._highlightMatchFound = false;

    /** @private {string} Last query received during this render cycle */
    this._currentQuery = '';

    this.localMatchCount = 0;
    this.descendantMatchCount = 0;
    this.matched = true; // Default: visible when no query is applied
  }

  /**
   * Wrapper for highlightMatches. Should always be used inside render().
   * Tracks local matches and stores the current query for use in updated().
   *
   * @param {string} text - The text to highlight.
   * @param {string} query - The search query string.
   * @param {object} [options] - Highlight options (normalizers, splitWords, etc.).
   * @returns {any} TemplateResult[] or HTML string.
   */
  highlight(text, query, options = {}) {
    this._currentQuery = query;
    const result = highlightMatches(text, query, options);

    const localCount = this._countMarksInResult(result);
    this.localMatchCount += localCount;

    if (localCount > 0) {
      this._highlightMatchFound = true;
    }

    return result;
  }

  /**
   * Getter to check if there was any local match in this render cycle.
   *
   * @returns {boolean}
   */
  get hasLocalMatch() {
    return this._highlightMatchFound;
  }

  /**
   * Lit lifecycle: Runs after each render.
   * Updates all reactive public properties based on current query and highlight state.
   */
  updated() {
    super.updated?.();

    const queryIsEmpty = !this._currentQuery?.trim();

    // Count descendant matches (number of child elements with matched="true")
    this.descendantMatchCount = this._countDescendantMatches();

    const shouldBeMatched =
      queryIsEmpty ||
      this.hasLocalMatch ||
      this.descendantMatchCount > 0;

    this.matched = shouldBeMatched;

    // Reset counters for next render cycle
    this._highlightMatchFound = false;
    this.localMatchCount = 0;
  }

  /**
   * Counts the number of <mark> tags in a highlight result.
   *
   * @private
   * @param {any} result - The result from highlightMatches().
   * @returns {number}
   */
  _countMarksInResult(result) {
    if (Array.isArray(result)) {
      return result.reduce((total, part) => {
        const combined = part.strings?.join('') ?? '';
        return total + (combined.split('<mark').length - 1);
      }, 0);
    }
    if (typeof result === 'string') {
      return (result.split('<mark').length - 1) || 0;
    }
    return 0;
  }

  /**
   * Counts the number of direct or indirect descendants with matched="true".
   *
   * @private
   * @returns {number}
   */
  _countDescendantMatches() {
    const root = this.renderRoot ?? this.shadowRoot ?? this;
    return root.querySelectorAll?.('[matched="true"]').length || 0;
  }
};