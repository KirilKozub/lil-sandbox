import { LitElement, html, css } from 'lit';

export class SmartImage extends LitElement {
  static get properties() {
    return {
      /** @type {string} */
      src: { type: String },
      /** @type {string} */
      _visibleSrc: { state: true },
      /** @type {boolean} */
      _loading: { state: true },
    };
  }

  constructor() {
    super();
    this.src = '';
    this._visibleSrc = '';
    this._loading = false;
  }

  static get styles() {
    return css`
      :host {
        display: inline-block;
        position: relative;
      }

      img {
        display: block;
        width: 100%;
        height: auto;
      }

      .loader {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        border: 3px solid #ddd;
        border-top: 3px solid #555;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from {
          transform: translate(-50%, -50%) rotate(0deg);
        }
        to {
          transform: translate(-50%, -50%) rotate(360deg);
        }
      }
    `;
  }

  /**
   * @param {Map<string, unknown>} changedProps
   */
  willUpdate(changedProps) {
    if (changedProps.has('src')) {
      this._preloadAndShow(this.src);
    }
  }

  /**
   * Preload image and update visible src only after load
   * @param {string} url
   * @returns {Promise<void>}
   */
  async _preloadAndShow(url) {
    if (!url) {
      this._visibleSrc = '';
      return;
    }

    this._loading = true;

    try {
      await preloadImage(url);
      this._visibleSrc = url;
    } catch (err) {
      console.warn('Image load failed:', err);
    } finally {
      this._loading = false;
    }
  }

  render() {
    return html`
      ${this._visibleSrc
        ? html`<img src=${this._visibleSrc} alt="Image" />`
        : null}
      ${this._loading ? html`<span class="loader"></span>` : null}
    `;
  }
}

/**
 * @param {string} url
 * @returns {Promise<void>}
 */
function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}

customElements.define('smart-image', SmartImage);