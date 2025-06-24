/**
 * Creates a throttled version of the given function.
 * The throttled function invokes the original callback at most once
 * every `limit` milliseconds. If multiple calls occur during the wait time,
 * the last one will be executed after the delay.
 *
 * @template TArgs
 * @param {(this: any, ...args: TArgs[]) => any} callback - The original function to throttle
 * @param {number} limit - Minimum delay in milliseconds between invocations
 * @returns {(this: any, ...args: TArgs[]) => void} - A throttled wrapper function
 */
export function throttle(callback, limit = 250) {
  let lastCall = 0; // Timestamp of the last execution
  let scheduled = false; // Whether a delayed execution is already scheduled
  let lastArgs; // Last arguments passed to the throttled function
  let context;  // `this` context to apply the original function with

  /**
   * The actual throttled function that wraps the callback
   * @this {any}
   * @param {...TArgs} args - Arguments to pass to the callback
   */
  function throttled(...args) {
    const now = Date.now();
    context = this;
    lastArgs = args;

    // If enough time has passed, execute immediately
    if (now - lastCall >= limit) {
      lastCall = now;
      callback.apply(context, lastArgs);
    }
    // Otherwise, schedule execution after the remaining time
    else if (!scheduled) {
      scheduled = true;
      setTimeout(() => {
        lastCall = Date.now();
        scheduled = false;
        callback.apply(context, lastArgs);
      }, limit - (now - lastCall));
    }
  }

  return throttled;
}