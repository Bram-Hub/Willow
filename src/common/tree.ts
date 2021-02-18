import {PL_Parser} from './parser';
import {Statement, AtomicStatement, UnaryStatement, NotStatement, BinaryStatement, ConditionalStatement, BiconditionalStatement, CommutativeStatement, AndStatement, OrStatement} from './statement';

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

	isValid(): boolean {
		if (this.statement === null) {
			return this.text.trim() === "";
		}

		if (this.premise) {
			// Premises are always valid
			return true;
		}

		// terminators are a special case
		if (TruthTree.TERMINATORS.includes(this.text)) {
			if (this.text === TruthTree.OPEN_TERMINATOR) {
				// open branch

				let current: TruthTreeNode = this;
				while (current.parent !== null) {
					current = this.tree.nodes[current.parent];
					console.log(`Now checking '${current.statement}' for decomposition and validity`);

					if (!current.isValid() || !current.isDecomposed()) {
						return false;
					}
				}

				return true;
			}
			// closed branch

			// requires exactly 2 statements
			if (this.decomposition.length !== 2) {
				// print("ERROR: closed_reference_length")
				return false;
			}

			console.log(`Checking if nodes (${this.decomposition.join(', ')}) form a valid contradiction.`);

			for (let i = 0; i < 2; ++i) {
				const a = this.tree.nodes[this.decomposition[i]].statement;
				const b = this.tree.nodes[this.decomposition[i-1]].statement;
				if (a === null || b === null) {
					return false;
				}

				if (a instanceof NotStatement && a.operand.equals(b)) {
					if (!(b instanceof AtomicStatement)) {
						// print(f"Invalid: Contradiction must occur on atomic statements.")
						return false;
					}

					const thisBranch = this.getAncestorBranch();

					const invalidNodes : number[] = [];
					for (const contradictor of this.decomposition) {
						if (!thisBranch.includes(contradictor)) {
							invalidNodes.push(contradictor);
						}
					}

					if (invalidNodes.length > 0) {
						// print(f"Invalid: node(s) {', '.join(invalid_nodes)} are not in the closed branch.")
						return false;
					}

					// all contradictory nodes must be valid in order to create a contradiction
					for (const nodeId of this.decomposition) {
						if (!this.tree.nodes[nodeId].isValid()) {
							return false;
						}
					}
					return true;
				}
			}
			// print(f"Invalid: Contradictions do not match")
			return false;
		}

		// connor merge your fixes here
	}

	isDecomposed(): boolean {
		const parsed = this.tree.parseNodeStatement(this.id);
		const expectedDecomp = parsed.decompose();

		if (expectedDecomp === []) {
			// no decomposition means it is vacuously decomposed
			return true;
		}

		// ensure the decomposition is in every open branch
		for (const openTermId of this.tree.leaves) {
			const openTerm = this.tree.nodes[openTermId];

			// only check open branches
			if (openTerm.statement !== TruthTree.OPEN_TERMINATOR) {
				continue;
			}

			// get the branch ending with this terminator
			const branch = openTerm.getAncestorBranch();

			// if any of the nodes from the decomposition are in this branch, it's decomposed
			let decomposed = false;
			for (const nodeId of this.decomposition) {
				decomposed ||= branch.includes(nodeId);
			}

			if (!decomposed) {
				// print(f"Invalid: node {self.node_id} not decomposed for node {open_term_id}.")
				return false;
			}
		}

		return true;
	}

	getAncestorBranch(): number[] {
		const branch: number[] = [this.id];
		let current: TruthTreeNode = this;
		while (current.parent !== null) {
			branch.push(current.parent);
			current = this.tree.nodes[current.parent];
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

	fromWillowFile() {
		// for loading a truth tree...
	}

	/**
	 * Determines whether or not this truth tree is correct.
	 * @returns true if this truth tree is correct, false otherwise
	 */
	isCorrect(): boolean {
		for (const leaf of this.leaves) {
			const leafNode = this.nodes[leaf];
			if (!TruthTree.TERMINATORS.includes(leafNode.statement)) {
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

	parseNodeStatement(nodeId): Statement {
		// parses the statement at node `nodeId`
		return this.parser.parse(this.nodes[nodeId].statement);
	}
}
