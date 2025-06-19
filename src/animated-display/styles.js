import { css } from 'lit';

export const messageStyles = css`
  .wrapper {
    opacity: 0;
    transition: opacity var(--animated-display-transition, 400ms ease);
    pointer-events: none;
  }

  .wrapper.visible {
    opacity: 1;
    pointer-events: auto;
  }

  .wrapper.fade {
    transition: opacity var(--animated-display-transition, 400ms ease);
  }

  .wrapper.collapse {
    transition: opacity var(--animated-display-transition, 400ms ease), height var(--animated-display-transition, 400ms ease);
    overflow: hidden;
    height: auto;
  }

  .wrapper:not(.visible).collapse {
    height: 0;
    opacity: 0;
  }

  .wrapper.slide-up {
    transform: translateY(10px);
    transition: transform var(--animated-display-transition, 400ms ease), opacity var(--animated-display-transition, 400ms ease);
  }

  .wrapper.visible.slide-up {
    transform: translateY(0);
  }

  .wrapper.slide-down {
    transform: translateY(-10px);
    transition: transform var(--animated-display-transition, 400ms ease), opacity var(--animated-display-transition, 400ms ease);
  }

  .wrapper.visible.slide-down {
    transform: translateY(0);
  }

  .wrapper.scale {
    transform: scale(0.9);
    transition: transform var(--animated-display-transition, 400ms ease), opacity var(--animated-display-transition, 400ms ease);
  }

  .wrapper.visible.scale {
    transform: scale(1);
  }

  .wrapper.flip {
    transform: rotateX(90deg);
    transition: transform var(--animated-display-transition, 400ms ease), opacity var(--animated-display-transition, 400ms ease);
    transform-origin: top;
  }

  .wrapper.visible.flip {
    transform: rotateX(0deg);
  }

  .wrapper.blink.visible {
    animation: blink-once var(--animated-display-blink-speed, 500ms) ease-in-out;
    animation-iteration-count: var(--animated-display-blink-count, 2);
    animation-fill-mode: both;
  }

  @keyframes blink-once {
    0% { opacity: 1; }
    50% { opacity: 0; }
    100% { opacity: 1; }
  }

  .hidden {
    display: none;
  }

  .invisible {
    visibility: hidden;
  }
`;