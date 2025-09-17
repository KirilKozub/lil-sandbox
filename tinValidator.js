/**
 * Check if string is strictly ascending sequence of digits
 * @param {string} input
 * @returns {boolean} true if ascending sequence
 */
function isAscendingSequence(input) {
  if (!/^\d+$/.test(input)) return false; // only digits
  for (let i = 1; i < input.length; i++) {
    const prev = Number(input[i - 1]);
    const curr = Number(input[i]);
    if ((prev + 1) % 10 !== curr) {
      return false; // must follow consecutively (wrap 9->0 also invalid)
    }
  }
  return true;
}

/**
 * Execute validator: returns true if NOT ascending
 * (valid), false if ascending (invalid)
 * @param {string} input
 * @returns {boolean}
 */
function execute(input) {
  return !isAscendingSequence(input);
}

// examples
console.log(execute("0123456789"));   // false -> invalid (ascending)
console.log(execute("1234567890"));   // false -> invalid (ascending)
console.log(execute("12345678901"));  // false -> invalid (ascending)
console.log(execute("9876543210"));   // true -> valid (not ascending)
console.log(execute("13579"));        // true -> valid (not ascending)