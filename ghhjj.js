import { LitElement, html, css } from 'lit'; import { styleMap } from 'lit/directives/style-map.js'; import { getFocusableElements, findFirstFocusable } from './getFocusableElements.js';

export class MyCollapseItem extends LitElement { static properties = { open: { type: Boolean, reflect: true }, allowOpenOnContainerClick: { type: Boolean }, title: { type: String }, subtitle: { type: String }, tags: { type: Array }, collapsedHeight: { type: String }, collapsedLines: { type: Number }, expandedMaxHeight: { type: String }, autoFocusFirst: { type: Boolean }, autoDisableIfNotNeeded: { type: Boolean }, };

constructor() { super(); this.open = false; this.allowOpenOnContainerClick = true; this.title = ''; this.subtitle = ''; this.tags = []; this.collapsedHeight = '60px'; this.collapsedLines = 3; this.expandedMaxHeight = '9999px'; this.autoFocusFirst = true; this.autoDisableIfNotNeeded = true;

this._isExpandable = true;
this._justOpened = false;
this._resizeObserver = null;

}

connectedCallback() { super.connectedCallback(); this._resizeObserver = new ResizeObserver(() => this.measureContent()); }

firstUpdated() { const contentEl = this.shadowRoot.querySelector('.content'); if (contentEl && this._resizeObserver) { this._resizeObserver.observe(contentEl); }

this.measureContent();

this.addEventListener('keydown', (e) => {
  if (this._justOpened && e.key === 'Tab' && !e.shiftKey) {
    e.preventDefault();
    this.focusFirstInteractive();
    this._justOpened = false;
  }
});

}

disconnectedCallback() { this._resizeObserver?.disconnect(); super.disconnectedCallback(); }

updated(changedProps) { if (changedProps.has('open')) { this.setFocusableState(!this.open); if (this.open) { if (this.autoFocusFirst) { this.focusFirstInteractive(); } else { this._justOpened = true; } } } }

measureContent() { const contentEl = this.shadowRoot.querySelector('.content'); if (!contentEl) return;

const actualHeight = contentEl.scrollHeight;
const maxHeight = parseInt(this.collapsedHeight);

this._isExpandable = !this.autoDisableIfNotNeeded ? true : actualHeight > maxHeight;
this.requestUpdate();

}

requestToggle() { if (!this._isExpandable) return; this.dispatchEvent(new CustomEvent('requestToggle', { detail: { index: Number(this.dataset.index) }, bubbles: true, composed: true, })); }

handleContainerClick() { if (!this.open && this.allowOpenOnContainerClick && this._isExpandable) { this.requestToggle(); } }

handleContainerKeydown(e) { if (!this.open && this.allowOpenOnContainerClick && this._isExpandable && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); this.requestToggle(); } }

focusFirstInteractive(customSelectors = []) { const slot = this.shadowRoot.querySelector('slot'); if (!slot) return;

const assigned = slot.assignedElements({ flatten: true });

for (const node of assigned) {
  const focusable = findFirstFocusable(node, customSelectors);
  if (focusable) {
    focusable.focus();
    break;
  }
}

}

setFocusableState(disabled, customSelectors = []) { const setAccessibilityState = (element, disable) => { if (disable) { element.setAttribute('tabindex', '-1'); element.setAttribute('aria-hidden', 'true'); } else { element.removeAttribute('tabindex'); element.removeAttribute('aria-hidden'); } };

const slot = this.shadowRoot.querySelector('slot');
if (!slot) return;

const assigned = slot.assignedElements({ flatten: true });

assigned.forEach(node => {
  const isNodeFocusable = typeof node.focus === 'function' &&
    (node.tabIndex >= 0 || customSelectors.includes(node.localName));

  if (isNodeFocusable) {
    setAccessibilityState(node, disabled);
  }

  const focusables = getFocusableElements(node, customSelectors);

  focusables.forEach(el => {
    setAccessibilityState(el, disabled);
  });
});

}

render() { const contentStyles = { maxHeight: this.open ? this.expandedMaxHeight : this.collapsedHeight, '--collapsed-lines': this.collapsedLines, };

const ariaLabel = this.open ? 'Informationen einklappen' : 'Mehr Informationen ausklappen';

return html`
  <div
    class="container"
    tabindex=${!this.open && this.allowOpenOnContainerClick && this._isExpandable ? '0' : '-1'}
    @click=${this.handleContainerClick}
    @keydown=${this.handleContainerKeydown}
  >
    <div class="header">
      <div class="title">${this.title}</div>
      <div class="subtitle">${this.subtitle}</div>
    </div>

    <div
      class="content ${this.open ? 'expanded' : 'collapsed'}"
      style=${styleMap(contentStyles)}
    >
      <slot></slot>
    </div>

    ${this.tags?.length
      ? html`<div class="footer">
          ${this.tags.map(tag => html`<span class="tag">${tag}</span>`)}
        </div>`
      : ''}

    ${this._isExpandable
      ? html`<button
          aria-label=${ariaLabel}
          aria-expanded=${this.open ? 'true' : 'false'}
          tabindex=${this.open ? '0' : '-1'}
          @click=${(e) => { e.stopPropagation(); this.requestToggle(); }}
        >
          ${this.open ? '🔽' : '▶️'}
        </button>`
      : ''}

  </div>
`;

}

static styles = css` :host { display: block; border: 1px solid #ccc; border-radius: 4px; margin-bottom: 8px; overflow: hidden; position: relative; }

.container {
  position: relative;
  padding: 12px 40px 12px 12px;
  background: #fff;
  cursor: pointer;
  outline: none;
}

.header {
  margin-bottom: 8px;
}

.title {
  font-weight: bold;
  font-size: 16px;
}

.subtitle {
  font-size: 12px;
  color: #666;
}

.content {
  overflow: hidden;
  transition: max-height 0.3s ease;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: var(--collapsed-lines, 3);
}

.footer {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  background: #f0f0f0;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 11px;
}

button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 16px;
}

`; }

customElements.define('my-collapse-item', MyCollapseItem);

