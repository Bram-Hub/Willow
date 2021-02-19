import {PL_Parser} from './parser';
import {
	Statement,
	AtomicStatement,
	UnaryStatement,
	NotStatement,
	BinaryStatement,
	ConditionalStatement,
	BiconditionalStatement,
	CommutativeStatement,
	AndStatement,
	OrStatement,
} from './statement';

class TruthTreeNode {
	id: number;

	private _text = '';
	statement: Statement | null = null;
	premise = false;

	tree: TruthTree;

	parent: number | null = null;
	children: number[] = [];

	antecedent: number | null = null;
	decomposition: number[] = [];

	/**
	 * Constructs a new `TruthTreeNode` in a `TruthTree`.
	 * @param id the id of this node
	 * @param tree the tree that contains this node
	 */
	constructor(id: number, tree: TruthTree) {
		this.id = id;
		this.tree = tree;
	}

	get text() {
		return this._text;
	}

	set text(newText: string) {
		this.text = newText;
		try {
			this.statement = this.tree.parser.parse(this.text);
		} catch (err) {
			this.statement = null;
		}
	}

	/**
	 * Determines whether or not this statement is valid; i.e., it is a logical
	 * consequence of some other statement in the truth tree.
	 * @returns true if this statement is valid, false otherwise
	 */
	isValid(): boolean {
		if (this.statement === null) {
			// If the text could not be parsed into a statement, then the statement is
			// valid if and only if the text is empty
			return this.text.trim().length === 0;
		}

		if (this.premise) {
			// Premises are always valid
			return true;
		}

		if (TruthTree.TERMINATORS.includes(this.text)) {
			if (this.text === TruthTree.OPEN_TERMINATOR) {
				return this.isOpenTerminatorValid();
			}
			// this.text === TruthTree.CLOSED_TERMINATOR
			return this.isClosedTerminatorValid();
		}

		// Non-premises must have an antecedent for this statement to be valid
		if (this.antecedent === null || !(this.antecedent in this.tree.nodes)) {
			return false;
		}
		const antecedentNode = this.tree.nodes[this.antecedent];
		// The antecedent must have been successfully parsed into a statement
		if (antecedentNode.statement === null) {
			return false;
		}
		return this.statement.inDecompositionOf(antecedentNode.statement);
	}

	/**
	 * Determines whether or not this node is valid assuming it is an open
	 * terminator. An open terminator is valid if and only if every statement from
	 * the root of the tree to the terminator is both valid and decomposed.
	 * @returns true if this open terminator is valid, false otherwise
	 */
	private isOpenTerminatorValid(): boolean {
		return this.getAncestorBranch()
			.map(id => this.tree.nodes[id])
			.every(
				ancestorNode => ancestorNode.isValid() && ancestorNode.isDecomposed()
			);
	}

	/**
	 * Determines whether or not this node is valid assuming it is a closed
	 * terminator. A closed terminator is valid if and only if the two statements
	 * that it references are a literal and its negation and are both valid.
	 * @returns true if this closed terminator is valid, false otherwise
	 */
	private isClosedTerminatorValid(): boolean {
		// Closed terminators must reference exactly two statements
		if (this.decomposition.length !== 2) {
			return false;
		}

		for (let i = 0; i < 2; ++i) {
			const first = this.tree.nodes[this.decomposition[i]].statement;
			const second = this.tree.nodes[this.decomposition[1 - i]].statement;
			if (first === null || second === null) {
				return false;
			}

			// The referenced statements must be an atomic and its negation
			if (first instanceof NotStatement && first.operand.equals(second)) {
				if (!(second instanceof AtomicStatement)) {
					return false;
				}

				// The referenced statements must also be ancestors of the closed
				// terminator and valid
				const ancestorBranch = this.getAncestorBranch();
				for (const id of this.decomposition) {
					if (!ancestorBranch.includes(id)) {
						return false;
					}
					if (!this.tree.nodes[id].isValid()) {
						return false;
					}
				}
				return true;
			}
		}
		return false;
	}

	/**
	 * Determines whether or not this statement is fully decomposed in every open
	 * branch.
	 * @returns true if this statement is decomposed, false otherwise
	 */
	isDecomposed(): boolean {
		if (this.statement === null) {
			// If the text could not be parsed into a statement, then the statement is
			// decomposed if and only if the text is empty
			return this.text.trim().length === 0;
		}

		const expectedDecomposition = this.statement.decompose();
		if (expectedDecomposition.length === 0) {
			// A statement with no decomposition is vacuously decomposed
			return true;
		}

		// Check if this statement is decomposed in every open branch
		for (const openTerminatorId of this.tree.leaves) {
			const openTerminatorNode = this.tree.nodes[openTerminatorId];
			if (openTerminatorNode.text !== TruthTree.OPEN_TERMINATOR) {
				continue;
			}

			// Get the branch ending with this terminator
			const branch = openTerminatorNode.getAncestorBranch();

			// If this (open) branch does not contain any of the nodes in the
			// decomposition, then this statement is not fully decomposed
			if (!this.decomposition.some(id => branch.includes(id))) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Traverses up the tree starting at this node's parent, returning a list of
	 * the ancestors of this node (starting with the parent and ending with the
	 * most distant ancestor).
	 * @returns an array of ids corresponding to this node's ancestors
	 */
	getAncestorBranch(): number[] {
		const branch: number[] = [];
		let node: TruthTreeNode = this.tree.nodes[this.id];
		while (node.parent !== null) {
			branch.push(node.parent);
			// Traverse up the tree
			node = this.tree.nodes[node.parent];
		}
		return branch;
	}
}

class TruthTree {
	static readonly OPEN_TERMINATOR = '◯';
	static readonly CLOSED_TERMINATOR = '×';
	static readonly TERMINATORS = [
		TruthTree.OPEN_TERMINATOR,
		TruthTree.CLOSED_TERMINATOR,
	];

	nodes: {[id: number]: TruthTreeNode} = {};
	leaves: Set<number> = new Set();

	parser: PL_Parser = new PL_Parser();

	/**
	 * Determines whether or not this truth tree is correct.
	 * @returns true if this truth tree is correct, false otherwise
	 */
	isCorrect(): boolean {
		for (const leafId of this.leaves) {
			const leafNode = this.nodes[leafId];
			if (!TruthTree.TERMINATORS.includes(leafNode.text)) {
				// All branches in a correct truth tree must terminate with a terminator
				return false;
			}
			if (!leafNode.isValid()) {
				// All terminators in a correct truth tree must be valid
				return false;
			}
		}
		return true;
	}

	/**
	 * Determines whether or not this truth tree is valid; i.e., it satisfies the
	 * representation invariant. For example, the decomposition of every node's
	 * antecedent must contain the node itself.
	 * @return true if this truth tree is valid, false otherwise
	 */
	isValid(): boolean {
		throw new Error('TruthTree#isValid() not implemented');
	}
}
