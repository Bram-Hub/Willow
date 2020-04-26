/**
 * Returns the number of keys in an object.
 * 
 * @param {Object} obj the object
 * @returns {Number} the number of keys in {@param obj}
 */
function countKeys(obj) {
  return Object.keys(obj).length;
}

/**
 * Returns an inverted copy of an object. Assumes that the original object is
 * one-to-one.
 * 
 * @param {Object} obj the object to invert 
 * @returns {Object} the inverted copy
 */
function invertObject(obj) {
  const inverse = {};
  for (const [key, value] of Object.entries(obj)) {
    inverse[value] = key;
  }
  return inverse;
}
