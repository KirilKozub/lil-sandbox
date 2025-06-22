import { LitElement } from 'lit';

// Глобальный стор для подписок: { [key]: Set<callback> }
const subscriptions = new Map();

/**
 * Первый модификатор: отслеживает изменение свойства и уведомляет подписчиков.
 * @param {typeof LitElement} BaseClass
 * @param {string} watchedProp - свойство, за которым следим
 * @param {string} key - ключ связи
 */
export function TrackProperty(BaseClass, watchedProp, key) {
  return class extends BaseClass {
    updated(changedProps) {
      super.updated?.(changedProps);
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
 * Второй модификатор: подписывается на обновления из первого и сохраняет результат в реактивное свойство.
 * @param {typeof LitElement} BaseClass
 * @param {string} targetProp - реактивное свойство, куда писать
 * @param {string} key - ключ связи
 */
export function SubscribeToProperty(BaseClass, targetProp, key) {
  return class extends BaseClass {
    static properties = {
      ...super.properties,
      [targetProp]: { type: Object },
    };

    constructor() {
      super();
      const updateValue = (value) => {
        this[targetProp] = value;
      };

      // Подписываемся
      if (!subscriptions.has(key)) {
        subscriptions.set(key, new Set());
      }
      subscriptions.get(key).add(updateValue);
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
      const subs = subscriptions.get(key);
      if (subs) {
        subs.forEach(cb => {
          if (cb.name === 'updateValue') subs.delete(cb);
        });
      }
    }
  };
}