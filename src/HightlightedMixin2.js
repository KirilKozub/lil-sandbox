/**
 * Mixin that adds text highlighting support and match tracking to Lit components.
 *
 * Features:
 * - Provides reactive `match`, `localMatchCount`, and `descendantMatchCount` properties.
 * - Automatically updates match status after each update cycle.
 * - Supports nested components using the same mixin (descendant matches affect parent status).
 *
 * Usage example:
 * ```js
 * class MyComponent extends HighlightableMixin(LitElement) { ... }
 * ```
 */

import { LitElement } from 'lit';
import { highlightMatches } from './highlightMatches.js';

/**
 * @template {typeof LitElement} T
 * @param {T} Base
 * @returns {T}
 */
export const HighlightableMixin = (Base) => class extends Base {
  /** @type {boolean} Indicates if this component or its descendants contain matches */
  static properties = {
    match: { type: Boolean, reflect: true },
    localMatchCount: { type: Number, reflect: true },
    descendantMatchCount: { type: Number, reflect: true },
  };

  constructor() {
    super();
    /** @private @type {string} */
    this._currentQuery = '';

    /** @type {boolean} */
    this.match = true;

    /** @type {number} */
    this.localMatchCount = 0;

    /** @type {number} */
    this.descendantMatchCount = 0;

    /** @private @type {boolean} Used for internal match tracking during render */
    this._highlightMatchFound = false;
  }

  /**
   * Applies highlighting to a given text based on the current query.
   *
   * @param {string} text
   * @param {object} [options]
   * @returns {import('lit').TemplateResult[]}
   */
  highlight(text, options = {}) {
    const query = this._currentQuery;
    const result = highlightMatches(text, query, { ...options, output: 'template' });

    if (Array.isArray(result)) {
      result.forEach(fragment => {
        if (fragment.strings && fragment.strings.some(str => str.includes('<mark>'))) {
          this._highlightMatchFound = true;
          this.localMatchCount++;
        }
      });
    }

    return result;
  }

  /**
   * Sets the active search query for this component.
   *
   * @param {string} query
   */
  setHighlightQuery(query) {
    this._currentQuery = query;
    this.requestUpdate();
  }

  /**
   * Called before each update. Calculates match state safely (Lit allows property changes here).
   *
   * @param {Map<string | number | symbol, unknown>} changedProps
   */
  willUpdate(changedProps) {
    super.willUpdate?.(changedProps);

    const queryIsEmpty = !this._currentQuery?.trim();
    const descendantCount = this._countDescendantMatches();

    const shouldBeMatched =
      queryIsEmpty ||
      this.hasLocalMatch ||
      descendantCount > 0;

    this.descendantMatchCount = descendantCount;
    this.match = shouldBeMatched;
    this.localMatchCount = 0;
    this._highlightMatchFound = false;
  }

  /**
   * Checks if this component has any local matches (from last render).
   * @returns {boolean}
   */
  get hasLocalMatch() {
    return this._highlightMatchFound;
  }

  /**
   * Counts total descendant elements with `match="true"`.
   * Used for nested highlightable components.
   *
   * @private
   * @returns {number}
   */
  _countDescendantMatches() {
    return this.renderRoot.querySelectorAll('[match="true"]').length;
  }
};