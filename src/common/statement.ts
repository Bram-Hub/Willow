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
	 * Determines whether or not this statement is a logical consequence of the
	 * antecedent with respect to its decomposition.
	 * @param antecedent the antecedent of this statement
	 */
	inDecompositionOf(antecedent: Statement): boolean {
		return antecedent
			.decompose()
			.some(branch => branch.some(statement => this.equals(statement)));
	}

	/**
	 * Determines whether or not this statement is equal to another statement.
	 * @param other the other statement
	 * @returns true if this statement is equal to `other`, false otherwise
	 */
	abstract equals(other: Statement): boolean;

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

	toString() {
		return '⊥';
	}
}

export class AtomicStatement extends Statement {
	identifier: string;

	/**
	 * Constructs a new `AtomicStatement`, which is represented by an identifier.
	 * @param identifier the identifier representing this statement
	 */
	constructor(identifier: string) {
		super();
		this.identifier = identifier;
	}

	decompose(): Statement[][] {
		return [];
	}

	equals(other: Statement): boolean {
		return (
			other instanceof AtomicStatement && this.identifier === other.identifier
		);
	}

	toString() {
		return this.identifier;
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
		// Negations of a literal do not have a decomposition
		return [];
	}

	equals(other: Statement): boolean {
		return other instanceof NotStatement && this.operand.equals(other.operand);
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
}

export class ConditionalStatement extends BinaryStatement {
	constructor(lhs: Statement, rhs: Statement) {
		super(lhs, rhs);
	}

	decompose() {
		return [[new NotStatement(this.lhs)], [this.rhs]];
	}

	equals(other: Statement) {
		return (
			other instanceof ConditionalStatement &&
			this.lhs.equals(other.lhs) &&
			this.rhs.equals(other.rhs)
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

	equals(other: Statement) {
		return (
			other instanceof BiconditionalStatement &&
			this.lhs.equals(other.lhs) &&
			this.rhs.equals(other.rhs)
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
}

export class AndStatement extends CommutativeStatement {
	constructor(...operands: Statement[]) {
		super(...operands);
	}

	decompose() {
		return [this.operands];
	}

	equals(other: Statement) {
		return (
			other instanceof AndStatement &&
			this.operands.length === other.operands.length &&
			this.operands.every((operand, index) =>
				operand.equals(other.operands[index])
			)
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

	equals(other: Statement) {
		return (
			other instanceof OrStatement &&
			this.operands.length === other.operands.length &&
			this.operands.every((operand, index) =>
				operand.equals(other.operands[index])
			)
		);
	}

	toString() {
		return `(${this.operands.join(' ∨ ')})`;
	}
}
