// query-input.js

import { html, css, LitElement } from 'lit';
import { mixinQuerySync } from './query-manager.js';

/**
 * <query-input> component
 * Acts as the source of query input and sets the query into the shared store
 */
class QueryInput extends mixinQuerySync(LitElement, {
  type: 'source',
  key: null,
  highlightOptions: {}, // передаётся через проп `options`
}) {
  static properties = {
    key: { type: String, reflect: true },
    options: { type: Object }, // highlightOptions
  };

  constructor() {
    super();
    this.options = {};
  }

  static styles = css`
    :host {
      display: block;
      margin: 1rem 0;
    }

    input {
      width: 100%;
      font-size: 1rem;
      padding: 0.5rem;
      box-sizing: border-box;
    }
  `;

  render() {
    return html`
      <input
        type="text"
        @input=${this._onInput}
        placeholder="Type to search..."
        aria-label="Search"
      />
    `;
  }

  _onInput(e) {
    const value = e.target.value;
    this.updateQuery(value); // метод из mixin: вызывает setQuery()
  }
}

customElements.define('query-input', QueryInput);
