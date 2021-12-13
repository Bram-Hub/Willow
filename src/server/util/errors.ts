/**
 * Immediately throws an error with the given message.
 * @param message the error message
 */
export function throwError(message: string): never {
	throw new Error(message);
}
