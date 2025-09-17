/**
 * Check if string contains only identical digits
 * @param {string} input
 * @returns {boolean} true if all digits are the same
 */
function hasAllSameDigits(input) {
  return /^(\d)\1+$/.test(input);
}

// examples
console.log(hasAllSameDigits("1111111111")); // true
console.log(hasAllSameDigits("0000000000")); // true
console.log(hasAllSameDigits("999"));        // true
console.log(hasAllSameDigits("123456"));     // false
console.log(hasAllSameDigits("112233"));     // false