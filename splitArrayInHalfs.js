/**
 * Splits an array into two halves. The first half has one more element if the original array length is odd.
 * @param {Array} array - The array to split.
 * @returns {[Array, Array]} - An array containing two arrays: the first and second halves.
 */
function splitArrayInHalf(array) {
  const middleIndex = Math.ceil(array.length / 2);
  const firstHalf = array.slice(0, middleIndex);
  const secondHalf = array.slice(middleIndex);
  return [firstHalf, secondHalf];
}

// Пример:
const arr = [1, 2, 3, 4, 5];
const [first, second] = splitArrayInHalf(arr);
console.log(first);  // [1, 2, 3]
console.log(second); // [4, 5]