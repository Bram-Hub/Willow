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
				// connor code here
			}
			// closed branch

			// connor code here
		}

		// connor code here
	}

	isDecomposed(): boolean {
		if (this.statement === null) {
			return this.text === '';
		}

		const expectedDecomposition = this.statement.decompose();

		if (expectedDecomposition.length === 0) {
			// no decomposition means it is vacuously decomposed
			return true;
		}

		// ensure the decomposition is in every open branch
		for (const openTermId of this.tree.leaves) {
			const openTerm = this.tree.nodes[openTermId];

			// only check open branches
			if (openTerm.text !== TruthTree.OPEN_TERMINATOR) {
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
		let current: TruthTreeNode = this.tree.nodes[this.id];
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
