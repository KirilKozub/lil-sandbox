import { LitElement } from 'lit';

/**
 * A global subscription map where:
 * key → Set of subscriber callbacks
 * Example:
 * 'search-key' → Set of (value) => { ... }
 */
const subscriptions = new Map();

/**
 * Modifier #1 — Tracks changes to a specific property and notifies all subscribers for the given key.
 *
 * @param {typeof LitElement} BaseClass - The base Lit component class
 * @param {string} watchedProp - The property name to observe for changes
 * @param {string} key - The shared subscription key
 * @returns {typeof LitElement} - A new class with tracking functionality
 */
export function TrackProperty(BaseClass, watchedProp, key) {
  return class extends BaseClass {
    updated(changedProps) {
      // Call the original updated() if defined
      super.updated?.(changedProps);

      // If the tracked property changed, notify all subscribers for this key
      if (changedProps.has(watchedProp)) {
        const newValue = this[watchedProp];
        const subs = subscriptions.get(key);
        if (subs) {
          for (const cb of subs) cb(newValue);
        }
      }
    }
  };
}

/**
 * Modifier #2 — Subscribes to changes from a shared key and updates a reactive property.
 *
 * @param {typeof LitElement} BaseClass - The base Lit component class
 * @param {string} targetProp - The name of the reactive property to assign received values to
 * @param {string} key - The subscription key to listen on
 * @returns {typeof LitElement} - A new class with subscription logic
 */
export function SubscribeToProperty(BaseClass, targetProp, key) {
  return class extends BaseClass {
    static properties = {
      ...super.properties,
      [targetProp]: {}, // Make the target property reactive (any type)
    };

    constructor() {
      super();

      // Define the callback that receives new values
      this._subscriptionCallback = (value) => {
        this[targetProp] = value;
      };

      // Register the callback in the global subscription list
      if (!subscriptions.has(key)) {
        subscriptions.set(key, new Set());
      }
      subscriptions.get(key).add(this._subscriptionCallback);
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();

      // Remove subscription when component is disconnected
      const subs = subscriptions.get(key);
      if (subs) {
        subs.delete(this._subscriptionCallback);
      }
    }
  };
}