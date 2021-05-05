import {FirstOrderLogicParser} from './parser';
import {Formula} from './formula';
import {
	Statement,
	AtomicStatement,
	NotStatement,
	QuantifierStatement,
	ExistenceStatement,
	UniversalStatement,
} from './statement';
import {deleteMapping, getAssignment, createNDimensionalMapping} from './util';

type Response = string | true;

interface TreeOptions {
	requireAtomicContradiction: boolean;
	requireAllBranchesTerminated: boolean;
	lockedOptions: boolean;
}

export class TruthTreeNode {
	id: number;

	private _text = '';
	private _statement: Statement | null = null;
	premise = false;
	comment: string | null = null;

	tree: TruthTree;

	parent: number | null = null;
	children: number[] = [];

	antecedent: number | null = null;
	decomposition: Set<number> = new Set();
	private _correctDecomposition: Set<number> | null = null;

	// For FOL:
	// The universe of discourse up to (but excluding) this node in the tree
	// If this statement does not introduce any new constants, it is null
	private _universe: Formula[] | null = null;

	/**
	 * Constructs a new `TruthTreeNode` in a `TruthTree`.
	 * @param id the id of this node
	 * @param tree the tree that contains this node
	 */
	constructor(id: number, tree: TruthTree) {
		this.id = id;
		this.tree = tree;
	}

	clone(newTree: TruthTree) {
		const newNode = new TruthTreeNode(this.id, newTree);
		newNode.text = this.text;
		newNode.premise = this.premise;
		newNode.comment = this.comment;
		newNode.parent = this.parent;
		newNode.children = [...this.children];
		newNode.antecedent = this.antecedent;
		newNode.decomposition = new Set(this.decomposition);

		return newNode;
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

		if ('comment' in jsonObject && typeof jsonObject.comment === 'string') {
			newNode.comment = jsonObject.comment;
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
			this.statement = new FirstOrderLogicParser().parse(this.text);
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

		// Update the universe of discourse

		// Can only guarantee children are correctly initialized if the tree's
		// initialized flag is set to true
		if (this.tree.initialized === true) {
			this.propogateUniverse(this.universe!, 'self');
		}
	}

	/**
	 * Returns the universe of discourse up to (excluding) this node.
	 * Note that this function guarantees a Formula[]
	 */
	get universe(): Formula[] | null {
		if (this._universe === null) {
			if (this.parent === null) {
				console.log(
					'WARNING: root has no universe! If you see this error,' +
						'try saving the file and opening it in a new tab.'
				);
				return [];
			}
			return this.tree.nodes[this.parent].universe;
		}
		return Array.from(this._universe);
	}

	set universe(newUniverse: Formula[] | null) {
		this._universe = newUniverse;
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

	togglePremise() {
		this.premise = !this.premise;
	}

	isTerminator(): boolean {
		return TruthTree.TERMINATORS.includes(this.text.trim());
	}

	isOpenTerminator(): boolean {
		return TruthTree.OPEN_TERMINATOR === this.text.trim();
	}

	isClosedTerminator(): boolean {
		return TruthTree.CLOSED_TERMINATOR === this.text.trim();
	}

	/**
	 * Determines whether or not this statement is valid; i.e., it is a logical
	 * consequence of some other statement in the truth tree.
	 * @returns true if this statement is valid, false otherwise
	 */
	isValid(): Response {
		if (this.isTerminator()) {
			// Terminators should have no children
			if (this.children.length > 0) {
				return 'terminator_not_last';
			}

			if (this.isOpenTerminator()) {
				return this.isOpenTerminatorValid();
			}
			// Is a closed terminator
			return this.isClosedTerminatorValid();
		}

		if (this.statement === null) {
			// If the text could not be parsed into a statement, then the statement is
			// valid if and only if the text is empty
			if (this.text.trim().length === 0) {
				return true;
			}

			return 'not_parsable';
		}

		if (this.premise) {
			// Premises are always valid
			return true;
		}

		// Non-premises must have an antecedent for this statement to be valid
		if (this.antecedent === null || !(this.antecedent in this.tree.nodes)) {
			return 'not_logical_consequence';
		}

		// The antecedent must have been successfully parsed into a statement
		const antecedentNode = this.tree.nodes[this.antecedent];
		if (antecedentNode.statement === null) {
			// Cannot be a logical consequence of nothing
			return 'not_logical_consequence';
		}

		// The antecedent must be in the ancestor branch
		if (!this.getAncestorBranch().has(this.antecedent)) {
			return 'not_logical_consequence';
		}

		// If the antecedent is a quantifier, there is a different procedure:
		// check if the statement is an instantiated version of the quantifier
		if (antecedentNode.statement instanceof QuantifierStatement) {
			if (!antecedentNode.statement.symbolized().equals(this.statement)) {
				// Not a valid instantiation of the quantifier.
				return 'invalid_instantiation';
			}

			// if (antecedentNode.statement instanceof ExistenceStatement) {
			// 	if (
			// 		this.statement.getNewConstants(this.universe!).length <
			// 		antecedentNode.statement.variables.length
			// 	) {
			// 		return 'existence_instantiation_length';
			// 	}
			// }

			return true;
		}

		// Check if the node is a logical consequence of the antecedent
		if (antecedentNode.correctDecomposition!.has(this.id)) {
			return true;
		}

		return 'not_logical_consequence';
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

		if (this.decomposition.size !== 0) {
			return 'open_decomposed';
		}

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
					// Branch has a contradiction
					return 'open_contradiction';
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
			if (ancestorValidity !== true) {
				return 'open_invalid_ancestor';
			}

			// Check if each ancestor is decomposed
			const ancestorDecomposed = ancestorNode.isDecomposed();
			if (ancestorDecomposed !== true) {
				return 'open_invalid_ancestor';
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
	private isClosedTerminatorValid(): Response {
		// Closed terminators must reference exactly two statements
		if (this.decomposition.size !== 2) {
			return 'closed_reference_length';
		}

		const decomposed_statements = [...this.decomposition].map(
			id => this.tree.nodes[id].statement
		);

		for (let i = 0; i < 2; ++i) {
			const first = decomposed_statements[i];
			const second = decomposed_statements[1 - i];

			if (first === null || second === null) {
				// This should never happen
				return 'closed_reference_invalid';
			}

			// The referenced statements must be a statement and its negation
			if (first instanceof NotStatement && first.operand.equals(second)) {
				if (
					this.tree.options.requireAtomicContradiction &&
					!(second instanceof AtomicStatement)
				) {
					return 'closed_not_atomic';
				}

				// The referenced statements must also be ancestors of the closed
				// terminator and valid
				const ancestorBranch = this.getAncestorBranch();
				for (const id of this.decomposition) {
					if (!ancestorBranch.has(id)) {
						return 'closed_not_ancestor';
					}

					// Jeff 4/26: do we need the check below? Commenting out for
					// now, may need to reinstate it.

					// const ancestorIsValid = this.tree.nodes[id].isValid();
					// if (Object.keys(ancestorIsValid).length > 0) {
					// 	return ancestorIsValid;
					// }
				}
				return true;
			}
		}

		return 'closed_not_contradiction';
	}

	/**
	 * Determines whether or not this statement is fully decomposed in every open
	 * branch.
	 * @returns true if this statement is decomposed, false otherwise
	 */
	isDecomposed(): Response {
		// Note: This catches terminators
		if (this.statement === null) {
			// If the text could not be parsed into a statement, then the statement is
			// decomposed if and only if the text is empty
			if (this.text.trim().length === 0) {
				return true;
			}

			// Terminators are all decomposed.
			if (this.isTerminator()) {
				return true;
			}

			return 'not_parsable';
		}

		const expectedDecomposition = this.statement.decompose();
		if (expectedDecomposition.length === 0) {
			// A statement with no decomposition is vacuously decomposed
			return true;
		}

		// Check if every decomposed node is in a child branch of this node.
		for (const decomposedId of this.decomposition) {
			if (!this.isAncestorOf(decomposedId)) {
				return 'reference_not_after';
			}
		}

		let existenceSatisfied = !(this.statement instanceof ExistenceStatement);

		// Check if this statement is decomposed in every open branch that contains it
		for (const leafId of this.tree.leaves) {
			const openTerminatorNode = this.tree.nodes[leafId];

			// Existence statements need to be checked across all branches,
			// not just the open branches.
			if (this.statement instanceof ExistenceStatement) {
				// Collect the decomposed nodes in this branch (including leaf)
				const branch = openTerminatorNode.getAncestorBranch(true);

				const decomposedInBranch = new Set<number>();
				for (const decomposed of this.decomposition) {
					if (branch.has(decomposed)) {
						decomposedInBranch.add(decomposed);
					}
				}

				// Can only be decomposed once per branch
				if (decomposedInBranch.size !== 1) {
					return 'existence_decompose_length';
				}

				const decomposedId = [...decomposedInBranch][0];

				const decomposedNode = this.tree.nodes[decomposedId];

				// An empty statement cannot be a decomposition
				if (decomposedNode.statement === null) {
					return 'invalid_decomposition';
				}

				// Must be valid instantiation
				const symbolized = this.statement.symbolized();
				const assignment = symbolized.getEqualsMap(decomposedNode.statement);
				if (assignment === false) {
					return 'invalid_decomposition';
				}

				// At least one branch must instantiate new variables
				if (
					decomposedNode.statement.getNewConstants(decomposedNode.universe!)
						.length >= this.statement.variables.length
				) {
					existenceSatisfied = true;
				}

				continue;
			}

			// Technically we only need to check on open branches, but it makes
			// more sense to give feedback when it's not closed
			if (openTerminatorNode.isClosedTerminator()) {
				continue;
			}

			// This statement must be contained in the open branch.
			if (!this.isAncestorOf(leafId) && leafId !== this.id) {
				continue;
			}

			// Get the branch ending with this terminator
			const openBranch = openTerminatorNode.getAncestorBranch(true);

			// Universals are special
			if (this.statement instanceof UniversalStatement) {
				// Collect the decomposed nodes in this branch
				const decomposedInBranch = new Set<number>();
				for (const decomposed of this.decomposition) {
					if (openBranch.has(decomposed)) {
						decomposedInBranch.add(decomposed);
					}
				}

				// Each universal must instantiate at least one variable.
				if (decomposedInBranch.size === 0) {
					return 'universal_decompose_length';
				}

				// Must instantiate every variable in the universe
				// This is a rough metric to prevent later calculation.
				// if (
				// 	decomposedInBranch.size <
				// 	Math.pow(
				// 		openTerminatorNode.universe!.length,
				// 		this.statement.variables.length
				// 	)
				// ) {
				// 	return 'universal_domain_not_decomposed';
				// }

				const inclusiveUniverse = openTerminatorNode.universe!;
				if (openTerminatorNode.statement !== null) {
					const newConstants = openTerminatorNode.statement.getNewConstants(
						openTerminatorNode.universe!
					);
					for (const newConstant of newConstants) {
						inclusiveUniverse.push(newConstant);
					}
				}

				const symbolized = this.statement.symbolized();
				const uninstantiated = createNDimensionalMapping(
					this.statement.variables.length,
					inclusiveUniverse
				);

				for (const decomposed of decomposedInBranch) {
					const decomposedNode = this.tree.nodes[decomposed];
					if (decomposedNode.statement === null) {
						// An empty statement cannot be a decomposition
						return 'invalid_decomposition';
					}

					const assignment = symbolized.getEqualsMap(decomposedNode.statement);
					if (assignment === false) {
						// Not an initialization of the antecedent
						return 'invalid_decomposition';
					}

					deleteMapping(uninstantiated, assignment, this.statement.variables);
				}

				if (Object.keys(uninstantiated).length !== 0) {
					const mapping = getAssignment(uninstantiated);
					return `universal_domain_not_decomposed ${mapping}`;
				}
			} else {
				// Check if a node from the correct decomposition is in the branch
				let containedInBranch = false;
				for (const correctlyDecomposedNode of this.correctDecomposition!) {
					if (openBranch.has(correctlyDecomposedNode)) {
						containedInBranch = true;
						break;
					}
				}
				if (!containedInBranch) {
					// This node is not decomposed in every open branch
					return 'invalid_decomposition';
				}
			}
		}

		if (!existenceSatisfied) {
			return 'existence_instantiation_length';
		}

		return true;
	}

	getFeedback(): string {
		const validity = this.isValid();
		if (validity !== true) {
			return this.tree.resolveErrorCode(validity);
		}
		const decomp = this.isDecomposed();
		if (decomp !== true) {
			return this.tree.resolveErrorCode(decomp);
		}

		if (this.premise) {
			return 'This statement is a premise.';
		}

		if (this.isTerminator()) {
			if (this.isOpenTerminator()) {
				return 'This open branch represents a valid assignment.';
			}
			return 'This branch is successfully closed.';
		}

		return 'This statement is a logical consequence and is decomposed correctly.';
	}

	/**
	 * Down-propogates the universe, updating as statements introduce new
	 * constants.
	 * @param universe the universe to propogate
	 * @param changes boolean values representing whether there were new nodes
	 * initialized from the prev. node or 'self' to check if this node has its
	 * own universe
	 */
	propogateUniverse(universe: Formula[], changes: boolean | 'self') {
		// If there wasn't a change to the previous universe, set universe to
		// null in order to mark that it should refer to the parent's universe
		if (changes === 'self') {
			changes = this._universe !== null;
		}

		// Note: this is using _universe instead of universe due to weird JS bug?
		this._universe = changes ? universe : null;

		const nextUniverse = [...universe];

		// The children of this node have the constants added by this node
		// in their respective universes
		if (this.statement !== null) {
			const newConstants = this.statement.getNewConstants(universe);
			for (const newConstant of newConstants) {
				nextUniverse.push(newConstant);
			}
			changes = newConstants.length > 0;
		}

		for (const childId of this.children) {
			this.tree.nodes[childId].propogateUniverse(nextUniverse, changes);
		}
	}

	/**
	 * Traverses up the tree starting at this node's parent, returning a set of
	 * the ancestors of this node.
	 * @returns a set of ids corresponding to this node's ancestors
	 */
	private getAncestorBranch(includeSelf = false): Set<number> {
		const branch = new Set<number>();
		if (includeSelf) {
			branch.add(this.id);
		}
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
	isAncestorOf(otherId: number): boolean {
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

	// Inner Representation
	nodes: {[id: number]: TruthTreeNode} = {};
	private _root: number | undefined;
	leaves: Set<number> = new Set();

	initialized = true;

	// These options control which truth tree extensions to allow.
	options: TreeOptions = {
		requireAtomicContradiction: true,
		requireAllBranchesTerminated: true,
		lockedOptions: false,
	};

	get root(): number {
		if (this._root === undefined) {
			throw new Error('Undefined root');
		}
		return this._root;
	}

	set root(newRoot) {
		this._root = newRoot;
	}

	/**
	 * Creates a deep copy of this tree.
	 * @returns a clone of this tree
	 */
	clone() {
		const newTree = new TruthTree();
		newTree.initialized = false;

		// Copy the nodes
		for (const node of Object.values(this.nodes)) {
			newTree.nodes[node.id] = node.clone(newTree);
		}

		// Copy the root and leaves
		newTree.root = this.root;
		newTree.leaves = new Set(this.leaves);

		// Copy the options
		newTree.options = {
			requireAtomicContradiction: this.options['requireAtomicContradiction'],
			requireAllBranchesTerminated: this.options[
				'requireAllBranchesTerminated'
			],
			lockedOptions: this.options['lockedOptions'],
		};

		// Calculate the universe for each node
		newTree.recalculateUniverse();
		newTree.initialized = true;

		return newTree;
	}

	/**
	 * Returns an empty truth tree, which contains a single (empty) node.
	 * @return the empty truth tree
	 */
	static empty(): TruthTree {
		const tree = new TruthTree();
		tree.nodes[0] = new TruthTreeNode(0, tree);
		tree.nodes[0].universe = [];
		tree.root = 0;
		tree.leaves.add(0);
		return tree;
	}

	static deserialize(jsonText: string): TruthTree {
		const newTree = new TruthTree();

		// While the tree is initializing, it is not initialized
		newTree.initialized = false;

		const parsed = JSON.parse(jsonText);
		if (typeof parsed !== 'object') {
			throw new Error('TruthTree#deserialize: This file is not in JSON.');
		}

		const parsedNodes = parsed['nodes'];
		if (
			!(
				typeof parsedNodes === 'object' &&
				Array.isArray(parsedNodes) &&
				parsedNodes.length > 0
			)
		) {
			throw new Error('TruthTree#deserialize: The tree is empty.');
		}

		try {
			// Read in each node individually
			for (const jsonNode of parsedNodes) {
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
						throw new Error('TruthTree#deserialize: Tree has multiple roots.');
					}
				}

				newTree.nodes[node.id] = node;
			}

			// Tree must have exactly one root
			if (newTree._root === undefined) {
				throw new Error('TruthTree#deserialize: Tree has no root.');
			}
		} catch (e) {
			throw new Error(
				`TruthTree#deserialize: The tree does not match the format: ${e.message}`
			);
		}

		// Grab the options
		newTree.options = parsed['options'];

		// Load the universe
		newTree.nodes[newTree.root].propogateUniverse([], true);

		// Tree has completed initializing
		newTree.initialized = true;

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

			if (node.comment !== null) {
				serializedNode.comment = node.comment;
			}

			if (node.parent !== null) {
				serializedNode.parent = node.parent;
			}

			if (node.antecedent !== null) {
				serializedNode.antecedent = node.antecedent;
			}

			serializedNodes.push(serializedNode);
		}

		const serializedTree: {[key: string]: any} = {};
		serializedTree['nodes'] = serializedNodes;
		serializedTree['options'] = this.options;

		return JSON.stringify(serializedTree);
	}

	/**
	 * Returns a node with the given id, or null if no such node exists.
	 * @param id the node id
	 * @returns a node whose id is `id`, or null if no such node exists
	 */
	getNode(id: number | null | undefined): TruthTreeNode | null {
		return id !== null && id !== undefined && id in this.nodes
			? this.nodes[id]
			: null;
	}

	/**
	 * Returns the id of the node at the top of the branch containing a given
	 * node.
	 * @param id the id of the node used to locate the branch
	 * @returns the id of the node at the top of the branch containing the node
	 * whose id is `id`
	 */
	getBranchHead(id?: number | null) {
		let current = this.getNode(id);
		if (current === null) {
			return null;
		}

		while (
			current.parent !== null &&
			this.nodes[current.parent].children.length === 1
		) {
			current = this.nodes[current.parent];
		}
		return current.id;
	}

	/**
	 * Returns the id of the node at the bottom of the branch containing a given
	 * node.
	 * @param id the id of the node used to locate the branch
	 * @returns the id of the node at the bottom of the branch containing the node
	 * whose id is `id`
	 */
	getBranchTail(id?: number | null) {
		let current = this.getNode(id);
		if (current === null) {
			return null;
		}

		while (current.children.length === 1) {
			current = this.nodes[current.children[0]];
		}
		return current.id;
	}

	/**
	 * Determines whether or not the branch with a given root contains a premise.
	 * @param root the id of the root
	 * @returns true if the branch contains a premise, false otherwise
	 */
	branchContainsPremise(root?: number | null) {
		if (typeof root !== 'number') {
			return false;
		}

		// Perform a BFS to determine if any of the nodes in the branch contains
		// a premise
		let queue = [root];
		while (queue.length > 0) {
			// queue is non-empty, so we can guarantee that shift() does not return
			// undefined
			const node = this.getNode(queue.shift());
			if (node === null) {
				continue;
			}
			if (node.premise) {
				return true;
			}
			queue = queue.concat(node.children);
		}
		return false;
	}

	/**
	 * Returns the leftmost node in the subtree rooted at a given node, or the
	 * entire tree if no node is specified.
	 * @param root the id of the root of the subtree
	 * @returns the leftmost node
	 */
	leftmostNode(root?: number | null) {
		let node =
			typeof root === 'number' ? this.getNode(root) : this.getNode(this.root);
		if (node === null) {
			return null;
		}

		// Move down the tree, preferring the leftmost child if there are multiple
		while (node.children.length > 0) {
			node = this.nodes[node.children[0]];
		}
		return node;
	}

	/**
	 * Returns the rightmost node in the subtree rooted at a given node, or the
	 * entire tree if no node is specified.
	 * @param root the id of the root of the subtree
	 * @returns the rightmost node
	 */
	rightmostNode(root?: number | null) {
		let node =
			typeof root === 'number' ? this.getNode(root) : this.getNode(this.root);
		if (node === null) {
			return null;
		}

		// Move down the tree, preferring the rightmost child if there are multiple
		while (node.children.length > 0) {
			node = this.nodes[node.children[node.children.length - 1]];
		}
		return node;
	}

	private getNextId() {
		return Math.max(...Object.keys(this.nodes).map(id => parseInt(id))) + 1;
	}

	/**
	 * Adds a new node directly before the given node, always staying in the
	 * same branch.
	 * @param childId the id of the node to add before
	 * @returns the id of the created node or null if there was an error
	 */
	addNodeBefore(childId: number): number | null {
		// Ensure the given node exists
		const childNode = this.getNode(childId);
		if (childNode === null) {
			console.log(
				'TruthTree#addNodeBefore: Attempted to add node before null node.'
			);
			return null;
		}

		// Create the new node in the tree
		const newId = this.getNextId();
		this.nodes[newId] = new TruthTreeNode(newId, this);

		const newNode = this.nodes[newId];
		newNode.parent = childNode.parent;
		newNode.children = [childId];

		// Fix parent's children pointer
		const parentNode = this.getNode(childNode.parent);
		if (parentNode !== null) {
			const index = parentNode.children.indexOf(childId);
			if (index === -1) {
				console.log('TruthTree#addNodeBefore: Parent does not contain child.');
			} else {
				parentNode.children[index] = newId;
			}
		}

		// Fix child's parent pointer
		childNode.parent = newId;

		// If the original node was the root, replace it
		if (this.root === childId) {
			this.root = newId;
			newNode.propogateUniverse([], true);
		}

		return newId;
	}

	/**
	 * Add a node after the given node. If newBranch is false, then it is added
	 * to the same branch. Otherwise, it creates a new branch and places the new
	 * node as the root of that branch.
	 * @param parentId the id of the node to add after
	 * @param newBranch whether or not to create a new branch
	 * @returns the id of the created node or null if there was an error
	 */
	addNodeAfter(parentId: number, newBranch: boolean): number | null {
		// Ensure the given node exists
		const parentNode = this.getNode(parentId);
		if (parentNode === null) {
			console.log(
				'TruthTree#addNodeAfter: Attempted to add node after null node.'
			);
			return null;
		}

		// Create the new node in the tree
		const newId = this.getNextId();
		this.nodes[newId] = new TruthTreeNode(newId, this);
		this.nodes[newId].parent = parentId;

		// Update leaves set
		if (this.leaves.has(parentId)) {
			this.leaves.delete(parentId);
			this.leaves.add(newId);
		}

		if (newBranch) {
			parentNode.children.push(newId);
			this.leaves.add(newId);
			parentNode.propogateUniverse(parentNode.universe!, 'self');
			// Returning parent's ID allows people adding multiple branches at
			// once to do so without having to click the parent many times.
			return parentId;
		}

		this.nodes[newId].children = parentNode.children;

		// Fix children's parent pointers
		for (const childId of parentNode.children) {
			const childNode = this.getNode(childId);
			if (childNode !== null) {
				childNode.parent = newId;
			} else {
				console.log('TruthTree#addNodeAfter: Referenced child does not exist.');
			}
		}

		// Fix parent's children array
		parentNode.children = [newId];
		parentNode.propogateUniverse(parentNode.universe!, 'self');

		return newId;
	}

	/**
	 * Deletes a node. A node can only be deleted if it is not the root of a
	 * branch with multiple children; in other words, this function cannot delete
	 * the only node in a branch.
	 * @param id the id of the node to delete
	 * @returns null if the node could not be deleted; otherwise, if the node has
	 * one child, returns the id of that child; if the node has multiple children,
	 * returns the id of the deleted node's parent
	 */
	deleteNode(id: number): number | null {
		if (!(id in this.nodes)) {
			console.error(
				'TruthTree#deleteNode: Could not delete a node that does not exist'
			);
			return null;
		}
		const node = this.nodes[id];

		// Remove constants added by this node from the universe
		if (node.statement !== null) {
			const newConstants = node.statement.getNewConstants(node.universe!);
			for (const childId of node.children) {
				// Propogate the universe w/o the constants added by this node
				this.nodes[childId].propogateUniverse(
					node.universe!,
					newConstants.length > 0
				);
			}
		}

		if (node.parent === null) {
			// If the node has no parent, then it is the root of the tree
			if (node.children.length !== 1) {
				// If the node has multiple children, then don't delete it
				return null;
			}

			// The node has no parent and exactly one child, so delete this node (and
			// make its sole child the new root of the tree)
			this.nodes[node.children[0]].parent = null;
			this._root = node.children[0];
		} else {
			// Otherwise, the node is not the root of the entire tree
			const parentNode = this.nodes[node.parent];
			if (parentNode.children.length !== 1) {
				// If the node's parent has multiple children, then the node is
				// the root of a branch
				if (node.children.length > 1) {
					// We cannot delete the root of a branch with multiple
					// children (this would delete the entire branch)
					return null;
				}

				// The node has at most one child, so delete this node (and make
				// its sole child, if it exists, a child of its parent node)
				const index = parentNode.children.indexOf(id);
				if (node.children.length === 1) {
					parentNode.children[index] = node.children[0];
					this.nodes[node.children[0]].parent = node.parent;
				} else {
					// node.children.length === 0
					parentNode.children.splice(index, 1);
					this.leaves.delete(id);
				}
			} else {
				// Otherwise, the node is not the root of a branch
				parentNode.children = node.children;
				for (const child of node.children) {
					this.nodes[child].parent = node.parent;
				}

				// If the deleted node was a leaf node, then its parent is now
				// a leaf node
				if (node.children.length === 0) {
					this.leaves.delete(id);
					this.leaves.add(parentNode.id);
				}
			}
		}

		// Make sure nothing else logically references it
		if (node.antecedent !== null) {
			const antecedentNode = this.nodes[node.antecedent];
			antecedentNode.decomposition.delete(node.id);
			// Refresh the correct decomposition
			antecedentNode.correctDecomposition = null;
		}

		if (!node.isTerminator()) {
			for (const childId of node.decomposition) {
				const childNode = this.nodes[childId];
				childNode.antecedent = null;
			}
		}

		// Ensure no closed terminators still reference this
		for (const leafId of this.leaves) {
			const leafNode = this.nodes[leafId];
			if (!leafNode.isClosedTerminator()) {
				continue;
			}
			// Is a closed terminator
			leafNode.decomposition.delete(id);
		}

		delete this.nodes[id];

		if (node.children.length === 1) {
			// If the deleted node has one child, return the id of that child
			return node.children[0];
		} else {
			// Otherwise, return the id of the deleted node's parent
			return node.parent;
		}
	}

	/**
	 * Deletes all nodes children of and including the given node.
	 * @param id the id of the head of a branch
	 * @returns the id of the parent node
	 */
	deleteBranch(id: number): number | null {
		const headNode = this.nodes[id];
		if (headNode.parent === null) {
			return null;
		}

		// Delete the children
		for (let index = headNode.children.length - 1; index >= 0; --index) {
			this.deleteBranch(headNode.children[index]);
		}

		// Delete this node
		this.deleteNode(id);
		return headNode.parent;
	}

	/**
	 * Determines whether or not this truth tree is correct.
	 * @returns true if this truth tree is correct, false otherwise
	 */
	isCorrect(): string {
		if (!this.checkRepresentation()) {
			return 'This tree is malformed -- please save this tree and contact a developer.';
		}

		// Refresh the universe to ensure it's correct before giving a result
		this.recalculateUniverse();

		let hasValidOpenTerm = false;

		// All nodes always have to be valid in order for the tree to be correct.
		for (const node of Object.values(this.nodes)) {
			// All nodes must be valid
			const nodeValidity = node.isValid();
			if (nodeValidity !== true) {
				return 'This tree is incorrect.';
			}

			if (this.leaves.has(node.id)) {
				if (this.options.requireAllBranchesTerminated) {
					// Require all leaves to be terminators
					if (!node.isTerminator()) {
						return 'Every branch must be terminated.';
					}
				} else {
					// Otherwise track if there is a valid open terminator.
					if (node.isOpenTerminator()) {
						hasValidOpenTerm = true;
					}
				}
			}
		}

		// If there is a satisfied open branch, then the tree is correct.
		// This condition always fails if requireAllBranchesTerminated is true
		if (hasValidOpenTerm) {
			return 'This tree is correct!';
		}

		// Otherwise, every leaf must be a terminator of some kind
		for (const leafId of this.leaves) {
			const leaf = this.nodes[leafId];

			if (!leaf.isTerminator()) {
				if (this.options.requireAllBranchesTerminated) {
					return (
						'Every branch must be closed or there must be at' +
						' least one open branch.'
					);
				}
				return 'Every branch must be terminated.';
			}
		}

		return 'This tree is correct!';
	}

	/**
	 * Checks to make sure representation invariants are held; if they are not
	 * held then the tree could potentially be evaluated incorrectly.
	 * @returns whether or not the tree is valid
	 */
	checkRepresentation(): boolean {
		for (const node of Object.values(this.nodes)) {
			// Terminators don't have to get checked for any of this
			if (node.isTerminator()) {
				continue;
			}

			if (node.antecedent !== null) {
				const antecedentNode = this.nodes[node.antecedent];

				// Must be in decomposition of antecedent
				if (!antecedentNode.decomposition.has(node.id)) {
					console.log(
						`${node.id} is not in the decomp of ${antecedentNode.id}`
					);
					return false;
				}

				// Antecedent must be an ancestor of the node
				if (!antecedentNode.isAncestorOf(node.id)) {
					console.log(`${antecedentNode.id} is not an ancestor of ${node.id}`);
					return false;
				}
			}

			// Node is a leaf but not tracked as a leaf
			if (node.children.length === 0 && !this.leaves.has(node.id)) {
				console.log(`${node.id} is not marked as a leaf`);
				return false;
			}

			// Must be antecedent of decomposition
			for (const decomposedId of node.decomposition) {
				const decomposedNode = this.nodes[decomposedId];
				if (decomposedNode.antecedent !== node.id) {
					console.log(`${node.id} is not an antecedent of ${decomposedId}`);
					return false;
				}
			}
		}

		return true;
	}

	/**
	 * Propogates the universe down from the root node to recalculate the
	 * universe at all nodes in the tree.
	 */
	recalculateUniverse() {
		const rootNode = this.nodes[this.root];
		rootNode.propogateUniverse([], true);
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

	resolveErrorCode(errorCode: string): string {
		const sections = errorCode.split(' ');
		errorCode = sections[0];

		switch (errorCode) {
			case 'not_parsable': {
				return 'This statement is not parsable.';
			}
			case 'not_logical_consequence': {
				return (
					'This statement is not a logical consequence of a ' +
					'statement that occurs before it.'
				);
			}
			case 'invalid_instantiation': {
				return 'This statement does not instantiate the statement it references';
			}
			case 'existence_instantiation_length': {
				return 'Each variable in an existence statement must instantiate a new constant.';
			}
			case 'open_decomposed': {
				return 'An open terminator must reference no statements.';
			}
			case 'open_contradiction': {
				return 'This branch contains a contradiction.';
			}
			case 'open_invalid_ancestor': {
				return 'This branch contains an invalid statement.';
			}
			case 'closed_reference_length': {
				return 'A closing terminator must reference exactly two statements.';
			}
			case 'closed_reference_invalid': {
				return 'The referenced statements must be valid.';
			}
			case 'closed_not_atomic': {
				return (
					'The referenced statements must consist of a literal' +
					' and its negation'
				);
			}
			case 'closed_not_ancestor': {
				return (
					'A closing terminator must only reference statements' +
					' that occur before it.'
				);
			}
			case 'closed_not_contradiction': {
				return (
					'The referenced statements must consist of a statement' +
					' and its negation'
				);
			}
			case 'terminator_not_last': {
				return 'No statements can occur in a branch after a terminator.';
			}
			case 'reference_not_after': {
				return 'A statement must decompose into statements that occur after it.';
			}
			case 'invalid_decomposition': {
				return 'This statement is not decomposed correctly.';
			}
			case 'existence_decompose_length': {
				return 'An existence statement must be decomposed exactly once per branch.';
			}
			case 'universal_decompose_length': {
				return 'A universal statement must be decomposed at least once.';
			}
			case 'universal_domain_not_decomposed': {
				return (
					'A universal statement must instantiate every variable' +
					` in the universe of discourse (Need to instantiate ${sections[1]})`
				);
			}
			case 'universal_variables_length': {
				return (
					'Universals with multiple variables cannot be evaluated' +
					' yet; please split into multiple universal statements.'
				);
			}
		}

		return 'Unknown error code. Contact a developer :)';
	}
}
