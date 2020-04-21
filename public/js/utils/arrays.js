/**
 * Recursively maps an array using a map function.
 * 
 * @param {Array} arr the array to map 
 * @param {Function} mapFn the map function
 */
function recursiveMap(arr, mapFn) {
  return arr.map(el => {
    if (Array.isArray(el)) {
      return recursiveMap(el, mapFn);
    } else {
      return mapFn(el);
    }
  });
}

/**
 * Determines if an array starts with some sequence of elements.
 * 
 * @param {Array} arr the array to check
 * @param {Array} prefix the sequence of elements
 * @returns {Boolean} if the array starts with the prefix or not
 */
function arrayStartsWith(arr, prefix) {
  if (prefix.length > arr.length) {
    return false;
  }

  for (let i = 0; i < prefix.length; ++i) {
    if (arr[i] !== prefix[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Clones an array using a "deep clone" method (subarrays are also cloned).
 * 
 * @param {Array} arr the array to clone
 * @returns {Array} a clone of {@param arr}
 */
function deepClone(arr) {
  const clone = [];
  for (const el of arr) {
    if (Array.isArray(el)) {
      clone.push(deepClone(el));
    } else {
      clone.push(el);
    }
  }
  return clone;
}

/**
 * Recursively sorts an array. If an array is an element of its parent array, then
 * it will be sorted before its parent.
 * 
 * @param {Array} arr the array to sort 
 */
function recursiveSort(arr) {
  for (const el of arr) {
    if (Array.isArray(el)) {
      recursiveSort(el);
    }
  }
  arr.sort();
}

/**
 * "Normalizes" an array, meaning it is sorted and converted to a string in order
 * to perform an unordered comparison (equality, etc.).
 * 
 * @param {Array} arr the array to normalize
 * @returns {String} the normalized array, as a string
 */
function normalize(arr) {
  // clone the array so the sort doesn't affect the original array
  const clone = deepClone(arr);
  recursiveSort(clone);
  return JSON.stringify(clone);
}