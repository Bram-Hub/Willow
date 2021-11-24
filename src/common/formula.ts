import {AssignmentMap} from './util';

export const REPLACEMENT_SYMBOL = '.';

export class Formula {
	name: string;
	args: Formula[] | null;
	isPredicate = false;

	/**
	 * Constructs a new `Formula`, which is represented by a predicate and its
	 * arguments.
	 * @param name the function symbol in the formula or the variable itself
	 * @param args the arguments for this symbol or null if it is a variable
	 * @param isPredicate whether or not the Formula is a predicate
	 */
	constructor(
		name: string,
		args: Formula[] | null = null,
		isPredicate = false
	) {
		this.name = name;
		this.args = args;
		this.isPredicate = isPredicate;
	}

	/**
	 * Determines whether or not this formula is equal to another formula.
	 * @param other the other statement
	 * @returns true if this statement is equal to `other`, false otherwise
	 */
	equals(other: Formula): boolean {
		return new FormulaEquivalenceEvaluator(this, other).checkEquivalence();
	}

	/**
	 * Returns the Set of constants in this formula.
	 * @param symbols the list of non-instantiated symbols
	 * @returns set of constants contained in the formula
	 */
	getConstants(variables: Formula[] = []): Formula[] {
		const constants: Formula[] = [];

		if (this.args === null) {
			// No args means this must be a constant or an atom

			// Predicates do not belong to the universe
			if (this.isPredicate) {
				return constants;
			}

			if (!variables.some(variable => variable.equals(this))) {
				// Not a non-instantiated symbol, so it's a constant
				constants.push(this);
			}
		} else {
			// Count how many of the arguments are functions
			let constantArgs = 0;
			for (const arg of this.args) {
				let isConstant = false;
				for (const constant of arg.getConstants(variables)) {
					let conflict = false;
					for (const prefound of constants) {
						if (prefound.equals(constant)) {
							conflict = true;
							break;
						}
					}
					if (!conflict) {
						constants.push(constant);
						isConstant = true;
					}
				}
				if (isConstant) {
					++constantArgs;
				}
			}

			// If all of the args are constants AND this is NOT a predicate,
			// we should count this formula as a distinct constant
			if (constantArgs === this.args.length && !this.isPredicate) {
				let conflict = false;
				for (const prefound of constants) {
					if (prefound.equals(this)) {
						conflict = true;
						break;
					}
				}

				if (!conflict) {
					constants.push(this);
				}
			}
		}

		return constants;
	}

	/**
	 * Determines whether or not this formula is equal to another formula given
	 * a partially formed mapping of symbolized variables to instantiated
	 * variables.
	 * @param other the other formula
	 * @param assignment the mapping of symbols to instantiated variables
	 * @modifies assignment if there are any new mappings to be made
	 * @returns true if this statement is equal to `other`, false otherwise
	 */
	isMappedEquals(other: Formula, assignment: AssignmentMap): boolean {
		return new FormulaEquivalenceEvaluator(
			this,
			other,
			assignment
		).checkEquivalence();
	}

	/**
	 * Replaces each instance of a variable in this Formula with a modified version,
	 * as specified by the symbol argument.
	 * @param variables the variables to modify
	 * @param symbol the symbol that modifies the variables
	 */
	symbolized(variables: Formula[], symbol: string): Formula {
		let newName = this.name;

		// If this Formula matches one of those in the variables list, symbolize it
		// by prepending the symbol to the name
		if (variables.some(variable => variable.name === this.name)) {
			newName = `${symbol}${this.name}`;
		}

		// Now recursively symbolize each of the arguments
		return new Formula(
			newName,
			this.args?.map(arg => arg.symbolized(variables, symbol)),
			this.isPredicate
		);
	}

	/**
	 * Converts this statement to a string.
	 * @returns the string representation of this statement
	 */
	toString(): string {
		if (this.args === null) {
			return this.name;
		}
		return `${this.name}(${this.args.join(',')})`;
	}
}

class FormulaEquivalenceEvaluator {
	lhs: Formula;
	rhs: Formula;
	assignment: AssignmentMap;

	constructor(lhs: Formula, rhs: Formula, assignment = {}) {
		this.lhs = lhs;
		this.rhs = rhs;
		this.assignment = assignment;
	}

	/**
	 * Checks whether or not the two Formulas match, treating replacement symbols
	 * as wildcards that match everything.
	 * @returns whether or not the two arguments are equivalent
	 */
	checkEquivalence(): boolean {
		return this.checkEquivalenceHelper(this.lhs, this.rhs);
	}

	private checkEquivalenceHelper(lhs: Formula, rhs: Formula): boolean {
		// Check if one of the predicates instantiates the other
		const hadReplacement = this.getReplacement(lhs, rhs);

		// Multiple mappings for the same key in the replacement map
		if (hadReplacement === null) {
			return false;
		}

		// Mapped a variable to something else, possibly a function
		if (hadReplacement === true) {
			return true;
		}

		// The predicates must match
		if (hadReplacement === false && lhs.name !== rhs.name) {
			return false;
		}

		// Check if the arguments match
		if (lhs.args === null || rhs.args === null) {
			return lhs.args === rhs.args;
		}

		if (lhs.args.length !== rhs.args.length) {
			return false;
		}

		return lhs.args.every((arg, index) =>
			this.checkEquivalenceHelper(arg, rhs.args![index])
		);
	}

	/**
	 * Checks if the arguments have a substitution via a replacement symbol.
	 * This function only checks the name and ignores its arguments.
	 * @param lhs the first item to compare
	 * @param rhs the second item to compare
	 * @returns null if there is a conflicting replacement, true if there is a
	 * valid replacement, or false if no replacement occurs
	 */
	private getReplacement(lhs: Formula, rhs: Formula): boolean | null {
		let variable: string | null = null;
		let value: Formula | null = null;

		for (const arg of [lhs, rhs]) {
			const predicate = arg.name;

			if (predicate.startsWith(REPLACEMENT_SYMBOL)) {
				variable = predicate.slice(REPLACEMENT_SYMBOL.length);
			} else {
				value = arg;
			}
		}

		// Add the mapping to the map
		if (variable !== null && value !== null) {
			if (Object.keys(this.assignment).includes(variable)) {
				// Conflicting mappings
				if (!this.assignment[variable].equals(value)) {
					return null;
				}
			} else {
				this.assignment[variable] = value;
			}
		}

		return variable !== null && value !== null;
	}
}
