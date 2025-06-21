import { html, LitElement } from 'lit';
import { HighlightSourceMixin } from './highlight-source.mixin.js';

/**
 * @typedef {import('lit').PropertyValues} PropertyValues
 */

export class SearchInput extends HighlightSourceMixin(LitElement) {
  static properties = {
    highlightKey: { type: String },
    query: { type: String },
    delay: { type: Number },
  };

  constructor() {
    super();
    this.highlightKey = 'default';
    this.query = '';
    this.delay = 300;
    this._debounceTimer = null;

    // настройки по умолчанию для highlight
    this.normalizer = 'default';
    this.matchWords = true;
    this.useRegex = false;
    this.preserveHtml = false;
  }

  /**
   * @param {InputEvent} e
   */
  _onInput(e) {
    const value = e.target.value;
    clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() => {
      this.query = value;
    }, this.delay);
  }

  _clear() {
    this.query = '';
    this.shadowRoot.querySelector('input')?.focus();
  }

  render() {
    return html`
      <input
        type="text"
        placeholder="Search…"
        @input=${this._onInput}
        .value=${this.query}
        aria-label="Suchbegriff"
      />
      ${this.query
        ? html`<button @click=${this._clear} aria-label="Löschen">✕</button>`
        : null}
    `;
  }
}

customElements.define('search-input', SearchInput);