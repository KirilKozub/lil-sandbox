// story-slider.js
import { LitElement, html, css, nothing } from 'lit';

/** Thresholds/animation */
const SWIPE_TAP_PX = 10;      // до этого считаем как «тап»
const SNAP_PX = 160;          // минимальный порог прилипаний в пикселях
const SNAP_RATIO = 0.25;      // либо 25% ширины — берём максимум из двух
const TRACK_ANIM_MS = 260;    // длительность анимации трека (ms)

/**
 * @typedef {Object} StoryCta
 * @property {string} label
 * @property {string} [href]
 * @property {boolean} [newTab]
 */

/**
 * @typedef {Object} StorySlide
 * @property {number} [durationMs]
 * @property {string} [bgColor]
 * @property {string} [bgImage]
 * @property {string} [bgPosition]
 * @property {string} [bgSize]
 * @property {number} [overlay]  // 0..1
 * @property {string} [title]
 * @property {string} [text]
 * @property {string} [subtext]
 * @property {string} [iconUrl]
 * @property {StoryCta} [cta]
 * @property {Record<string, any>} [data]
 */

/**
 * Instagram-like stories slider rendered from data
 * with per-slide progress bars, autoplay, swipe + drag-snap and side arrows.
 */
export class StorySlider extends LitElement {
  static get properties() {
    return {
      /** @type {StorySlide[]} */
      items: { type: Array },
      /** @type {number} default duration in ms */
      durationMs: { type: Number, attribute: 'duration-ms' },
      /** @type {number} active slide index (0-based) */
      index: { type: Number, reflect: true },
      /** @type {boolean} auto-play slides */
      autoplay: { type: Boolean, reflect: true },
      /** @type {boolean} pause on hover/press */
      pauseOnHover: { type: Boolean, attribute: 'pause-on-hover', reflect: true },
      /** @type {boolean} show bottom Prev/Next */
      controls: { type: Boolean, reflect: true },
      /** @type {boolean} loop to first after last */
      loop: { type: Boolean, reflect: true },
      /** @type {string} theme token */
      theme: { type: String, reflect: true },
      /** @type {boolean} show side arrows */
      sideButtons: { type: Boolean, attribute: 'side-buttons', reflect: true },
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        position: relative;
        overflow: hidden;
        border-radius: 16px;
        background: #000;
        color: #fff;
        --story-padding: 20px;
        --story-title-size: 20px;
        --story-text-size: 16px;
        --story-subtext-size: 13px;
      }

      /* progress bars */
      .progress {
        position: absolute;
        inset: 8px 8px auto 8px;
        display: flex; gap: 6px;
        z-index: 6;
      }
      .bar {
        flex: 1 1 0;
        height: 3px;
        background: rgba(255,255,255,0.35);
        border-radius: 999px;
        overflow: hidden;
      }
      .fill {
        height: 100%;
        width: 0%;
        background: #fff;
        transform-origin: left center;
        transition: width 80ms linear;
      }

      /* viewport + track */
      .viewport {
        position: relative;
        width: 100%;
        min-height: 280px;
        display: grid;
        place-items: stretch;
        isolation: isolate;
        touch-action: pan-y;          /* вертикальный скролл — браузеру */
        -webkit-user-select: none;
        user-select: none;
      }
      .track {
        position: absolute;
        inset: 0;
        display: grid;
        grid-template-columns: 100% 100% 100%;
        will-change: transform;
        z-index: 1;
        transform: translate3d(-100%, 0, 0);
      }
      .track--anim {
        transition: transform var(--track-ms, 260ms) ease-out;
      }
      .pane {
        position: relative;
        overflow: hidden;
      }

      /* background + content */
      .bg {
        position: absolute;
        inset: 0;
        z-index: 0;
        background-color: var(--bg-color, #000);
        background-image: var(--bg-image, none);
        background-repeat: no-repeat;
        background-position: var(--bg-position, center);
        background-size: var(--bg-size, cover);
      }
      .bg::after {
        content: "";
        position: absolute; inset: 0;
        background: rgba(0,0,0,var(--bg-overlay, 0.35));
      }
      .content {
        position: relative;
        z-index: 2;
        display: grid;
        grid-template-rows: auto 1fr auto;
        padding: var(--story-padding);
        height: 100%;
        gap: 12px;
      }
      .head { display: flex; align-items: center; gap: 10px; }
      .icon { width: 42px; height: 42px; border-radius: 10px; background: rgba(255,255,255,0.15); display: grid; place-items: center; overflow: hidden; }
      .icon img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .title { font-size: var(--story-title-size); font-weight: 700; line-height: 1.2; text-shadow: 0 1px 2px rgba(0,0,0,0.4); }
      .body { display: grid; align-content: center; gap: 8px; text-shadow: 0 1px 2px rgba(0,0,0,0.35); }
      .text { font-size: var(--story-text-size); line-height: 1.45; }
      .subtext { font-size: var(--story-subtext-size); opacity: 0.8; }

      .footer { display: flex; justify-content: space-between; align-items: center; }
      .cta {
        background: rgba(0,0,0,0.45);
        color: #fff; border: 1px solid rgba(255,255,255,0.5);
        padding: 8px 12px; border-radius: 12px;
        text-decoration: none; font-weight: 600;
      }

      /* tap zones (поверх трека) */
      .nav {
        position: absolute; inset: 0;
        display: grid; grid-template-columns: 1fr 1fr;
        z-index: 5;
      }
      .tap { background: transparent; border: none; padding: 0; margin: 0; }

      /* bottom small buttons (optional) */
      .buttons {
        position: absolute; bottom: 8px; left: 8px; right: 8px;
        display: flex; justify-content: space-between; gap: 8px; z-index: 6;
      }
      .buttons button {
        background: rgba(0,0,0,0.4);
        color: #fff;
        border: 1px solid rgba(255,255,255,0.4);
        border-radius: 10px;
        padding: 6px 10px; cursor: pointer;
      }

      /* side arrows */
      .sideButtons { position: absolute; inset: 0; pointer-events: none; z-index: 7; }
      .sideButtons__btn {
        pointer-events: auto;
        position: absolute; top: 50%; transform: translateY(-50%);
        background: rgba(0,0,0,0.45);
        color: #fff; border: 1px solid rgba(255,255,255,0.5);
        border-radius: 50%; width: 42px; height: 42px;
        display: grid; place-items: center; cursor: pointer;
      }
      .sideButtons__btn--left { left: 8px; }
      .sideButtons__btn--right { right: 8px; }
      .sideButtons__icon { width: 20px; height: 20px; display: block; }

      /* light theme tweaks */
      :host([theme="light"]) { color: #111; background: #fff; }
      :host([theme="light"]) .bar { background: rgba(0,0,0,0.2); }
      :host([theme="light"]) .fill { background: #111; }
      :host([theme="light"]) .cta { background: rgba(255,255,255,0.7); color: #111; border-color: rgba(0,0,0,0.2); }
      :host([theme="light"]) .bg::after { background: rgba(255,255,255,var(--bg-overlay, 0.15)); }
      :host([theme="light"]) .sideButtons__btn { background: rgba(255,255,255,0.85); color: #111; border-color: rgba(0,0,0,0.2); }
    `;
  }

  constructor() {
    super();
    /** @type {StorySlide[]} */ this.items = [];
    this.durationMs = 5000;
    this.index = 0;
    this.autoplay = true;
    this.pauseOnHover = true;
    this.controls = true;
    this.loop = true;
    this.theme = 'dark';
    this.sideButtons = true;

    /** RAF/progress */
    /** @type {number|null} */ this._raf = null;
    /** @type {number} */ this._startedAt = 0;
    /** @type {number} */ this._accumulatedPause = 0;
    /** @type {number|null} */ this._pauseStartedAt = null;

    /** drag/track */
    /** @type {boolean} */ this._dragging = false;
    /** @type {number}  */ this._dragStartX = 0;
    /** @type {number}  */ this._dragDX = 0;
    /** @type {boolean} */ this._trackAnimating = false;
    /** @type {null|'next'|'prev'} */ this._pendingDir = null;

    this._onVisibility = this._onVisibility.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('visibilitychange', this._onVisibility);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('visibilitychange', this._onVisibility);
    this._stop();
  }
  firstUpdated() {
    if (this.autoplay) this._restartProgress();
  }
  updated(changed) {
    if (changed.has('autoplay') || changed.has('index') || changed.has('items') || changed.has('durationMs')) {
      if (this.autoplay) this._restartProgress(); else this._stop();
    }
  }

  /** @returns {number} */
  get _currentDuration() {
    const s = this.items[this.index];
    if (s && typeof s.durationMs === 'number' && s.durationMs > 0) return s.durationMs;
    return this.durationMs;
  }

  _restartProgress() {
    this._stop();
    this._startedAt = performance.now();
    this._accumulatedPause = 0;
    this._pauseStartedAt = null;
    this._raf = requestAnimationFrame((t) => this._tick(t));
  }
  _stop() { if (this._raf !== null) { cancelAnimationFrame(this._raf); this._raf = null; } }
  /** @param {number} now */
  _tick(now) {
    if (this._pauseStartedAt !== null) {
      this._raf = requestAnimationFrame((t) => this._tick(t));
      return;
    }
    const elapsed = now - this._startedAt - this._accumulatedPause;
    const pct = Math.max(0, Math.min(1, elapsed / this._currentDuration));
    this._progressPct = pct;
    this.requestUpdate();

    if (pct >= 1) {
      this.next();
      return;
    }
    this._raf = requestAnimationFrame((t) => this._tick(t));
  }

  pause() { if (this._pauseStartedAt === null) this._pauseStartedAt = performance.now(); }
  resume() {
    if (this._pauseStartedAt !== null) {
      const delta = performance.now() - this._pauseStartedAt;
      this._accumulatedPause += delta;
      this._pauseStartedAt = null;
    }
  }

  goTo(idx) {
    const n = this.items.length;
    if (n === 0) return;
    let target = idx;
    if (idx < 0) target = this.loop ? n - 1 : 0;
    if (idx >= n) target = this.loop ? 0 : n - 1;

    if (target === this.index) {
      if (this.autoplay) this._restartProgress();
      return;
    }
    this.index = target;
    this.dispatchEvent(new CustomEvent('slide-change', { detail: { index: this.index, slide: this.items[this.index] } }));
    if (this.autoplay) this._restartProgress();
  }
  next() { this.goTo(this.index + 1); }
  prev() { this.goTo(this.index - 1); }

  _onKeydown(e) {
    if (e.key === 'ArrowRight') this.next();
    else if (e.key === 'ArrowLeft') this.prev();
    else if (e.key === ' ' || e.key === 'Spacebar') { if (this._pauseStartedAt === null) this.pause(); else this.resume(); e.preventDefault(); }
  }
  _onVisibility() { if (document.hidden) this.pause(); else this.resume(); }
  _onMouseEnter() { if (this.pauseOnHover) this.pause(); }
  _onMouseLeave() { if (this.pauseOnHover) this.resume(); }

  /** Pointer-driven drag with snap */
  /** @param {PointerEvent} e */
  _onPointerDown(e) {
    this._dragging = true;
    this._dragStartX = e.clientX;
    this._dragDX = 0;
    this._trackAnimating = false;
    this._pendingDir = null;
    this.setPointerCapture(e.pointerId);
    this.pause();
  }
  /** @param {PointerEvent} e */
  _onPointerMove(e) {
    if (!this._dragging) return;
    const dx = e.clientX - this._dragStartX;

    // демпфер у краёв без loop
    const atLeftEdge = !this.loop && this.index === 0 && dx > 0;
    const atRightEdge = !this.loop && this.index === this.items.length - 1 && dx < 0;
    const damp = atLeftEdge || atRightEdge ? 0.35 : 1;

    this._dragDX = dx * damp;
    this.requestUpdate();
  }
  /** @param {PointerEvent} e */
  _onPointerUp(e) {
    if (!this._dragging) return;
    this.releasePointerCapture(e.pointerId);
    this._dragging = false;

    const width = this.getBoundingClientRect().width || 1;
    const abs = Math.abs(this._dragDX);

    // «тап» на месте
    if (abs <= SWIPE_TAP_PX) {
      const mid = width / 2;
      if (e.clientX < mid) this.prev(); else this.next();
      this.resume();
      this._dragDX = 0;
      this.requestUpdate();
      return;
    }

    // снэп или откат
    const threshold = Math.max(SNAP_PX, SNAP_RATIO * width);
    if (abs >= threshold && this._dragDX !== 0) {
      const dir = this._dragDX < 0 ? 'next' : 'prev';
      this._snapTo(dir);
    } else {
      this._rollback();
    }
  }
  /** @param {PointerEvent} _e */
  _onPointerCancel(_e) {
    if (!this._dragging) return;
    this._dragging = false;
    this._rollback();
  }

  _snapTo(dir) {
    this._trackAnimating = true;
    this._pendingDir = dir;
    const targetPercent = dir === 'next' ? -200 : 0;
    const inline = `transform: translate3d(${targetPercent}%, 0, 0); --track-ms:${TRACK_ANIM_MS}ms;`;
    this.updateComplete.then(() => {
      const t = this.shadowRoot && this.shadowRoot.querySelector('.track');
      if (t) t.setAttribute('style', inline);
    });
  }
  _rollback() {
    this._trackAnimating = true;
    this._pendingDir = null;
    const inline = `transform: translate3d(-100%, 0, 0); --track-ms:${TRACK_ANIM_MS}ms;`;
    this.updateComplete.then(() => {
      const t = this.shadowRoot && this.shadowRoot.querySelector('.track');
      if (t) t.setAttribute('style', inline);
    });
  }
  /** @param {TransitionEvent} _e */
  _onTrackTransitionEnd(_e) {
    this._trackAnimating = false;
    this._dragDX = 0;

    if (this._pendingDir === 'next') this.next();
    else if (this._pendingDir === 'prev') this.prev();

    this._pendingDir = null;
    if (this.autoplay) this.resume();
  }

  /** @param {StoryCta} cta */
  _renderCta(cta) {
    if (cta && cta.href) {
      return html`<a class="cta" href=${cta.href} target=${cta.newTab ? '_blank' : '_self'} rel="noopener">${cta.label}</a>`;
    }
    return html`<button class="cta" type="button" @click=${() => this._emitCta()} aria-label=${cta?.label || 'Action'}>${cta?.label || 'Action'}</button>`;
  }
  _emitCta() {
    const slide = this.items[this.index];
    this.dispatchEvent(new CustomEvent('cta', { detail: { index: this.index, slide } }));
  }

  /** @param {StorySlide} s */
  _bgStyle(s) {
    const st = [];
    const bgColor = s.bgColor || '#000';
    st.push(`--bg-color:${bgColor}`);
    const overlayVal = typeof s.overlay === 'number' ? String(s.overlay) : '0.35';
    st.push(`--bg-overlay:${overlayVal}`);
    if (s.bgImage) {
      st.push(`--bg-image:url("${s.bgImage}")`);
      if (s.bgPosition) st.push(`--bg-position:${s.bgPosition}`);
      if (s.bgSize) st.push(`--bg-size:${s.bgSize}`);
    } else {
      st.push(`--bg-image:none`);
    }
    return st.join(';');
  }

  /**
   * Unified internal slide renderer.
   * Override hook: listen 'render-slide' and set detail.render = () => TemplateResult
   * @param {StorySlide|null} s
   * @returns {import('lit').TemplateResult|symbol}
   */
  _renderSlide(s) {
    if (!s) return nothing;

    const ev = new CustomEvent('render-slide', {
      detail: { slide: s, render: null },
      bubbles: true, cancelable: true, composed: true,
    });
    this.dispatchEvent(ev);
    if (typeof ev.detail.render === 'function') return ev.detail.render();

    const hasCta = s.cta && typeof s.cta.label === 'string' && s.cta.label.length > 0;

    return html`
      <div class="bg" style=${this._bgStyle(s)} aria-hidden="true"></div>
      <div class="content">
        <div class="head">
          ${s.iconUrl ? html`<div class="icon"><img src=${s.iconUrl} alt="" /></div>` : html`<div class="icon" aria-hidden="true"></div>`}
          <div class="title">${s.title || ''}</div>
        </div>
        <div class="body">
          ${s.text ? html`<div class="text">${s.text}</div>` : nothing}
          ${s.subtext ? html`<div class="subtext">${s.subtext}</div>` : nothing}
        </div>
        <div class="footer">
          <slot name="footer-left"></slot>
          ${hasCta ? this._renderCta(s.cta) : html`<span></span>`}
        </div>
      </div>
    `;
  }

  /**
   * Inline SVG arrow icon.
   * @param {'left'|'right'} dir
   * @returns {import('lit').TemplateResult}
   */
  _iconArrow(dir) {
    const d = dir === 'left'
      ? 'M14.5 4l-8 8 8 8M7 12h14'
      : 'M9.5 4l8 8-8 8M17 12H3';
    return html`
      <svg class="sideButtons__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="${d}"></path>
      </svg>
    `;
  }

  render() {
    const total = this.items.length;
    const cur = this.items[this.index] || null;
    const prevIndex = this.index > 0 ? this.index - 1 : (this.loop ? total - 1 : this.index);
    const nextIndex = this.index < total - 1 ? this.index + 1 : (this.loop ? 0 : this.index);
    const prevSlide = this.items[prevIndex] || null;
    const nextSlide = this.items[nextIndex] || null;

    // базовый сдвиг -100% + drag-px
    const dragPx = this._dragDX || 0;
    const base = -100; // %
    const trackInline = this._trackAnimating
      ? `transform: translate3d(${base}%, 0, 0); --track-ms:${TRACK_ANIM_MS}ms;`
      : `transform: translate3d(calc(${base}% + ${dragPx}px), 0, 0);`;

    return html`
      <div class="progress" aria-hidden="true">
        ${this.items.map((_, i) => html`
          <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100"
               aria-valuenow="${parseFloat(this._progressWidth(i))}">
            <div class="fill" style="width:${this._progressWidth(i)}"></div>
          </div>
        `)}
      </div>

      <div class="viewport"
           role="region"
           aria-roledescription="carousel"
           aria-label="Stories"
           tabindex="0"
           @keydown=${this._onKeydown}
           @mouseenter=${this._onMouseEnter}
           @mouseleave=${this._onMouseLeave}
           @pointerdown=${this._onPointerDown}
           @pointermove=${this._onPointerMove}
           @pointerup=${this._onPointerUp}
           @pointercancel=${this._onPointerCancel}>
        <div class="${this._trackAnimating ? 'track track--anim' : 'track'}"
             style="${trackInline}"
             @transitionend=${this._onTrackTransitionEnd}>
          <div class="pane">${this._renderSlide(prevSlide)}</div>
          <div class="pane">${this._renderSlide(cur)}</div>
          <div class="pane">${this._renderSlide(nextSlide)}</div>
        </div>
      </div>

      <div class="nav" aria-hidden="true">
        <button class="tap" @click=${this.prev} aria-label="Prev area"></button>
        <button class="tap" @click=${this.next} aria-label="Next area"></button>
      </div>

      ${this.controls ? html`
        <div class="buttons">
          <button type="button" @click=${this.prev} aria-label="Previous">Prev</button>
          <button type="button" @click=${this.next} aria-label="Next">Next</button>
        </div>
      ` : nothing}

      ${this.sideButtons ? html`
        <div class="sideButtons" aria-hidden="false">
          <button type="button" class="sideButtons__btn sideButtons__btn--left" @click=${this.prev} aria-label="Previous">
            ${this._iconArrow('left')}
          </button>
          <button type="button" class="sideButtons__btn sideButtons__btn--right" @click=${this.next} aria-label="Next">
            ${this._iconArrow('right')}
          </button>
        </div>
      ` : nothing}
    `;
  }

  /** @param {number} i */
  _progressWidth(i) {
    if (i < this.index) return '100%';
    if (i > this.index) return '0%';
    const p = typeof this._progressPct === 'number' ? this._progressPct : 0;
    const clamp = Math.max(0, Math.min(1, p));
    return `${(clamp * 100).toFixed(2)}%`;
  }
}

customElements.define('story-slider', StorySlider);