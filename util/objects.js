/**
 * Returns the value for a nested property in an object.
 * @param {object} obj the object to search within
 * @param {*} path the path to the nested property
 * @return {any} the value of the nested property
 */
exports.nestedProperty = function(obj, path) {
  // Iterate through the keys in the path
  for (const key of path.split('.')) {
    if (obj === undefined) {
      // If undefined is reached at any point, we cannot go any further
      return undefined;
    }
    obj = obj[key];
  }
  return obj;
};
