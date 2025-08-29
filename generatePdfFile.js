import { LitElement, html, css } from 'lit';

/**
 * Decode base64 (including URL-safe) to Uint8Array.
 * @param {string} b64
 * @returns {Uint8Array}
 */
function decodeBase64ToBytes(b64) {
  if (!b64) throw new Error('Base64 string is empty');
  const normalized = b64.replace(/[\r\n\s]/g, '').replace(/-/g, '+').replace(/_/g, '/');
  const pad = (4 - (normalized.length % 4)) % 4;
  const binary = atob(normalized + '='.repeat(pad));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Create a Blob URL for a PDF from base64.
 * @param {string} base64
 * @returns {string}
 */
function generatePdfUrl(base64) {
  const bytes = decodeBase64ToBytes(base64);
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const blob = new Blob([buffer], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}

export class PdfTwoStepLoader extends LitElement {
  static properties = {
    /** External async method for fetching PDF (must return { filename, data }) */
    apiCall: { type: Function },
    /** File name from the response */
    filename: { type: String },
    /** Blob URL for generated PDF */
    pdfUrl: { type: String, state: true },
    /** Base64 data before URL generation */
    _base64: { type: String, state: true },
    loading: { type: Boolean, state: true },
    error: { type: String, state: true },
  };

  static styles = css`
    .row {
      display: flex;
      gap: .75rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .muted {
      opacity: .7;
    }
    button[disabled] {
      opacity: .5;
      pointer-events: none;
    }
  `;

  constructor() {
    super();
    this.apiCall = null;
    this.filename = '';
    this.pdfUrl = '';
    this._base64 = '';
    this.loading = false;
    this.error = '';
  }

  disconnectedCallback() {
    if (this.pdfUrl) URL.revokeObjectURL(this.pdfUrl);
    super.disconnectedCallback();
  }

  /**
   * STEP 1: Call the external async method to get PDF details
   */
  async requestPdf() {
    if (typeof this.apiCall !== 'function') {
      this.error = 'No API method provided';
      return;
    }

    this.loading = true;
    this.error = '';
    this._base64 = '';
    this.filename = '';
    if (this.pdfUrl) {
      URL.revokeObjectURL(this.pdfUrl);
      this.pdfUrl = '';
    }

    try {
      const { filename, data } = await this.apiCall();
      if (!data) throw new Error('Response is missing "data" field');

      this._base64 = data;
      this.filename = filename?.trim() || 'document.pdf';
    } catch (err) {
      this.error = err instanceof Error ? err.message : String(err);
    } finally {
      this.loading = false;
    }
  }

  /**
   * STEP 2: Generate blob URL after we have base64 data
   */
  generateLink() {
    if (!this._base64) return;
    if (this.pdfUrl) URL.revokeObjectURL(this.pdfUrl);
    this.pdfUrl = generatePdfUrl(this._base64);
  }

  /** Open PDF in new tab */
  openInTab() {
    if (!this.pdfUrl) return;
    window.open(this.pdfUrl, '_blank', 'noopener');
  }

  /** Download PDF with current filename */
  download() {
    if (!this.pdfUrl) return;
    const link = document.createElement('a');
    link.href = this.pdfUrl;
    link.download = this.filename || 'document.pdf';
    link.click();
  }

  render() {
    return html`
      <div class="row">
        <button @click=${() => this.requestPdf()} ?disabled=${this.loading}>
          Request PDF
        </button>
        <button @click=${() => this.generateLink()} ?disabled=${this.loading || !this._base64}>
          Generate link
        </button>
        ${this.loading ? html`<span class="muted">Loading…</span>` : null}
        ${this.error ? html`<span class="muted">Error: ${this.error}</span>` : null}
      </div>

      ${this._base64 && !this.pdfUrl
        ? html`<div class="muted">Response received: ${this.filename}. Click "Generate link".</div>`
        : null}

      ${this.pdfUrl
        ? html`
            <div class="row">
              <span>File: ${this.filename}</span>
              <a href=${this.pdfUrl} target="_blank" rel="noopener">Open in new tab</a>
              <a href=${this.pdfUrl} download=${this.filename}>Download</a>
              <button @click=${() => this.openInTab()}>Open (JS)</button>
              <button @click=${() => this.download()}>Download (JS)</button>
            </div>
          `
        : html`<div class="muted">No link yet.</div>`
      }
    `;
  }
}

customElements.define('pdf-two-step-loader', PdfTwoStepLoader);