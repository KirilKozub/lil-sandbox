import { LitElement, html, css } from 'lit';
import { getFocusableElements } from './getFocusableElements.js';

/**
 * @element my-collapse-item
 * @property {boolean} open - Whether the item is open
 * @property {boolean} toggleOnClick - Deprecated. Use allowOpenOnContainerClick instead.
 * @property {boolean} initialOpen - Initial open state
 * @property {boolean} allowOpenOnContainerClick - Allows opening on container click (but not closing)
 * @fires toggle - detail: { open, index }
 * @fires closedByList - detail: { index }
 */
export class MyCollapseItem extends LitElement {
  static properties = {
    open: { type: Boolean, reflect: true },
    toggleOnClick: { type: Boolean }, // Для обратной совместимости, можно удалить
    initialOpen: { type: Boolean },
    allowOpenOnContainerClick: { type: Boolean },
  };

  constructor() {
    super();
    this.open = false;
    this.toggleOnClick = false;
    this.initialOpen = false;
    this.allowOpenOnContainerClick = true;
  }

  connectedCallback() {
    super.connectedCallback();
    this.open = this.initialOpen;
  }

  toggle() {
    this.open = !this.open;
    this.dispatchEvent(
      new CustomEvent('toggle', {
        detail: { open: this.open, index: Number(this.dataset.index) },
        bubbles: true,
        composed: true,
      })
    );

    if (this.open) {
      this.updateComplete.then(() => {
        this.focusFirstInteractive();
      });
    }
  }

  closeByList() {
    if (this.open) {
      this.open = false;
      this.dispatchEvent(
        new CustomEvent('closedByList', {
          detail: { index: Number(this.dataset.index) },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  handleKeydown(e) {
    if ((e.key === 'Enter' || e.key === ' ') && !this.open && this.allowOpenOnContainerClick) {
      e.preventDefault();
      this.toggle();
    }
  }

  handleContainerClick() {
    if (!this.open && this.allowOpenOnContainerClick) {
      this.toggle();
    }
  }

  focusFirstInteractive() {
    const container = this.renderRoot.querySelector('.details');
    if (!container) return;

    const focusable = getFocusableElements(container);
    if (focusable.length > 0) {
      focusable[0].focus();
    }
  }

  render() {
    const detailsId = `details-${this.dataset.index}`;

    return html`
      <div
        class="container"
        role="button"
        tabindex="0"
        aria-expanded="${this.open}"
        aria-controls="${detailsId}"
        @click=${this.handleContainerClick}
        @keydown=${this.handleKeydown}
      >
        ${this.open
          ? html`
              <div
                id="${detailsId}"
                role="region"
                aria-hidden="${!this.open}"
                class="details"
              >
                <slot name="details"></slot>
              </div>
            `
          : html`
              <div class="summary">
                <slot name="summary"></slot>
              </div>
            `}

        <button
          @click=${(e) => {
            e.stopPropagation();
            this.toggle();
          }}
          aria-label="Toggle details"
        >
          ${this.open ? '🔽' : '▶️'}
        </button>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      border: 1px solid #ccc;
      border-radius: 4px;
      margin-bottom: 8px;
      overflow: hidden;
      position: relative;
    }

    .details {
      animation: fadeIn 0.3s ease-in-out;
      padding: 8px;
      background-color: #f9f9f9;
    }

    .summary {
      padding: 8px;
      background-color: #eee;
      cursor: pointer;
    }

    button {
      position: absolute;
      top: 8px;
      right: 8px;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `;
}

customElements.define('my-collapse-item', MyCollapseItem);