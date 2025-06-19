import { html } from 'lit';
import { createRef, ref } from 'lit/directives/ref.js';
import '../src/animated-display/AnimatedDisplay.js';

export default {
  title: 'Components/AnimatedDisplay',
  component: 'animated-display',
};

const baseContent = html`
  <div style="background:#fee; padding:1em; border:1px solid red;">
    Hello world!
  </div>
`;

export const Default = () => {
  const displayRef = createRef();
  return html`
    <button @click=${() => displayRef.value?.show()}>Show</button>
    <animated-display ${ref(displayRef)}>
      ${baseContent}
    </animated-display>
  `;
};

export const WithDelayAndDuration = () => {
  const displayRef = createRef();
  return html`
    <button @click=${() => displayRef.value?.show()}>Show</button>
    <animated-display
      delay="500"
      duration="3000"
      ${ref(displayRef)}
    >
      ${baseContent}
    </animated-display>
  `;
};

export const InteractivePause = () => {
  const displayRef = createRef();
  return html`
    <button @click=${() => displayRef.value?.show()}>Hover to pause</button>
    <animated-display
      interactive
      duration="3000"
      ${ref(displayRef)}
    >
      <div style="background:#eef; padding:1em;">
        Hovering me pauses hide
      </div>
    </animated-display>
  `;
};

export const ShowPausedAndResume = () => {
  const displayRef = createRef();
  return html`
    <button @click=${() => displayRef.value?.show({ paused: true })}>Show Paused</button>
    <button @click=${() => displayRef.value?.resume()}>Resume</button>
    <animated-display ${ref(displayRef)}>
      <div style="background:#fee; padding:1em;">Paused initially</div>
    </animated-display>
  `;
};


export const AllAnimations = () => {
  const animations = ['fade', 'collapse', 'slide-up', 'slide-down', 'scale', 'flip'];
  return html`${animations.map(name => {
    const r = createRef();
    return html`
      <div style="margin-bottom:1em;">
        <strong>${name}</strong>
        <button @click=${() => r.value?.show()}>Show</button>
        <animated-display animation=${name} ${ref(r)} duration="2000">
          <div style="background:#fef3c7; padding:1em;">${name} animation</div>
        </animated-display>
      </div>
    `;
  })}`;
};

export const WithQueue = () => {
  const r = createRef();
  return html`
    <button @click=${() => r.value?.show()}>Add to queue</button>
    <animated-display queue gapBetween="300" duration="1000" ${ref(r)}>
      <div style="background:#cffafe; padding:1em;">Queued message</div>
    </animated-display>
  `;
};

export const OnceOnly = () => {
  const r = createRef();
  return html`
    <button @click=${() => r.value?.show()}>Show (once)</button>
    <button @click=${() => r.value?.reset()}>Reset</button>
    <animated-display once ${ref(r)}>${baseContent}</animated-display>
  `;
};

export const KeepAliveWhileHovered = () => {
  const r = createRef();
  return html`
    <button @click=${() => r.value?.show()}>Keep alive</button>
    <animated-display keepAliveWhileHovered duration="3000" ${ref(r)}>
      <div style="background:#fff3cd; padding:1em;">Stay visible while hovered</div>
    </animated-display>
  `;
};

export const TransitionTiming = () => {
  const r = createRef();
  return html`
    <button @click=${() => r.value?.show()}>Show (slow)</button>
    <animated-display
      animation="scale"
      transition-duration="1000"
      easing="cubic-bezier(0.68, -0.55, 0.27, 1.55)"
      duration="3000"
      ${ref(r)}
    >
      <div style="background:#d1fae5; padding:1em;">Custom easing</div>
    </animated-display>
  `;
};

export const AccessibilityProps = () => {
  const r = createRef();
  return html`
    <button @click=${() => r.value?.show()}>Show ARIA alert</button>
    <animated-display aria-role="alert" aria-live="assertive" ${ref(r)}>
      <div style="background:#ffe4e6; padding:1em;">This is important!</div>
    </animated-display>
  `;
};


///


const Template = (args) => html`
  <animated-display
    .delay=${args.delay}
    .duration=${args.duration}
    .animation=${args.animation}
    .queue=${args.queue}
    .gapBetween=${args.gapBetween}
    .interactive=${args.interactive}
    .keepAliveWhileHovered=${args.keepAliveWhileHovered}
    .once=${args.once}
    .transitionDuration=${args.transitionDuration}
    .easing=${args.easing}
    .displayStrategy=${args.displayStrategy}
    .blinkCount=${args.blinkCount}
    .blinkSpeed=${args.blinkSpeed}
    id="demo"
  >
    <div style="background:#2196f3;color:white;padding:10px;border-radius:6px">Hello!</div>
  </animated-display>
  <button @click=${() => document.getElementById('demo').show()}>Show</button>
  <button @click=${() => document.getElementById('demo').hide()}>Hide</button>
  <button @click=${() => document.getElementById('demo').pause()}>Pause</button>
  <button @click=${() => document.getElementById('demo').resume()}>Resume</button>
`;

export const Fade = Template.bind({});
Fade.args = {
  animation: 'fade',
  delay: 0,
  duration: 2000,
  transitionDuration: 400,
  easing: 'ease',
  queue: false,
  gapBetween: 300,
  interactive: false,
  keepAliveWhileHovered: false,
  once: false,
  displayStrategy: 'none',
};

export const Blink = Template.bind({});
Blink.args = {
  ...Fade.args,
  animation: 'blink',
  blinkCount: 4,
  blinkSpeed: 120,
};

export const CollapseInteractive = Template.bind({});
CollapseInteractive.args = {
  ...Fade.args,
  animation: 'collapse',
  interactive: true,
};

export const SlideQueue = Template.bind({});
SlideQueue.args = {
  ...Fade.args,
  animation: 'slide-up',
  queue: true,
};

export const ScaleOnce = Template.bind({});
ScaleOnce.args = {
  ...Fade.args,
  animation: 'scale',
  once: true,
};

export const FlipKeepAlive = Template.bind({});
FlipKeepAlive.args = {
  ...Fade.args,
  animation: 'flip',
  keepAliveWhileHovered: true,
};

export const VisibilityStrategy = Template.bind({});
VisibilityStrategy.args = {
  ...Fade.args,
  displayStrategy: 'visibility',
};


export const BlinkAttention = Template.bind({});
BlinkAttention.args = {
  animation: 'blink',
  blinkCount: 1,
  blinkSpeed: 500,
  duration: 1200,
  transitionDuration: 400,
  easing: 'ease-in-out',
  delay: 0,
  displayStrategy: 'none',
};


export const ErrorMessageBlink = () => {
  const animatedDisplayRef = createRef();

  const simulateError = () => {
    animatedDisplayRef.value?.show();
  };

  return html`
    <button @click=${simulateError}>Simulate Error</button>

    <animated-display
      ${ref(animatedDisplayRef)}
      .animation=${'blink'}
      .duration=${3000}
      .delay=${0}
      .blinkCount=${1}
      .blinkSpeed=${1500}
      .keepAliveWhileHovered=${true}
      .interactive=${true}
      .once=${false}
      .transitionDuration=${300}
      .easing=${'ease-in-out'}
      .displayStrategy=${'none'}
      role="alert"
      aria-live="assertive"
    >
      <div
        style="
          background: #f44336;
          color: white;
          padding: 0.75em 1em;
          border-radius: 4px;
        "
      >
        ⚠️ Ошибка: не удалось выполнить запрос
      </div>
    </animated-display>
  `;
};