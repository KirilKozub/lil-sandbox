// ========================= // getFocusableElements.js (updated without isVisible) // =========================

/**

Returns all focusable elements inside a container without checking visibility.

@param {HTMLElement | ShadowRoot} container - The root element to search within.

@param {string[]} customSelectors - Optional array of custom tag selectors (e.g., ['my-button', 'custom-input']).

@returns {HTMLElement[]} - Array of focusable elements. */ export function getFocusableElements(container, customSelectors = []) { const defaultSelectors = [ 'button', '[href]', 'input', 'select', 'textarea', '[tabindex]:not([tabindex="-1"])', 'details', 'summary', 'iframe', ];


const selectors = [...defaultSelectors, ...customSelectors];

const elements = Array.from(container.querySelectorAll(selectors.join(',')));

return elements.filter(el => { const isDisabled = el.hasAttribute('disabled'); const isHidden = el.getAttribute('aria-hidden') === 'true'; const hasFocusMethod = typeof el.focus === 'function';

return !isDisabled && !isHidden && hasFocusMethod;

}); }

/**

Recursively finds the first focusable element inside a node.

If the node itself is focusable, returns it directly.

@param {HTMLElement} node - The element to check.

@param {string[]} customSelectors - Optional custom selectors for focusable elements.

@returns {HTMLElement | null} - The first focusable element found, or null. */ export function findFirstFocusable(node, customSelectors = []) { if (!node) return null;


const isSelfFocusable = typeof node.focus === 'function' && (node.tabIndex >= 0 || customSelectors.includes(node.localName));

if (isSelfFocusable) { return node; }

const focusables = getFocusableElements(node, customSelectors); return focusables.length > 0 ? focusables[0] : null; }

