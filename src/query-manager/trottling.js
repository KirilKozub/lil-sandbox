export function throttle(callback, limit = 250) {
  let lastCall = 0;
  let scheduled = false;
  let lastArgs;
  let context;

  return function throttled(...args) {
    const now = Date.now();
    context = this;
    lastArgs = args;

    if (now - lastCall >= limit) {
      lastCall = now;
      callback.apply(context, lastArgs);
    } else if (!scheduled) {
      scheduled = true;
      setTimeout(() => {
        lastCall = Date.now();
        scheduled = false;
        callback.apply(context, lastArgs);
      }, limit - (now - lastCall));
    }
  };
}