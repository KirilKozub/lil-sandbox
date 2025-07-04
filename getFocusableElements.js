/**
 * Returns all focusable elements inside a container.
 * @param {HTMLElement | ShadowRoot} container - The root element to search within.
 * @param {string[]} customSelectors - Optional array of custom tag selectors (e.g., ['my-button', 'custom-input']).
 * @returns {HTMLElement[]} - Array of focusable elements.
 */
export function getFocusableElements(container, customSelectors = []) {
  const defaultSelectors = [
    'button',
    '[href]',
    'input',
    'select',
    'textarea',
    '[tabindex]:not([tabindex="-1"])',
    'details',
    'summary',
    'iframe',
  ];

  const selectors = [...defaultSelectors, ...customSelectors];

  const elements = Array.from(container.querySelectorAll(selectors.join(',')));

  return elements.filter(el => {
    const isVisible = !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    const isDisabled = el.hasAttribute('disabled');
    const isHidden = el.getAttribute('aria-hidden') === 'true';
    const hasFocusMethod = typeof el.focus === 'function';

    return isVisible && !isDisabled && !isHidden && hasFocusMethod;
  });
}