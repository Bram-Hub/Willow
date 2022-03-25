import {Formula, REPLACEMENT_SYMBOL} from './formula';
import {AssignmentMap} from './util';

export abstract class Statement {
	/**
	 * Determines whether or not this statement is a literal, which is either an
	 * atomic statement or the negation of an atomic statement.
	 * @returns true if this statement is a literal, false otherwise
	 */
	isLiteral(): boolean {
		return (
			this instanceof AtomicStatement ||
			(this instanceof NotStatement && this.operand instanceof AtomicStatement)
		);
	}

	/**
	 * Decomposes this statement into an array of branches, where each branch
	 * contains the necessary decomposed statements.
	 * @returns the decomposed statements by branch
	 */
	abstract decompose(): Statement[][];

	/**
	 * Determines whether or not this statement is equal to another statement.
	 * @param other the other statement
	 * @returns true if this statement is equal to `other`, false otherwise
	 */
	equals(other: Statement): boolean {
		return new StatementEquivalenceEvaluator(this, other).checkEquivalence();
	}

	/**
	 *
	 * @param other the other statement
	 * @returns false if the statements are not equivalent, or the replacement
	 * map used for the variables otherwise
	 */
	getEqualsMap(other: Statement): AssignmentMap | false {
		const evaluator = new StatementEquivalenceEvaluator(this, other);
		if (!evaluator.checkEquivalence()) {
			return false;
		}
		return evaluator.assignment;
	}

	/**
	 * Returns the Set of constants in the formula.
	 * @param symbols the list of non-instantiated symbols
	 * @returns set of constants contained in the formula
	 */
	abstract getConstants(symbols: Formula[]): Formula[];

	/**
	 * Returns the set of Formulas introduced to the universe by this statement,
	 * i.e. returns the set difference (this \ universe)
	 * @param universe the set of Formulas initialized in the universe
	 * @returns the set of Formulas newly initialized by this statement
	 */
	getNewConstants(universe: Formula[]): Formula[] {
		// Grab the constants in this statement
		const constants: Formula[] = this.getConstants([]);

		// Prune values that are in the universe already
		for (const constant of universe) {
			for (let index = 0; index < constants.length; ++index) {
				if (constant.equals(constants[index])) {
					constants.splice(index, 1);
					break;
				}
			}
		}

		return constants;
	}

	/**
	 * Determines whether or not the given list of branches is a correct
	 * decomposition of this statement.
	 * @param branches the antecedent of this statement
	 */
	hasDecomposition(branches: Statement[][]): boolean {
		const expectedDecomposition = this.decompose();

		// Must have the same number of branches
		if (branches.length !== expectedDecomposition.length) {
			return false;
		}

		for (let i = 0; i < branches.length; i++) {
			// Every branch of the expected decomp must be represented by
			// exactly one branch of the given decomp
			for (let j = 0; j < expectedDecomposition.length; j++) {
				let match = true;
				const needToMatch = new Set<number>();

				for (const expectedStatement of expectedDecomposition[j]) {
					let innerMatch = false;
					let index = 0;
					for (index = 0; index < branches[i].length; ++index) {
						const statement = branches[i][index];
						if (statement.equals(expectedStatement)) {
							innerMatch = true;
							needToMatch.add(index);
						}
					}

					if (!innerMatch) {
						match = false;
						break;
					}
				}

				if (match && needToMatch.size === branches[i].length) {
					branches.splice(i--, 1);
					expectedDecomposition.splice(j, 1);
					break;
				}
			}
		}

		return branches.length === 0;
	}

	/**
	 * Replaces the given variables from the argument within the statement to a
	 * symbolized version as specified by the other argument.
	 * @param variables the variables to symbolize
	 * @param symbol the special symbol to modify the variables
	 */
	abstract symbolized(variables: Formula[], symbol: string): Statement;

	/**
	 * Converts this statement to a string.
	 * @returns the string representation of this statement
	 */
	abstract toString(): string;
}

export class Tautology extends Statement {
	decompose(): Statement[][] {
		return [];
	}

	equals(other: Statement) {
		return other instanceof Tautology;
	}

	getConstants() {
		return [];
	}

	symbolized() {
		return this;
	}

	toString() {
		return '⊤';
	}
}

export class Contradiction extends Statement {
	decompose(): Statement[][] {
		return [];
	}

	equals(other: Statement) {
		return other instanceof Contradiction;
	}

	getConstants() {
		return [];
	}

	symbolized() {
		return this;
	}

	toString() {
		return '⊥';
	}
}

export class AtomicStatement extends Statement {
	formula: Formula;

	/**
	 * Constructs a new `AtomicStatement`, which is represented by a formula.
	 * @param formula the formula representing this statement
	 */
	constructor(formula: Formula) {
		super();
		this.formula = formula;
	}

	decompose(): Statement[][] {
		return [];
	}

	getConstants(symbols: Formula[] = []) {
		return this.formula.getConstants(symbols);
	}

	symbolized(variables: Formula[], symbol: string) {
		return new AtomicStatement(this.formula.symbolized(variables, symbol));
	}

	toString() {
		return this.formula.toString();
	}
}

export abstract class UnaryStatement extends Statement {
	operand: Statement;

	/**
	 * Constructs a new `UnaryStatement`, which is composed of exactly one
	 * operand.
	 * @param operand the operand which composes this statement
	 */
	constructor(operand: Statement) {
		super();
		this.operand = operand;
	}

	getConstants(symbols: Formula[] = []) {
		return this.operand.getConstants(symbols);
	}
}

export class NotStatement extends UnaryStatement {
	constructor(operand: Statement) {
		super(operand);
	}

	decompose(): Statement[][] {
		if (this.operand instanceof NotStatement) {
			return [[this.operand.operand]];
		}
		if (this.operand instanceof AndStatement) {
			return this.operand.operands.map(operand => [new NotStatement(operand)]);
		}
		if (this.operand instanceof OrStatement) {
			return [this.operand.operands.map(operand => new NotStatement(operand))];
		}
		if (this.operand instanceof ConditionalStatement) {
			return [[this.operand.lhs, new NotStatement(this.operand.rhs)]];
		}
		if (this.operand instanceof BiconditionalStatement) {
			return [
				[this.operand.lhs, new NotStatement(this.operand.rhs)],
				[new NotStatement(this.operand.lhs), this.operand.rhs],
			];
		}
		if (this.operand instanceof ExistenceStatement) {
			return [
				[
					new UniversalStatement(
						this.operand.variables,
						new NotStatement(this.operand.formula)
					),
				],
			];
		}
		if (this.operand instanceof UniversalStatement) {
			return [
				[
					new ExistenceStatement(
						this.operand.variables,
						new NotStatement(this.operand.formula)
					),
				],
			];
		}
		// Negations of a literal do not have a decomposition
		return [];
	}

	symbolized(variables: Formula[], symbol: string) {
		return new NotStatement(this.operand.symbolized(variables, symbol));
	}

	toString() {
		return `¬${this.operand}`;
	}
}

export abstract class BinaryStatement extends Statement {
	lhs: Statement;
	rhs: Statement;

	/**
	 * Constructs a new `BinaryStatement`, which is composed of exactly two
	 * operands.
	 * @param lhs the left-hand side operand
	 * @param rhs the right-hand side operand
	 */
	constructor(lhs: Statement, rhs: Statement) {
		super();
		this.lhs = lhs;
		this.rhs = rhs;
	}

	getConstants(symbols: Formula[] = []) {
		const constants = this.lhs.getConstants(symbols);
		for (const constant of this.rhs.getConstants(symbols)) {
			if (constants.some(element => element.equals(constant))) {
				continue;
			}
			constants.push(constant);
		}
		return constants;
	}
}

export class ConditionalStatement extends BinaryStatement {
	constructor(lhs: Statement, rhs: Statement) {
		super(lhs, rhs);
	}

	decompose() {
		return [[new NotStatement(this.lhs)], [this.rhs]];
	}

	symbolized(variables: Formula[], symbol: string) {
		return new ConditionalStatement(
			this.lhs.symbolized(variables, symbol),
			this.rhs.symbolized(variables, symbol)
		);
	}

	toString() {
		return `(${this.lhs} → ${this.rhs})`;
	}
}

export class BiconditionalStatement extends BinaryStatement {
	constructor(lhs: Statement, rhs: Statement) {
		super(lhs, rhs);
	}

	decompose() {
		return [
			[this.lhs, this.rhs],
			[new NotStatement(this.lhs), new NotStatement(this.rhs)],
		];
	}

	symbolized(variables: Formula[], symbol: string) {
		return new BiconditionalStatement(
			this.lhs.symbolized(variables, symbol),
			this.rhs.symbolized(variables, symbol)
		);
	}

	toString() {
		return `(${this.lhs} ↔ ${this.rhs})`;
	}
}

export abstract class CommutativeStatement extends Statement {
	operands: Statement[];

	/**
	 * Constructs a new `CommutativeStatement`, which is composed of multiple
	 * operands.
	 * @param operands the operands that compose this statement
	 */
	constructor(...operands: Statement[]) {
		super();
		this.operands = operands;
	}

	getConstants(symbols: Formula[] = []) {
		const constants: Formula[] = [];
		for (const operand of this.operands) {
			for (const constant of operand.getConstants(symbols)) {
				if (constants.some(element => element.equals(constant))) {
					continue;
				}
				constants.push(constant);
			}
		}
		return constants;
	}
}

export class AndStatement extends CommutativeStatement {
	constructor(...operands: Statement[]) {
		super(...operands);
	}

	decompose() {
		return [this.operands];
	}

	symbolized(variables: Formula[], symbol: string) {
		return new AndStatement(
			...this.operands.map(operand => operand.symbolized(variables, symbol))
		);
	}

	toString() {
		return `(${this.operands.join(' ∧ ')})`;
	}
}

export class OrStatement extends CommutativeStatement {
	constructor(...operands: Statement[]) {
		super(...operands);
	}

	decompose() {
		return this.operands.map(operand => [operand]);
	}

	symbolized(variables: Formula[], symbol: string) {
		return new OrStatement(
			...this.operands.map(operand => operand.symbolized(variables, symbol))
		);
	}

	toString() {
		return `(${this.operands.join(' ∨ ')})`;
	}
}

export abstract class QuantifierStatement extends Statement {
	variables: Formula[];
	formula: Statement;

	constructor(variables: Formula[], formula: Statement) {
		super();
		this.variables = variables;
		this.formula = formula;
	}

	getConstants(symbols: Formula[] = []) {
		const all_symbols = symbols;
		for (const variable of this.variables) {
			if (all_symbols.some(element => element.equals(variable))) {
				continue;
			}
			all_symbols.push(variable);
		}
		return this.formula.getConstants(all_symbols);
	}

	symbolized(): Statement {
		return this.formula.symbolized(this.variables, REPLACEMENT_SYMBOL);
	}
}

export class ExistenceStatement extends QuantifierStatement {
	constructor(variables: Formula[], formula: Statement) {
		super(variables, formula);
	}

	decompose() {
		return [[this.symbolized()]];
	}

	symbolized(variables: Formula[] = []): Statement {
		if (variables.length === 0) {
			return this.formula.symbolized(this.variables, REPLACEMENT_SYMBOL);
		}

		return new ExistenceStatement(
			this.variables,
			this.formula.symbolized(variables, REPLACEMENT_SYMBOL)
		);
	}

	toString() {
		return `(∃${this.variables.join(',')} ${this.formula})`;
	}
}

export class UniversalStatement extends QuantifierStatement {
	constructor(variables: Formula[], formula: Statement) {
		super(variables, formula);
	}

	decompose() {
		return [[this.symbolized()]];
	}

	symbolized(variables: Formula[] = []): Statement {
		if (variables.length === 0) {
			return this.formula.symbolized(this.variables, REPLACEMENT_SYMBOL);
		}

		return new UniversalStatement(
			this.variables,
			this.formula.symbolized(variables, REPLACEMENT_SYMBOL)
		);
	}

	toString() {
		return `(∀${this.variables.join(',')} ${this.formula})`;
	}
}

class StatementEquivalenceEvaluator {
	lhs: Statement;
	rhs: Statement;
	assignment: AssignmentMap = {};

	constructor(lhs: Statement, rhs: Statement) {
		this.lhs = lhs;
		this.rhs = rhs;
	}

	checkEquivalence(): boolean {
		return this.checkEquivalenceHelper(this.lhs, this.rhs);
	}

	private checkEquivalenceHelper(lhs: Statement, rhs: Statement): boolean {
		if (lhs instanceof AtomicStatement && rhs instanceof AtomicStatement) {
			return lhs.formula.isMappedEquals(rhs.formula, this.assignment);
		}

		// Unary Statements
		if (lhs instanceof NotStatement && rhs instanceof NotStatement) {
			return this.checkEquivalenceHelper(lhs.operand, rhs.operand);
		}

		// Binary Statements
		if (
			lhs instanceof ConditionalStatement &&
			rhs instanceof ConditionalStatement
		) {
			return (
				this.checkEquivalenceHelper(lhs.lhs, rhs.lhs) &&
				this.checkEquivalenceHelper(lhs.rhs, rhs.rhs)
			);
		}
		if (
			lhs instanceof BiconditionalStatement &&
			rhs instanceof BiconditionalStatement
		) {
			return (
				this.checkEquivalenceHelper(lhs.lhs, rhs.lhs) &&
				this.checkEquivalenceHelper(lhs.rhs, rhs.rhs)
			);
		}

		// Commutative Statements
		if (lhs instanceof AndStatement && rhs instanceof AndStatement) {
			return lhs.operands.every((operand, index) =>
				this.checkEquivalenceHelper(operand, rhs.operands[index])
			);
		}
		if (lhs instanceof OrStatement && rhs instanceof OrStatement) {
			return lhs.operands.every((operand, index) =>
				this.checkEquivalenceHelper(operand, rhs.operands[index])
			);
		}

		// Quantifier Statements
		if (
			lhs instanceof ExistenceStatement &&
			rhs instanceof ExistenceStatement
		) {
			return (
				lhs.variables.every((variable, index) =>
					variable.equals(rhs.variables[index])
				) && this.checkEquivalenceHelper(lhs.formula, rhs.formula)
			);
		}
		if (
			lhs instanceof UniversalStatement &&
			rhs instanceof UniversalStatement
		) {
			return (
				lhs.variables.every((variable, index) =>
					variable.equals(rhs.variables[index])
				) && this.checkEquivalenceHelper(lhs.formula, rhs.formula)
			);
		}

		// This means they had not matching types, which are clearly not equivalent
		return false;
	}
}
