import { LitElement, html } from 'lit';

export class SmartImage extends LitElement {
  static get properties() {
    return {
      /** @type {string} */
      src: { type: String },
      /** @type {string} */
      _visibleSrc: { state: true },
    };
  }

  constructor() {
    super();
    this.src = '';
    this._visibleSrc = '';
  }

  /**
   * Lit lifecycle: reacts to prop changes
   * @param {Map<string, unknown>} changedProps
   */
  willUpdate(changedProps) {
    if (changedProps.has('src')) {
      // preload new image first
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

    try {
      await preloadImage(url);
      // only now show it
      this._visibleSrc = url;
    } catch (err) {
      // optional: keep old image or clear
      // this._visibleSrc = '';
      // console.error('Image load failed', err);
    }
  }

  render() {
    return html`
      <img
        src=${this._visibleSrc || ''}
        alt=""
      />
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

    // start loading
    img.src = url;
  });
}

customElements.define('smart-image', SmartImage);