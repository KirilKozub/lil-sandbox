// highlight-target.js

import { html, css, LitElement } from 'lit';
import { mixinQuerySync } from './query-manager.js';

/**
 * HighlightTarget component
 * Reacts to query changes and highlights matching text
 */
class HighlightTarget extends mixinQuerySync(LitElement, {
  type: 'target',
  key: null, // будет задан извне через атрибут key
}) {
  static properties = {
    key: { type: String, reflect: true },
  };

  static styles = css`
    :host {
      display: block;
      padding: 0.5rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      margin: 0.5rem 0;
    }

    mark {
      background-color: yellow;
      font-weight: bold;
    }

    :host([has-any-match]) {
      border-color: green;
    }

    :host([has-query]):before {
      content: '🔍 ';
    }
  `;

  render() {
    return html`<slot></slot>`;
  }
}

customElements.define('highlight-target', HighlightTarget);
