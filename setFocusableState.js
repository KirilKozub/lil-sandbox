import { LitElement, html, css } from 'lit'; import { getFocusableElements, findFirstFocusable } from './getFocusableElements.js';

export class MyCollapseItem extends LitElement { static properties = { open: { type: Boolean, reflect: true }, initialOpen: { type: Boolean }, allowOpenOnContainerClick: { type: Boolean }, title: { type: String }, subtitle: { type: String }, tags: { type: Array }, };

constructor() { super(); this.open = false; this.initialOpen = false; this.allowOpenOnContainerClick = true; this.title = ''; this.subtitle = ''; this.tags = []; }

connectedCallback() { super.connectedCallback(); this.open = this.initialOpen; }

toggle() { this.open = !this.open; this.setFocusableState(!this.open);

this.dispatchEvent(new CustomEvent('toggle', {
  detail: { open: this.open, index: Number(this.dataset.index) },
  bubbles: true,
  composed: true,
}));

if (this.open) {
  this.updateComplete.then(() => this.focusFirstInteractive());
}

}

handleContainerClick() { if (!this.open && this.allowOpenOnContainerClick) { this.toggle(); } }

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

setFocusableState(disabled, customSelectors = []) { const slot = this.shadowRoot.querySelector('slot'); if (!slot) return;

const assigned = slot.assignedElements({ flatten: true });

assigned.forEach(node => {
  const isNodeFocusable = typeof node.focus === 'function' &&
    (node.tabIndex >= 0 || customSelectors.includes(node.localName));

  if (isNodeFocusable) {
    if (disabled) {
      node.setAttribute('tabindex', '-1');
      node.setAttribute('aria-hidden', 'true');
    } else {
      node.removeAttribute('tabindex');
      node.removeAttribute('aria-hidden');
    }
  }

  const focusables = getFocusableElements(node, customSelectors);
  focusables.forEach(el => {
    if (disabled) {
      el.setAttribute('tabindex', '-1');
      el.setAttribute('aria-hidden', 'true');
    } else {
      el.removeAttribute('tabindex');
      el.removeAttribute('aria-hidden');
    }
  });
});

}

render() { return html` <div class="container" @click=${this.handleContainerClick}> <div class="header"> <div class="title">${this.title}</div> <div class="subtitle">${this.subtitle}</div> </div>

<div class="content ${this.open ? 'expanded' : 'collapsed'}">
      <slot></slot>
    </div>

    ${this.tags?.length
      ? html`<div class="footer">
          ${this.tags.map(tag => html`<span class="tag">${tag}</span>`)}
        </div>`
      : ''}

    <button @click=${(e) => { e.stopPropagation(); this.toggle(); }}>
      ${this.open ? '🔽' : '▶️'}
    </button>
  </div>
`;

}

static styles = css` :host { display: block; border: 1px solid #ccc; border-radius: 4px; margin-bottom: 8px; overflow: hidden; position: relative; }

.container {
  position: relative;
  padding: 12px 40px 12px 12px;
  background: #fff;
  cursor: pointer;
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

.content.collapsed {
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.content.expanded {
  max-height: none;
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

