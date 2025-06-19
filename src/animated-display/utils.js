/**
 * Sleep на заданное количество миллисекунд
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Простая очередь задач
   */
  export function createQueue() {
    const queue = [];
    let running = false;
  
    async function run() {
      if (running || queue.length === 0) return;
      running = true;
      while (queue.length) {
        const task = queue.shift();
        await task?.();
      }
      running = false;
    }
  
    return {
      push(fn) {
        queue.push(fn);
      },
      run,
      clear() {
        queue.length = 0;
        running = false;
      }
    };
  }
  
  /**
   * Ожидание с возможностью паузы
   * @param {Object} options
   * @param {number} options.duration
   * @param {() => boolean} options.isPaused
   * @returns {Promise<void>}
   */
  export async function waitWithPause({ duration, isPaused }) {
    const interval = 50;
    let elapsed = 0;
  
    while (elapsed < duration) {
      if (!isPaused()) {
        elapsed += interval;
      }
      await sleep(interval);
    }
  }
  