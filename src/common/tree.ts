import {PropositionalLogicParser} from './parser';
import {Statement, AtomicStatement, NotStatement} from './statement';

interface Response {
	[id: number]: string;
}

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
		this._text = newText.trim();
		try {
			this.statement = new PropositionalLogicParser().parse(this.text);
		} catch (err) {
			this.statement = null;
		}
	}

	get statement() {
		return this._statement;
	}

	/**
	 * Sets the statement of this node equal to the new statement.
	 *
	 * Since it's a new statement, the correct decomposition calculated for this node is
	 * invalidated. The antecedent (the node that possibly contains this node in its correct
	 * decomposition) also has its correct decomposition invalidated since the change to this node
	 * could make or break that "correct decomposition."
	 */
	set statement(newStatement: Statement | null) {
		this._statement = newStatement;
		this.correctDecomposition = null;
		// Anything that references this is also invalid.
		if (this.antecedent !== null) {
			this.tree.nodes[this.antecedent].correctDecomposition = null;
		}
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
		if (newCorrectDecomposition === null) {
			console.log(`Invalidating correct decomposition on node ${this.id}`);
		}
	}

	/**
	 * Determines whether or not this statement is valid; i.e., it is a logical
	 * consequence of some other statement in the truth tree.
	 * @returns true if this statement is valid, false otherwise
	 */
	isValid(): Response {
		if (this.premise) {
			// Premises are always valid
			return {};
		}

		if (TruthTree.TERMINATORS.includes(this.text)) {
			if (this.text === TruthTree.OPEN_TERMINATOR) {
				return this.isOpenTerminatorValid();
			}
			// this.text === TruthTree.CLOSED_TERMINATOR
			return this.isClosedTerminatorValid();
		}

		const response: Response = {};

		if (this.statement === null) {
			// If the text could not be parsed into a statement, then the statement is
			// valid if and only if the text is empty
			if (this.text.length === 0) {
				return response;
			}

			response[
				this.id
			] = `isValid: '${this.text}' is not a parsable statement.`;
			return response;
		}

		// Non-premises must have an antecedent for this statement to be valid
		if (this.antecedent === null || !(this.antecedent in this.tree.nodes)) {
			response[this.id] = 'Non-premise does not have an antecedent.';
			return response;
		}

		// The antecedent must have been successfully parsed into a statement
		const antecedentNode = this.tree.nodes[this.antecedent];
		if (antecedentNode.statement === null) {
			response[this.id] = 'Antecedent is not a parsable statement.';
			return response;
		}

		// The antecedent must be in the ancestor branch
		if (!this.getAncestorBranch().has(this.antecedent)) {
			response[this.id] = 'Antecedent is not an ancestor.';
			return response;
		}

		if (antecedentNode.correctDecomposition!.has(this.id)) {
			return response;
		}

		response[this.id] = 'Not in a correct decomposition of antecedent.';
		return response;
	}

	/**
	 * Determines whether or not this node is valid assuming it is an open
	 * terminator. An open terminator is valid if and only if every statement from
	 * the root of the tree to the terminator is both valid and decomposed.
	 * @returns true if this open terminator is valid, false otherwise
	 */
	private isOpenTerminatorValid(): Response {
		// Keep track of every Atomic and negation of an Atomic
		const contradictionMap: Set<string> = new Set();
		const response: Response = {};

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
					response[this.id] = 'An open branch cannot contain a contradiction.';
					return response;
				}

				// Otherwise, store this statement for possible future contradictions
				if (ancestorStatement instanceof AtomicStatement) {
					contradictionMap.add(new NotStatement(ancestorStatement).toString());
				} else {
					contradictionMap.add(ancestorStatement.operand.toString());
				}
			}

			// Check if each ancestor is valid
			const ancestorValidity = ancestorNode.isValid();
			if (Object.keys(ancestorValidity).length > 0) {
				return ancestorValidity;
			}

			// Check if each ancestor is decomposed
			const ancestorDecomposed = ancestorNode.isDecomposed();
			if (Object.keys(ancestorDecomposed).length > 0) {
				return ancestorDecomposed;
			}
		}

		return response;
		// return false;
	}

	/**
	 * Determines whether or not this node is valid assuming it is a closed
	 * terminator. A closed terminator is valid if and only if the two statements
	 * that it references are a literal and its negation and are both valid.
	 * @returns true if this closed terminator is valid, false otherwise
	 */
	private isClosedTerminatorValid(): Response {
		const response: Response = {};

		// Closed terminators must reference exactly two statements
		if (this.decomposition.size !== 2) {
			response[this.id] =
				'Closed terminators must reference exactly 2 statements.';
			return response;
			// return false;
		}

		const decomposed_statements = [...this.decomposition].map(
			id => this.tree.nodes[id].statement
		);

		for (let i = 0; i < 2; ++i) {
			const first = decomposed_statements[i];
			const second = decomposed_statements[1 - i];

			if (first === null || second === null) {
				// This should never happen
				response[this.id] =
					'A closed terminator cannot reference a null statement for a contradiction.';
				return response;
				// return false;
			}

			// The referenced statements must be an atomic and its negation
			if (first instanceof NotStatement && first.operand.equals(second)) {
				if (!(second instanceof AtomicStatement)) {
					response[this.id] =
						'A contradiction can only be defined on an atomic statement and its negation.';
					return response;
					// return false;
				}

				// The referenced statements must also be ancestors of the closed
				// terminator and valid
				const ancestorBranch = this.getAncestorBranch();
				for (const id of this.decomposition) {
					if (!ancestorBranch.has(id)) {
						response[this.id] =
							'A branch cannot be closed by a contradiction not within this branch.';
						return response;
						// return false;
					}

					const ancestorIsValid = this.tree.nodes[id].isValid();
					if (Object.keys(ancestorIsValid).length > 0) {
						return ancestorIsValid;
						// return false;
					}
				}
				return response;
				// return true;
			}
		}

		response[this.id] = 'A closed terminator must come from a contradiction.';
		return response;
		// return false;
	}

	/**
	 * Determines whether or not this statement is fully decomposed in every open
	 * branch.
	 * @returns true if this statement is decomposed, false otherwise
	 */
	isDecomposed(): Response {
		const response: Response = {};

		if (this.statement === null) {
			// If the text could not be parsed into a statement, then the statement is
			// decomposed if and only if the text is empty
			if (this.text.length === 0) {
				return response;
			}

			// Terminators are all decomposed.
			if (TruthTree.TERMINATORS.includes(this.text)) {
				return response;
			}

			response[
				this.id
			] = `isDecomposed: '${this.text}' is not a parsable statement.`;
			return response;
			// return false;
		}

		const expectedDecomposition = this.statement.decompose();
		if (expectedDecomposition.length === 0) {
			// A statement with no decomposition is vacuously decomposed
			return response;
			// return true;
		}

		// Check if every decomposed node is in a child branch of this node.
		for (const decomposedId of this.decomposition) {
			if (!this.isAncestorOf(decomposedId)) {
				response[this.id] =
					'A node must be an ancestor of what it decomposes into.';
				return response;
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
				response[
					this.id
				] = `Must be decomposed in open branch ending with node ${openTerminatorId}`;
				return response;
			}
		}

		return response;
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
	private _root: number | undefined;
	leaves: Set<number> = new Set();

	get root(): number {
		if (this._root === undefined) {
			throw new Error('Undefined root');
		}
		return this._root;
	}

	set root(newRoot) {
		this._root = newRoot;
	}

	static deserialize(jsonText: string): TruthTree {
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
			// Read in each node individually
			for (const jsonNode of parsed) {
				const node = TruthTreeNode.fromJSON(newTree, jsonNode);
				if (node.children.length === 0) {
					newTree.leaves.add(node.id);
				}

				// Nodes only have no parent if they are roots
				if (node.parent === null) {
					if (newTree._root === undefined) {
						newTree._root = node.id;
					} else {
						// Cannot have two roots, so throw an error
						throw new Error('Tree has multiple roots.');
					}
				}

				newTree.nodes[node.id] = node;
			}

			// Tree must have exactly one root
			if (newTree._root === undefined) {
				throw new Error('Tree has no root.');
			}
		} catch (e) {
			throw new Error(
				`TruthTree#deserialize: The tree does not match the format: ${e.message}`
			);
		}

		return newTree;
	}

	serialize(): string {
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
	isCorrect(): Response {
		for (const node of Object.values(this.nodes)) {
			const nodeValidity = node.isValid();
			if (Object.keys(nodeValidity).length > 0) {
				// All terminators in a correct truth tree must be valid
				return nodeValidity;
				// return false;
			}
		}
		return {};
		// return true;
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
