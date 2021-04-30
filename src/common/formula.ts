export const REPLACEMENT_SYMBOL = '.';

interface AssignmentMap {
	[variable: string]: string;
}

export class Formula {
	predicate: string;
	args: Formula[] | null;

	/**
	 * Constructs a new `Formula`, which is represented by a predicate and its arguments.
	 * @param predicate the function symbol in the formula or the variable itself
	 * @param args the arguments to this predicate or null if the predicate is a variable
	 */
	constructor(predicate: string, args: Formula[] | null = null) {
		this.predicate = predicate;
		this.args = args;
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
	getConstants(symbols: Formula[] = []): Formula[] {
		const constants: Formula[] = [];

		if (this.args === null) {
			// No args means this must be a constant
			if (!symbols.some(symbol => symbol.equals(this))) {
				// Not a non-instantiated symbol, so it's a constant
				constants.push(this);
			}
		} else {
			// Only add the atomic literals -- this is most likely incorrect as
			// it ignores functions as constants
			for (const arg of this.args) {
				for (const constant of arg.getConstants(symbols)) {
					let conflict = false;
					for (const prefound of constants) {
						if (prefound.equals(constant)) {
							conflict = true;
							break;
						}
					}
					if (!conflict) {
						constants.push(constant);
					}
				}
			}
		}

		return constants;
	}

	/**
	 * Determines whether or not this formula is equal to another formula given
	 * a partially formed mapping of symbolized variables to instantiated
	 * variables.
	 * @param other the other statement
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
	 * Symbolizes the given variables in the formula.
	 * @param variables the variables to modify
	 * @param symbol the symbol that modifies the variables
	 */
	symbolized(variables: Formula[], symbol: string): Formula {
		let newPredicate = this.predicate;

		// Symbolize the predicate if necessary
		if (variables.some(variable => variable.predicate === this.predicate)) {
			// newPredicate = symbol;
			newPredicate = `${symbol}${this.predicate}`;
		}

		// Symbolize each of the args
		return new Formula(
			newPredicate,
			this.args?.map(arg => arg.symbolized(variables, symbol))
		);
	}

	/**
	 * Converts this statement to a string.
	 * @returns the string representation of this statement
	 */
	toString(): string {
		if (this.args === null) {
			return this.predicate;
		}
		return `${this.predicate}(${this.args.join(',')})`;
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

		// The predicates must match
		if (hadReplacement === false && lhs.predicate !== rhs.predicate) {
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
	 *
	 * @param lhs the first item to compare
	 * @param rhs the second item to compare
	 * @returns null if there is a conflicting replacement, true if there is a
	 * valid replacement, or false if no replacement occurs
	 */
	private getReplacement(lhs: Formula, rhs: Formula): boolean | null {
		let variable: string | null = null;
		let value: string | null = null;

		for (const arg of [lhs, rhs]) {
			const predicate = arg.predicate;

			if (predicate.startsWith(REPLACEMENT_SYMBOL)) {
				variable = predicate.slice(REPLACEMENT_SYMBOL.length);
			} else {
				value = arg.toString();
			}
		}

		// Add the mapping to the map
		if (variable !== null && value !== null) {
			if (Object.keys(this.assignment).includes(variable)) {
				// Conflicting mappings
				if (this.assignment[variable] !== value) {
					return null;
				}
			} else {
				this.assignment[variable] = value;
			}
		}

		return variable !== null && value !== null;
	}
}