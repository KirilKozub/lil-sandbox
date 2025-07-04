/**
 * Recursively searches for the first focusable element inside or is the given node.
 * @param {HTMLElement} node - The node to search within.
 * @param {string[]} customSelectors - Optional array of custom tag selectors.
 * @returns {HTMLElement | null} - First focusable element or null.
 */
export function findFirstFocusable(node, customSelectors = []) {
  if (!node) return null;

  const isNodeFocusable =
    typeof node.focus === 'function' &&
    (node.tabIndex >= 0 || customSelectors.includes(node.localName));

  if (isNodeFocusable) return node;

  const focusables = getFocusableElements(node, customSelectors);
  return focusables.length > 0 ? focusables[0] : null;
}