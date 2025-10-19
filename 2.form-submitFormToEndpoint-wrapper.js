/**
 * @file HandoffFormInvoker.js
 * @description
 * <handoff-form-invoker> – a thin Lit UI wrapper around submitFormToEndpoint().
 * It renders a CTA (slot "invoker"), optional loader/error slots, and performs a
 * secure handoff via a real HTML <form> navigation (POST/GET) to external endpoints.
 *
 * Key features:
 * - Opens in current tab, a new tab, or a named/reusable tab (best for SSO/account switch).
 * - Works inside Shadow DOM; the temporary <form> is attached to this.shadowRoot when available.
 * - Defensive defaults (novalidate, autocomplete="off", referrerpolicy="no-referrer").
 * - Optional rel attribute; when opening a new tab and rel is not provided, helper enforces "noopener noreferrer".
 * - GET can serialize fields directly into the URL (serializeGetInUrl) or as hidden inputs.
 * - Lifecycle events: before-submit, after-submit, error.
 *
 * Slots:
 *  - "invoker": CTA content that triggers submission (default: simple button)
 *  - "loader" : content shown during "loading" state
 *  - "error"  : content shown if an error occurs
 *
 * Usage example:
 *  <handoff-form-invoker
 *    action="https://partner.example/entry"
 *    open-in-new-tab
 *    reuse-tab
 *    tab-name="handoff_tab"
 *    focus-new-tab
 *    serialize-get-in-url
 *  >
 *    <button slot="invoker">Continue</button>
 *    <span slot="loader">Processing…</span>
 *    <div slot="error">Something went wrong</div>
 *  </handoff-form-invoker>
 */

import { LitElement, html, css } from 'lit';
import { submitFormToEndpoint } from './submitFormToEndpoint.js';

export class HandoffFormInvoker extends LitElement {
  static properties = {
    /** Endpoint URL for the form submission. */
    action: { type: String },

    /** HTTP method. */
    method: { type: String }, // 'post' | 'get'

    /** Hidden fields array: [{ name: string, value: any }, ...] */
    fields: { type: Array },

    // --- Targeting / tabs ---
    /** Open result in a new tab/window (target=_blank or named). */
    openInNewTab: { type: Boolean, attribute: 'open-in-new-tab' },

    /** Reuse a named tab between submissions. */
    reuseTab: { type: Boolean, attribute: 'reuse-tab' },

    /** The named browsing context to reuse (e.g., "handoff_tab"). */
    tabName: { type: String, attribute: 'tab-name' },

    /**
     * Pre-open about:blank in a user gesture to mitigate popup blockers.
     * Only relevant when openInNewTab+reuseTab are true.
     */
    preOpen: { type: Boolean, attribute: 'pre-open' },

    /** Try to focus the named tab after submit (browsers may ignore). */
    focusNewTab: { type: Boolean, attribute: 'focus-new-tab' },

    // --- Form attributes ---
    /** Form enctype. */
    enctype: { type: String },

    /** Form charset. */
    acceptCharset: { type: String, attribute: 'accept-charset' },

    // --- Defensive flags (customizable) ---
    /** Skip built-in HTML5 validation. */
    novalidate: { type: Boolean, attribute: 'novalidate' },

    /** Form-level autocomplete hint. */
    autocomplete: { type: String, attribute: 'autocomplete' },

    /** Referrer policy (best-effort). */
    referrerPolicy: { type: String, attribute: 'referrerpolicy' },

    /**
     * rel attribute for the form. If empty and opening a new tab,
     * the helper auto-enforces "noopener noreferrer".
     */
    rel: { type: String },

    // --- GET behavior ---
    /**
     * For GET: serialize fields directly into the URL rather than hidden inputs.
     * Both are valid; this just gives you explicit control over the final URL.
     */
    serializeGetInUrl: { type: Boolean, attribute: 'serialize-get-in-url' },

    // --- UI state ---
    loading: { type: Boolean, state: true },
    errorText: { type: String, state: true },
  };

  static styles = css`
    :host { display: inline-block; }
    .hidden { display: none; }
    .err { color: #c01818; font: 12px/1.4 system-ui; margin-top: 6px; }
    .btn { padding: .5rem .9rem; border-radius: .5rem; border: 1px solid #ccc; background: #f7f7f7; cursor: pointer; }
    .btn:hover { background: #f0f0f0; }
    .loader { font: 12px system-ui; opacity: .8; }
  `;

  constructor() {
    super();
    // Required
    this.action = '';
    this.method = 'post';
    this.fields = [];

    // Target / tabs
    this.openInNewTab = false;
    this.reuseTab = false;
    this.tabName = '';
    this.preOpen = true;
    this.focusNewTab = true;

    // Form attrs
    this.enctype = 'application/x-www-form-urlencoded';
    this.acceptCharset = 'utf-8';

    // Defensive defaults
    this.novalidate = true;
    this.autocomplete = 'off';
    this.referrerPolicy = 'no-referrer';
    this.rel = ''; // helper will apply "noopener noreferrer" when opening new tab if empty

    // GET behavior
    this.serializeGetInUrl = false;

    // UI
    this.loading = false;
    this.errorText = '';

    /** @type {Window|null} */
    this._tabRef = null;
    /** @type {string} */
    this._stableTabName = '';
    /** @type {boolean} */
    this._listenersAttached = false;
  }

  // ---------------- Public API ----------------

  /** Programmatically trigger submission (same as clicking invoker). */
  async trigger() { return this._onInvoke(); }

  /** Is the reusable tab alive (not closed)? */
  isTabAlive() { return !!(this._tabRef && !this._tabRef.closed); }

  /** Close the reusable tab if it's open. */
  closeTab() {
    if (this._tabRef && !this._tabRef.closed) { try { this._tabRef.close(); } catch {} }
    this._tabRef = null;
  }

  // ---------------- Render ----------------

  render() {
    return html`
      <span class="${this.loading ? 'hidden' : ''}">
        <slot name="invoker" @click=${this._onInvoke}>
          <button class="btn" @click=${this._onInvoke}>Continue</button>
        </slot>
      </span>

      <span class="${this.loading ? '' : 'hidden'}">
        <slot name="loader"><span class="loader">Processing…</span></slot>
      </span>

      ${this.errorText
        ? html`<slot name="error"><div class="err">⚠️ ${this.errorText}</div></slot>`
        : null}
    `;
  }

  // ---------------- Internals ----------------

  /** Resolve a stable tab name for reuse. */
  _resolveTabName() {
    const name = (this.tabName || '').trim();
    return name || 'handoff_tab';
  }

  /** Attach unload listeners to clear references when the tab is closed/reloaded. */
  _attachUnloadListeners(win) {
    if (!win || this._listenersAttached) return;
    try {
      win.addEventListener('beforeunload', () => { this._tabRef = null; }, { once: false });
      win.addEventListener('unload', () => { this._tabRef = null; }, { once: false });
      this._listenersAttached = true;
    } catch {}
  }

  /**
   * Pre-open about:blank in a named tab during the user gesture.
   * This improves the chance that the later POST navigation is allowed and focusable.
   */
  _preOpenIfNeeded() {
    if (!(this.openInNewTab && this.reuseTab && this.preOpen)) return;
    const name = this._resolveTabName();
    this._stableTabName = name;
    try {
      const w = window.open('about:blank', name, 'noopener,noreferrer');
      if (w) { this._tabRef = w; this._attachUnloadListeners(w); }
    } catch {}
  }

  /**
   * Invoker click handler and programmatic trigger.
   * Emits:
   *  - before-submit(detail: { form, fields })
   *  - after-submit(detail: { form })
   *  - error(detail: { error })
   */
  async _onInvoke(ev) {
    if (ev?.type === 'click') ev.preventDefault?.();
    if (this.loading) return;

    if (!this.action) { this._fail('Missing "action"'); return; }
    if (!Array.isArray(this.fields) || this.fields.length === 0) { this._fail('No fields provided'); return; }

    this.errorText = '';
    this.loading = true;

    // Pre-open named tab (if configured)
    this._preOpenIfNeeded();

    const willOpenNewTab = !!this.openInNewTab;
    const reuse = !!this.reuseTab;
    const effectiveName = willOpenNewTab && reuse
      ? (this._stableTabName || this._resolveTabName())
      : '';

    try {
      submitFormToEndpoint({
        action: this.action,
        method: (this.method || 'post').toLowerCase() === 'get' ? 'get' : 'post',
        fields: this.fields,

        // IMPORTANT: pass ShadowRoot when available, otherwise host element.
        context: this.shadowRoot ?? this,

        openInNewTab: willOpenNewTab,
        newTabName: effectiveName,
        focusNewTab: this.focusNewTab,

        enctype: this.enctype,
        acceptCharset: this.acceptCharset,

        // Defensive flags
        novalidate: this.novalidate,
        autocomplete: this.autocomplete,
        referrerPolicy: this.referrerPolicy,
        rel: this.rel,

        // GET behavior
        serializeGetInUrl: this.serializeGetInUrl,

        // Lifecycle hooks → re-emitted as DOM CustomEvents
        onBeforeSubmit: ({ form, fields }) => {
          this.dispatchEvent(new CustomEvent('before-submit', {
            detail: { form, fields }, bubbles: true, composed: true,
          }));
        },
        onAfterSubmit: ({ form }) => {
          this.dispatchEvent(new CustomEvent('after-submit', {
            detail: { form }, bubbles: true, composed: true,
          }));
        },
        onError: (error) => {
          this.dispatchEvent(new CustomEvent('error', {
            detail: { error }, bubbles: true, composed: true,
          }));
        },
      });

      // Focus: only for NAMED tabs (reuse)
      if (willOpenNewTab && this.focusNewTab && effectiveName) {
        try {
          if (this._tabRef && !this._tabRef.closed) {
            this._tabRef.focus?.();
          } else {
            const w = window.open('', effectiveName);
            if (w) { this._tabRef = w; this._attachUnloadListeners(w); w.focus?.(); }
          }
        } catch {}
      }
    } catch (err) {
      // If preOpen created a tab, close it on error.
      if (this._tabRef && !this._tabRef.closed && this.preOpen) {
        try { this._tabRef.close(); } catch {}
      }
      this._tabRef = null;
      this._listenersAttached = false;

      this._fail(err?.message || 'Submit failed');
      return;
    } finally {
      this.loading = false;
    }
  }

  /** Emit error event and show default inline message if no slot provided. */
  _fail(msg) {
    this.errorText = String(msg || 'Unexpected error');
    this.dispatchEvent(new CustomEvent('error', {
      detail: { error: new Error(this.errorText) }, bubbles: true, composed: true,
    }));
  }
}

customElements.define('handoff-form-invoker', HandoffFormInvoker);
```0