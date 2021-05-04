/**
 * Determines whether or not a set is a subset of another set.
 * @param a the first set
 * @param b the second set
 * @returns true if `a` is a subset of `b`, false otherwise
 */
export function isSubset<T>(a: Set<T>, b: Set<T>) {
	for (const element of a) {
		if (!b.has(element)) {
			return false;
		}
	}
	return true;
}

/**
 * Determines whether or not a set is equal to another set.
 * @param a the first set
 * @param b the second set
 * @returns true if `a` is equal to `b`, false otherwise
 */
export function isEqual<T>(a: Set<T>, b: Set<T>) {
	return isSubset(a, b) && isSubset(b, a);
}
