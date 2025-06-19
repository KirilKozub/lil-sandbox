import { LitElement, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { messageStyles } from './styles.js';
import { sleep, createQueue, waitWithPause } from './utils.js';

/**
 * @typedef {'fade' | 'collapse' | 'slide-up' | 'slide-down' | 'scale' | 'flip' | 'blink'} AnimationType
 * @typedef {'none' | 'visibility' | 'opacity'} DisplayStrategy
 */

export class AnimatedDisplay extends LitElement {
  static properties = {
    delay: { type: Number },
    duration: { type: Number },
    animation: { type: String },
    queue: { type: Boolean },
    gapBetween: { type: Number },
    interactive: { type: Boolean },
    keepAliveWhileHovered: { type: Boolean },
    once: { type: Boolean },
    ariaRole: { type: String },
    ariaLive: { type: String },
    transitionDuration: { type: Number },
    easing: { type: String },
    displayStrategy: { type: String },
    blinkCount: { type: Number },
    blinkSpeed: { type: Number },
    _visible: { state: true },
    _isPaused: { state: true, attribute: 'paused', reflect: true },
    _isHiding: { state: true, attribute: 'hiding', reflect: true },
    _displayVisible: { state: true },
  };

  constructor() {
    super();
    this.delay = 0;
    this.duration = 2500;
    this.animation = 'fade';
    this.queue = false;
    this.gapBetween = 500;
    this.interactive = false;
    this.keepAliveWhileHovered = false;
    this.once = false;
    this.ariaRole = '';
    this.ariaLive = '';
    this.transitionDuration = 400;
    this.easing = 'ease';
    this.displayStrategy = 'none';
    this.blinkCount = 3;
    this.blinkSpeed = 150;
    this._visible = false;
    this._displayVisible = false;
    this._isHiding = false;
    this._queueManager = createQueue();
    this._current = null;
    this._hovered = false;
    this._hasShown = false;
    this._isPaused = false;
  }

  static styles = [messageStyles];

  async show(options = {}) {
    if (this.once && this._hasShown) {
      return Promise.resolve();
    }

    const action = () => this._run(options.paused);

    if (this.queue) {
      const promise = new Promise(resolve => {
        this._queueManager.push(async () => {
          await action();
          resolve();
        });
      });

      if (!this._current) {
        this._queueManager.run();
      }

      return promise;
    }

    this._interrupt();
    return action();
  }

  hide() {
    this._interrupt();
    this.dispatchEvent(new CustomEvent('hide-start', { bubbles: true, composed: true }));
    this._visible = false;
    this._displayVisible = false;
    this._isHiding = false;
    this._current = null;
  }

  reset() {
    this._hasShown = false;
  }

  pause() {
    this._isPaused = true;
  }

  resume() {
    this._isPaused = false;
  }

  async updateContent({ restartTimer = false, replayAnimation = false } = {}) {
    if (!this._visible) return;

    if (replayAnimation) {
      this._visible = false;
      await this.updateComplete;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this._visible = true;
        });
      });
    }

    if (restartTimer && this._current) {
      this._interrupt();
      this.show();
    }
  }

  async _run(startPaused = false) {
    if (this._visible || this._isHiding) return;

    const minVisibleTime = this.transitionDuration + 100;
    if (this.duration < minVisibleTime) {
      this.duration = minVisibleTime;
    }

    this._hasShown = true;
    this._isPaused = startPaused;
    this.dispatchEvent(new CustomEvent('show-start', { bubbles: true, composed: true }));
    this._current = new Promise(async resolve => {
      if (this.delay) await sleep(this.delay);

      this._displayVisible = true;
      this._visible = true;

      if (this.animation === 'blink') {
        const totalBlinkTime = (this.blinkCount * 2) * this.blinkSpeed;
        await sleep(totalBlinkTime);
      }

      await waitWithPause({
        duration: this.duration,
        isPaused: () =>
          this._isPaused ||
          (this.interactive && this._hovered) ||
          (this.keepAliveWhileHovered && this._hovered),
      });

      this._isHiding = true;
      this.dispatchEvent(new CustomEvent('hide-start', { bubbles: true, composed: true }));
      this._visible = false;
      await sleep(this.transitionDuration);

      this._isHiding = false;
      this._displayVisible = false;
      this.dispatchEvent(new CustomEvent('hide-end', { bubbles: true, composed: true }));
      resolve();

      if (this.queue && this.gapBetween) {
        await sleep(this.gapBetween);
      }

      this._current = null;
    });

    return this._current;
  }

  _interrupt() {
    this._visible = false;
    this._isHiding = false;
    this._displayVisible = false;
    this._queueManager.clear();
    this._current = null;
    this._isPaused = false;
  }

  render() {
    const validAnimations = ['fade', 'collapse', 'slide-up', 'slide-down', 'scale', 'flip', 'blink'];
    const anim = validAnimations.includes(this.animation) ? this.animation : 'fade';

    const hiddenClass = this.displayStrategy === 'none'
      ? (!this._displayVisible ? 'hidden' : '')
      : this.displayStrategy === 'visibility'
        ? (!this._displayVisible ? 'invisible' : '')
        : '';

    const classes = `wrapper ${anim} ${this._visible ? 'visible' : ''} ${hiddenClass}`;

    const ariaAttrs = {
      role: this.ariaRole || (this.once ? 'alert' : undefined),
      'aria-live': this.ariaLive || (this.once ? 'assertive' : undefined)
    };

    const inert = !this._displayVisible ? 'inert' : null;

    this.style.setProperty('--animated-display-transition', `${this.transitionDuration}ms ${this.easing}`);
    this.style.setProperty('--animated-display-blink-speed', `${this.blinkSpeed}ms`);
    this.style.setProperty('--animated-display-blink-count', `${this.blinkCount}`);

    return html`
      <div
        class=${classes}
        role=${ifDefined(ariaAttrs.role)}
        aria-live=${ifDefined(ariaAttrs['aria-live'])}
        ?inert=${inert}
        @mouseenter=${() => (this._hovered = true)}
        @mouseleave=${() => (this._hovered = false)}
        @focusin=${() => (this._hovered = true)}
        @focusout=${() => (this._hovered = false)}
      >
        <slot></slot>
      </div>
    `;
  }
}

customElements.define('animated-display', AnimatedDisplay);
