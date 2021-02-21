import {PL_Parser} from './parser';
import {Statement, AtomicStatement, NotStatement} from './statement';

class TruthTreeNode {
	id: number;

	private _text = '';
	private _statement: Statement | null = null;
	premise = false;

	tree: TruthTree;

	parent: number | null = null;
	children: number[] = [];

	antecedent: number | null = null;
	decomposition: Set<number> = new Set();
	private _correctDecomposition: Set<number> | null = null;

	/**
	 * Constructs a new `TruthTreeNode` in a `TruthTree`.
	 * @param id the id of this node
	 * @param tree the tree that contains this node
	 */
	constructor(id: number, tree: TruthTree) {
		this.id = id;
		this.tree = tree;
	}

	static fromJSON(
		tree: TruthTree,
		jsonObject: {[key: string]: string | boolean | number | number[]}
	): TruthTreeNode {
		// Check for necessary properties
		if (!('id' in jsonObject && typeof jsonObject.id === 'number')) {
			throw new Error('TruthTreeNode#fromJSON: id not found.');
		}

		const newNode = new TruthTreeNode(jsonObject.id, tree);

		if (!('text' in jsonObject && typeof jsonObject.text === 'string')) {
			throw new Error('TruthTreeNode#fromJSON: text not found.');
		}
		newNode.text = jsonObject.text;

		if (
			!(
				'children' in jsonObject &&
				typeof jsonObject.children === 'object' &&
				Array.isArray(jsonObject.children)
			)
		) {
			throw new Error('TruthTreeNode#fromJSON: children not found.');
		}
		newNode.children = jsonObject.children;

		if (
			!(
				'decomposition' in jsonObject &&
				typeof jsonObject.decomposition === 'object' &&
				Array.isArray(jsonObject.decomposition) &&
				jsonObject.decomposition.every(element => typeof element === 'number')
			)
		) {
			throw new Error('TruthTreeNode#fromJSON: decomposition not found.');
		}
		newNode.decomposition = new Set(jsonObject.decomposition);

		// Check for optional properties
		if ('premise' in jsonObject && typeof jsonObject.premise === 'boolean') {
			newNode.premise = jsonObject.premise;
		}

		if ('parent' in jsonObject && typeof jsonObject.parent === 'number') {
			newNode.parent = jsonObject.parent;
		}

		if (
			'antecedent' in jsonObject &&
			typeof jsonObject.antecedent === 'number'
		) {
			newNode.antecedent = jsonObject.antecedent;
		}

		return newNode;
	}

	get text() {
		return this._text;
	}

	set text(newText: string) {
		this._text = newText;
		try {
			this.statement = this.tree.parser.parse(this.text);
		} catch (err) {
			this.statement = null;
		}
	}

	get statement() {
		return this._statement;
	}

	set statement(newStatement: Statement | null) {
		this._statement = newStatement;
		this.correctDecomposition = null;
	}

	/**
	 * Calculates the set of nodes which create the branch(es)
	 * required to correctly decompose this statement.
	 *
	 * Note that this function guarantees a Set<number>,
	 * but Typescript requires that getters and setters
	 * have the same type.
	 *
	 * @returns the set of node IDs that form a complete
	 * decomposition of this node.
	 */
	get correctDecomposition(): Set<number> | null {
		if (this.statement === null) {
			return new Set<number>();
		}

		// Return the cached version if it exists
		if (this._correctDecomposition !== null) {
			return this._correctDecomposition;
		}

		// Otherwise generate a new set
		this._correctDecomposition = new Set<number>();
		const visited: Set<number> = new Set();

		for (const nodeId of this.decomposition) {
			// Don't pass over the same node twice
			if (visited.has(nodeId)) {
				continue;
			}

			// Only perform traversal on nodes whose parents are not in the decomposition.
			const node = this.tree.nodes[nodeId];
			if (node.parent === null) {
				throw new Error(
					`The result of a decomposition has no parent. See node ${nodeId}`
				);
			}

			// Can change this later to be more flexible wrt where the decomposition can occur
			// within the branch itself
			if (this.decomposition.has(node.parent)) {
				visited.add(nodeId);
				continue;
			}

			// Otherwise the decomposition does not include parent

			// Collect the branches that make up the decomposition including this node.
			const branches: Statement[][] = [];
			const branchIds: number[] = [];
			let isCorrect = true;

			for (const childId of this.tree.nodes[node.parent].children) {
				// If this child has already been visited, then this branch is already explored
				// but this should never happen
				if (visited.has(childId)) {
					throw new Error('Reached an already visited node in child branch.');
				}
				const thisBranch: Statement[] = [];
				// Collect nodes in this branch, descending
				let current: TruthTreeNode = this.tree.nodes[childId];
				let isLastBeforeSplit = current.children.length !== 1;

				while (current.children.length === 1 || isLastBeforeSplit) {
					// Only add nodes that are marked as part of the decomposition.
					if (this.decomposition.has(current.id)) {
						// This node has now been visited
						visited.add(current.id);

						// Invalid/empty statements cannot form part of a correct decomposition
						if (current.statement === null) {
							isCorrect = false;
						} else if (isCorrect) {
							// This is a part of the decomposition, so add them
							thisBranch.push(current.statement);
							branchIds.push(current.id);
						}
					}

					if (isLastBeforeSplit) {
						break;
					}

					current = this.tree.nodes[current.children[0]];
					isLastBeforeSplit = current.children.length !== 1;
				}
				if (!isCorrect) {
					continue;
				}

				branches.push(thisBranch);
			}
			if (!isCorrect) {
				continue;
			}

			// Validate if the branches form a correct decomposition
			if (this.statement.hasDecomposition(branches)) {
				for (const id of branchIds) {
					this._correctDecomposition.add(id);
				}
			}
		}

		return this._correctDecomposition;
	}

	set correctDecomposition(newCorrectDecomposition: Set<number> | null) {
		this._correctDecomposition = newCorrectDecomposition;
	}

	/**
	 * Determines whether or not this statement is valid; i.e., it is a logical
	 * consequence of some other statement in the truth tree.
	 * @returns true if this statement is valid, false otherwise
	 */
	isValid(): boolean {
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

		if (this.statement === null) {
			// If the text could not be parsed into a statement, then the statement is
			// valid if and only if the text is empty
			return this.text.trim().length === 0;
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

		if (!this.getAncestorBranch().has(this.antecedent)) {
			// The antecedent must be in the ancestor branch
			return false;
		}

		return antecedentNode.correctDecomposition!.has(this.id);
	}

	/**
	 * Determines whether or not this node is valid assuming it is an open
	 * terminator. An open terminator is valid if and only if every statement from
	 * the root of the tree to the terminator is both valid and decomposed.
	 * @returns true if this open terminator is valid, false otherwise
	 */
	private isOpenTerminatorValid(): boolean {
		// Keep track of every Atomic and negation of an Atomic
		const contradictionMap: Set<string> = new Set();

		for (const ancestorId of this.getAncestorBranch()) {
			const ancestorNode = this.tree.nodes[ancestorId];
			const ancestorStatement = ancestorNode.statement;

			// Check for contradictions in the branch
			if (
				ancestorStatement instanceof AtomicStatement ||
				(ancestorStatement instanceof NotStatement &&
					ancestorStatement.operand instanceof AtomicStatement)
			) {
				// If there is a contradiction, it's invalid
				if (contradictionMap.has(ancestorStatement.toString())) {
					return false;
				}

				// Otherwise, store this statement for possible future contradictions
				if (ancestorStatement instanceof AtomicStatement) {
					contradictionMap.add(new NotStatement(ancestorStatement).toString());
				} else {
					contradictionMap.add(ancestorStatement.operand.toString());
				}
			}

			// Check if each ancestor is valid and decomposed
			if (!ancestorNode.isValid() || !ancestorNode.isDecomposed()) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Determines whether or not this node is valid assuming it is a closed
	 * terminator. A closed terminator is valid if and only if the two statements
	 * that it references are a literal and its negation and are both valid.
	 * @returns true if this closed terminator is valid, false otherwise
	 */
	private isClosedTerminatorValid(): boolean {
		// Closed terminators must reference exactly two statements
		if (this.decomposition.size !== 2) {
			return false;
		}

		const decomposed_statements = [...this.decomposition].map(
			id => this.tree.nodes[id].statement
		);

		for (let i = 0; i < 2; ++i) {
			const first = decomposed_statements[i];
			const second = decomposed_statements[1 - i];

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
					if (!ancestorBranch.has(id)) {
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

		// Check if every decomposed node is in a child branch of this node.
		for (const decomposedId of this.decomposition) {
			if (!this.isAncestorOf(decomposedId)) {
				return false;
			}
		}

		// Check if this statement is decomposed in every open branch that contains it
		for (const openTerminatorId of this.tree.leaves) {
			const openTerminatorNode = this.tree.nodes[openTerminatorId];
			if (openTerminatorNode.text !== TruthTree.OPEN_TERMINATOR) {
				continue;
			}

			// Check if this statement is contained in the open branch.
			if (!this.isAncestorOf(openTerminatorId)) {
				continue;
			}

			// Get the branch ending with this terminator
			const openBranch = openTerminatorNode.getAncestorBranch();

			// Check if a node from the correct decomposition is in the
			let containedInBranch = false;
			for (const correctlyDecomposedNode of this.correctDecomposition!) {
				if (openBranch.has(correctlyDecomposedNode)) {
					containedInBranch = true;
				}
			}
			if (!containedInBranch) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Traverses up the tree starting at this node's parent, returning a set of
	 * the ancestors of this node.
	 * @returns a set of ids corresponding to this node's ancestors
	 */
	private getAncestorBranch(): Set<number> {
		const branch = new Set<number>();
		let node: TruthTreeNode = this.tree.nodes[this.id];
		while (node.parent !== null) {
			branch.add(node.parent);
			// Traverse up the tree
			node = this.tree.nodes[node.parent];
		}
		return branch;
	}

	/**
	 * Traverses up the tree starting at other, returning true if this node
	 * appears in the traversal to the root otherwise returning false.
	 * @param otherId the id of the node to start at
	 * @returns whether or not this node is an ancestor of the given node.
	 */
	private isAncestorOf(otherId: number): boolean {
		let node: TruthTreeNode = this.tree.nodes[otherId];

		while (node.parent !== null) {
			node = this.tree.nodes[node.parent];
			if (node.id === this.id) {
				return true;
			}
		}

		return false;
	}
}

export class TruthTree {
	static readonly OPEN_TERMINATOR = '◯';
	static readonly CLOSED_TERMINATOR = '×';
	static readonly TERMINATORS = [
		TruthTree.OPEN_TERMINATOR,
		TruthTree.CLOSED_TERMINATOR,
	];

	nodes: {[id: number]: TruthTreeNode} = {};
	leaves: Set<number> = new Set();

	parser: PL_Parser = new PL_Parser();

	static deserialize(jsonText: string): TruthTree {
		// throw new Error('TruthTree#deserialize() not implemented');
		const newTree = new TruthTree();

		const parsed = JSON.parse(jsonText);
		if (
			!(
				typeof parsed === 'object' &&
				Array.isArray(parsed) &&
				parsed.length > 0
			)
		) {
			throw new Error('TruthTree#deserialize: The tree is empty.');
		}
		try {
			for (const jsonNode of parsed) {
				const node = TruthTreeNode.fromJSON(newTree, jsonNode);
				if (node.children.length === 0) {
					newTree.leaves.add(node.id);
				}
				newTree.nodes[node.id] = node;
			}
		} catch (e) {
			throw new Error(
				`TruthTree#deserialize: The file does not match the format: ${e.message}`
			);
		}

		return newTree;
	}

	serialize(): string {
		// throw new Error('TruthTree#serialize() not implemented');
		const serializedNodes: {
			[key: string]: string | boolean | number | number[];
		}[] = [];

		for (const node of Object.values(this.nodes)) {
			const serializedNode: {
				[key: string]: string | boolean | number | number[];
			} = {
				id: node.id,
				text: node.text,
				children: node.children,
				decomposition: [...node.decomposition],
			};

			if (node.premise) {
				serializedNode.premise = node.premise;
			}

			if (node.parent) {
				serializedNode.parent = node.parent;
			}

			if (node.antecedent !== null) {
				serializedNode.antecedent = node.antecedent;
			}

			serializedNodes.push(serializedNode);
		}

		return JSON.stringify(serializedNodes);
	}

	/**
	 * Determines whether or not this truth tree is correct.
	 * @returns true if this truth tree is correct, false otherwise
	 */
	isCorrect(): boolean {
		for (const node of Object.values(this.nodes)) {
			if (!node.isValid()) {
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

	printTree() {
		this.printTreeHelper(0, 0);
	}

	private printTreeHelper(currentId: number, depth: number) {
		const current = this.nodes[currentId];

		let output = '';
		for (let i = 0; i < depth; i++) {
			output += '    ';
		}
		output += `(${currentId}) ${current.text}`;
		if (current.premise) {
			output += '\t(premise)';
		}

		console.log(output);

		if (current.children.length === 0) {
			console.log();
			return;
		}
		if (current.children.length === 1) {
			this.printTreeHelper(current.children[0], depth);
			return;
		}
		for (const childId of current.children) {
			this.printTreeHelper(childId, depth + 1);
		}
	}
}
