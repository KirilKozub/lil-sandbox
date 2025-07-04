import { LitElement, html, css } from 'lit';

export class MyCollapseList extends LitElement {
  static properties = {
    singleOpen: { type: Boolean },
    header: { type: String },
    footer: { type: String },
  };

  constructor() {
    super();
    this.singleOpen = false;
    this.header = '';
    this.footer = '';
  }

  get items() {
    const list = Array.from(this.querySelectorAll('my-collapse-item'));
    list.forEach((item, index) => {
      item.dataset.index = index;
    });
    return list;
  }

  firstUpdated() {
    this.addEventListener('toggle', (e) => {
      const { index, open } = e.detail;
      if (this.singleOpen && open) {
        this.items.forEach((item, i) => {
          if (i !== index && item.open) item.open = false;
        });
      }
    });
  }

  render() {
    return html`
      <div class="list-container">
        ${this.header ? html`<div class="list-header">${this.header}</div>` : ''}

        <div role="list" class="list-body">
          <slot></slot>
        </div>

        ${this.footer ? html`<div class="list-footer">${this.footer}</div>` : ''}
      </div>
    `;
  }

  static styles = css`
    .list-container {
      border: 1px solid #ddd;
      border-radius: 6px;
      overflow: hidden;
      background: #fff;
    }

    .list-header {
      padding: 12px;
      background: #f5f5f5;
      font-weight: bold;
      border-bottom: 1px solid #ddd;
    }

    .list-body {
      padding: 8px;
    }

    .list-footer {
      padding: 12px;
      background: #f5f5f5;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #666;
    }
  `;
}

customElements.define('my-collapse-list', MyCollapseList);