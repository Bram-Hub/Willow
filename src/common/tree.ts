import {FirstOrderLogicParser} from './parser';
import {Formula} from './formula';

import {
	Statement,
	AtomicStatement,
	NotStatement,
	QuantifierStatement,
	ExistenceStatement,
	UniversalStatement,
	DPStatementValidator,
	Contradiction,
} from './statement';
import {
	deleteMapping,
	getFirstUnassigned,
	createNDimensionalMapping,
	EvaluationResponse,
} from './util';
import { getDPMode } from '../client/globals';

export class CorrectnessError {
	errorCode: string;
	extras: string | null;

	constructor(errorCode: string, extras: string | null = null) {
		this.errorCode = errorCode;
		this.extras = extras;
	}

	toString() {
		return this.errorCode;
	}

	getErrorMessage(): string {
		switch (this.errorCode) {
			case 'not_parsable': {
				return 'This statement is not parsable.';
			}
			case 'not_logical_consequence': {
				if(getDPMode()==false){
					return 'This statement is not a logical consequence of a statement that occurs before it.';
				}else{
					return 'This statement is not a logical inference of a statement that occurs before it.';
				}
			}
			case 'invalid_instantiation': {
				return 'This statement does not instantiate the statement it references';
			}
			case 'existence_instantiation_length': {
				return 'Each variable in an existence statement must instantiate a new constant.';
			}
			case 'existence_instantiation_violation': {
				return 'This statement was decomposed multiple times within the same branch.';
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
				return 'The referenced statements must consist of a literal and its negation.';
			}
			case 'closed_not_ancestor': {
				return 'A closing terminator must only reference statements that occur before it.';
			}
			case 'closed_not_contradiction': {
				return 'The referenced statements must consist of a statement and its negation.';
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
			case 'universal_decompose_length': {
				return 'A universal statement must be decomposed at least once.';
			}
			case 'universal_domain_not_decomposed': {
				return `A universal statement must instantiate every variable in the universe of discourse (${this.extras} not instantiated).`;
			}
			case 'universal_variables_length': {
				return 'Universals with multiple variables cannot be evaluated yet; please split into multiple universal statements.';
			}
			case 'tautology not decomposed': {
				return 'Tautology is not decomposed';
			}
		}

		return 'Unknown error code. Contact a developer :)';
	}
}

type Response = CorrectnessError | true;

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
	isTautology = false;
	comment: string | null = null;

	isBranchLiteral = false;

	tree: TruthTree;

	parent: number | null = null; // Physical parent
	children: number[] = [];

	antecedent: number | null = null; // Logical parent
	decomposition: Set<number> = new Set();

	// For Davis Putnam reduction
	antecedentsDP: Set<number> = new Set();

	private _correctDecomposition: Set<number> | null = null;

	/**
	 * For use in First Order Logic validation:
	 * The universe of discourse up to (and including) this node in the tree.
	 * If this statement does not introduce any new constants, it is null.
	 */
	private _universe: Formula[] | null | undefined = undefined;

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
		newNode.isTautology = this.isTautology;
		newNode.isBranchLiteral = this.isBranchLiteral;
		newNode.comment = this.comment;
		newNode.parent = this.parent;
		newNode.children = [...this.children];
		newNode.antecedent = this.antecedent;
		newNode.decomposition = new Set(this.decomposition);
		newNode.antecedentsDP = new Set(this.antecedentsDP);
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

		if (
			!(
				'antecedentsDP' in jsonObject &&
				typeof jsonObject.antecedentsDP === 'object' &&
				Array.isArray(jsonObject.antecedentsDP) &&
				jsonObject.antecedentsDP.every(element => typeof element === 'number')
			)
		) {
			throw new Error('TruthTreeNode#fromJSON: antecedentsDP not found.');
		}
		newNode.antecedentsDP = new Set(jsonObject.antecedentsDP);

		// Check for optional properties
		if ('premise' in jsonObject && typeof jsonObject.premise === 'boolean') {
			newNode.premise = jsonObject.premise;
		}

		if (
			'isBranchLiteral' in jsonObject &&
			typeof jsonObject.isBranchLiteral === 'boolean'
		) {
			newNode.isBranchLiteral = jsonObject.isBranchLiteral;
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
	 * Since it's a new statement, the correct decomposition calculated for this
	 * node is invalidated. The antecedent (the node that possibly contains this
	 * node in its correct decomposition) also has its correct decomposition
	 * invalidated since the change to this node could make or break that
	 * "correct decomposition."
	 */
	set statement(newStatement: Statement | null) {
		this._statement = newStatement;
		if (this._statement?.isTautology()) {
			this.isTautology = true;
		}
		this._correctDecomposition = null;
		// Anything that references this is also invalid.
		if (this.antecedent !== null) {
			this.tree.nodes[this.antecedent]._correctDecomposition = null;
		}

		// Update the universe of discourse

		// Can only guarantee children are correctly initialized if the tree's
		// initialized flag is set to true
		if (this.tree.initialized === true) {
			this.calculateUniverse();
		}
	}

	/**
	 * Returns the universe of discourse up to (excluding) this node.
	 * Note that this function guarantees a Formula[]
	 */
	get universe(): Formula[] | null {
		if (this._universe === undefined) {
			console.log('ERROR: Got an undefined universe.');
			return null;
		}

		if (this._universe === null) {
			if (this.parent === null) {
				console.log(
					'WARNING: Root has no universe! If you see this error, try saving the file and opening it in a new tab.'
				);
				return [];
			}
			// Return the parent's universe
			return this.tree.nodes[this.parent].universe;
		}
		// Return a copy of the universe
		return Array.from(this._universe);
	}

	set universe(newUniverse: Formula[] | null) {
		this._universe = newUniverse;

		// Invalidate the correct decomposition of this statement because
		// the universe was updated
		if (this.statement instanceof QuantifierStatement) {
			this._correctDecomposition = null;
		}

		// Invalidate the correct decomposition of antecedents that are
		// quantifiers as well
		if (this.antecedent !== null) {
			const antecedentNode = this.tree.nodes[this.antecedent];
			if (antecedentNode.statement instanceof QuantifierStatement) {
				antecedentNode._correctDecomposition = null;
			}
		}
	}

	/**
	 * Calculates which variables are introduced by this statement
	 * @returns the new formulas instantiated by this
	 */
	getInstantiations(): Formula[] {
		if (this.statement === null) {
			return [];
		}

		let universe: Formula[] = [];
		if (this.parent !== null) {
			universe = this.tree.nodes[this.parent].universe!;
		}

		console.log(this.statement.getNewConstants(universe));

		return this.statement.getNewConstants(universe);
	}

	/**
	 * Down-propogates the universe, updating as statements introduce new
	 * constants.
	 */
	calculateUniverse() {
		this.calculateUniverseHelper(null);
	}

	/**
	 * Down-propogates the universe, updating as statements introduce new
	 * constants
	 *
	 * @param universe the universe to propogate or null if it should propogate
	 * its parents universe
	 */
	private calculateUniverseHelper(universe: Formula[] | null = null) {
		// If the universe is null, grab the parent's universe so we can begin
		// propogation starting at this node.
		if (universe === null) {
			if (this.parent !== null) {
				universe = this.tree.nodes[this.parent].universe!;
			} else {
				universe = [];
			}
		}

		// Initialize everything to its parent
		if (this._universe === undefined) {
			this._universe = universe;
		}

		if (this.statement !== null) {
			// If the statement is non-null, check if it adds new constants
			const newConstants = this.statement.getNewConstants(universe);

			// Update the universe of this node
			for (const constant of newConstants) {
				universe.push(constant);
			}

			if (newConstants.length > 0 || this.parent === null) {
				// New constants means create a larger universe. The root must
				// be non-null as well.
				this.universe = universe;
			} else {
				// No new constants AND not the root => copy the parent
				this.universe = null;
			}
		} else {
			// Otherwise this node cannot introduce new constants, so just
			// copy the parent's universe.
			if (this.parent === null) {
				// No parent universe to copy, so create an empty universe
				this.universe = [];
			} else {
				this.universe = null;
			}
		}

		// Propogate the universe down with a COPY of this universe
		for (const childId of this.children) {
			this.tree.nodes[childId].calculateUniverseHelper(Array.from(universe));
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

		if (this.statement instanceof UniversalStatement) {
			// This will occur due to the way that get/set are implemented under
			// the hood. When a setter is called, it attempts to access the old
			// value using the getter, which will trigger this code flow.
			// It is not harmful but still not intended.
			console.error(
				'This error can likely be ignored: Universal statements do ' +
					'not have correct decompositions'
			);
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

			// Get to a node whose parent is the node that is branched on
			// i.e. the node whose children make up the decomposition
			const node = this.tree.nodes[nodeId];
			if (node.parent === null) {
				throw new Error(
					`The result of a decomposition has no parent. See node ${nodeId}`
				);
			}

			// Can change this later to be more flexible wrt where the
			// decomposition can occur within the branch itself
			if (this.decomposition.has(node.parent)) {
				visited.add(nodeId);
				continue;
			}

			// The decomposition does not include the current node's parent

			// Collect the branches that make up the decomposition including
			// this node.
			const branches: number[][] = [];
			let isCorrect = true;

			for (const childId of this.tree.nodes[node.parent].children) {
				// If this child has already been visited, then this branch is
				// already explored; but, this should never happen
				if (visited.has(childId)) {
					throw new Error('Reached an already visited node in child branch.');
				}
				const thisBranch: number[] = [];
				// Collect nodes in this branch, descending
				let current: TruthTreeNode = this.tree.nodes[childId];
				let isLastBeforeSplit = current.children.length !== 1;

				while (current.children.length === 1 || isLastBeforeSplit) {
					// Only add nodes that are marked as part of the
					// decomposition.
					if (this.decomposition.has(current.id)) {
						// This node has now been visited
						visited.add(current.id);

						// Invalid/empty statements cannot form part of a
						// correct decomposition
						if (current.statement === null) {
							isCorrect = false;
						} else if (isCorrect) {
							// This is a part of the decomposition, so add them
							thisBranch.push(current.id);
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

			// Validate that the branches form a correct decomposition
			let validBranches = false;
			if (this.statement instanceof ExistenceStatement) {
				// Guaranteed that each branch is exactly one node
				for (const branch of branches) {
					if (branch.length !== 1) {
						validBranches = false;
						break;
					}

					const node = this.tree.nodes[branch[0]];
					if (
						node.getInstantiations().length >= this.statement.variables.length
					) {
						validBranches = true;
					}
				}
			} else {
				const statementBranches: Statement[][] = [];
				for (const branch of branches) {
					const thisBranch: Statement[] = [];
					for (const id of branch) {
						// An ID is only added to the branch if it is non-null
						thisBranch.push(this.tree.nodes[id].statement!);
					}
					statementBranches.push(thisBranch);
				}

				validBranches = this.statement.hasDecomposition(statementBranches);
			}

			// If the branches are correct, add them
			if (validBranches) {
				for (const branch of branches) {
					for (const id of branch) {
						this._correctDecomposition.add(id);
					}
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

	isDPValid(): Response {
		// For DP: check statement logically follows from antecedent using branch

		if (!this._statement) {
			// TODO: change error
			return new CorrectnessError('not_parsable');
		}

		let antecedentArr = Array.from(this.antecedentsDP);

		if (antecedentArr.length == 2) {
			let left = antecedentArr[0];
			let right = antecedentArr[1];
			let leftNode = this.tree.nodes[left];
			let rightNode = this.tree.nodes[right];

			if (leftNode._statement && rightNode._statement) {
				// Validator takes in statement we would like to reduce along with assertion
				let statementReducer = new DPStatementValidator(
					leftNode._statement,
					rightNode._statement
				);
				let statementReducer2 = new DPStatementValidator(
					rightNode._statement,
					leftNode._statement
				);
				let res1 = statementReducer.validateReduction(this._statement);
				let res2 = statementReducer2.validateReduction(this._statement);

				if (res1 || res2) {
					return true;
				}
			}
		}
		// TODO: change error
		return new CorrectnessError('not_logical_consequence');
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
				return new CorrectnessError('terminator_not_last');
			}

			if (this.isOpenTerminator()) {
				return this.isOpenTerminatorValid();
			}
			// Is a closed terminator
			return this.isClosedTerminatorValid();
		}

		if (this.statement === null) {
			// If the text could not be parsed into a statement, then the
			// statement is valid if and only if the text is empty
			if (this.text.trim().length === 0) {
				return true;
			}

			return new CorrectnessError('not_parsable');
		}

		if (this.premise) {
			// Premises are always valid
			return true;
		}

		if (this.isTautology) {
			// Tautologies are always valid
			return true;
		}

		if (getDPMode() && this.isDPValid() === true) {
			return true;
		}

		// Non-premises must have an antecedent for this statement to be valid
		if (this.antecedent === null || !(this.antecedent in this.tree.nodes)) {
			return new CorrectnessError('not_logical_consequence');
		}

		// The antecedent must have been successfully parsed into a statement
		const antecedentNode = this.tree.nodes[this.antecedent];
		if (antecedentNode.statement === null) {
			// Cannot be a logical consequence of nothing
			return new CorrectnessError('not_logical_consequence');
		}

		// The antecedent must be in the ancestor branch
		if (!this.getAncestorBranch().has(this.antecedent)) {
			return new CorrectnessError('not_logical_consequence');
		}

		// If the antecedent is a quantifier, there is a different procedure:
		// check if the statement is an instantiated version of the quantifier
		if (antecedentNode.statement instanceof QuantifierStatement) {
			if (!antecedentNode.statement.symbolized().equals(this.statement)) {
				// Not a valid instantiation of the quantifier.
				return new CorrectnessError('invalid_instantiation');
			}

			return true;
		}

		// Check if the node is a logical consequence of the antecedent
		if (antecedentNode.correctDecomposition!.has(this.id)) {
			return true;
		}

		return new CorrectnessError('not_logical_consequence');
	}

	/**
	 * Determines whether or not this node is valid assuming it is an open
	 * terminator. An open terminator is valid if and only if every statement
	 * from the root of the tree to the terminator is both valid and decomposed.
	 * @returns true if this open terminator is valid, false otherwise
	 */
	private isOpenTerminatorValid(): Response {
		// Keep track of every Atomic and negation of an Atomic
		const contradictionMap: Set<string> = new Set();

		if (this.decomposition.size !== 0) {
			return new CorrectnessError('open_decomposed');
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
					return new CorrectnessError('open_contradiction');
				}

				// Otherwise, store this statement for possible future
				// contradictions
				if (ancestorStatement instanceof AtomicStatement) {
					contradictionMap.add(new NotStatement(ancestorStatement).toString());
				} else {
					contradictionMap.add(ancestorStatement.operand.toString());
				}
			}

			// Check if each ancestor is valid
			const ancestorValidity = ancestorNode.isValid();
			if (ancestorValidity !== true) {
				return new CorrectnessError('open_invalid_ancestor');
			}

			// Check if each ancestor is decomposed
			const ancestorDecomposed = ancestorNode.isDecomposed();
			if (ancestorDecomposed !== true) {
				return new CorrectnessError('open_invalid_ancestor');
			}
		}

		return true;
	}

	/**
	 * Determines whether or not this node is valid assuming it is a closed
	 * terminator. A closed terminator is valid if and only if the two
	 * statements that it references are a literal and its negation and are both
	 * valid.
	 * @returns true if this closed terminator is valid, false otherwise
	 */
	private isClosedTerminatorValid(): Response {
		if (
			getDPMode() &&
			this.antecedent &&
			this.tree.nodes[this.antecedent].statement instanceof Contradiction
		) {
			return true;
		}

		// Closed terminators must reference exactly two statements
		if (!(this.decomposition.size == 2 || (getDPMode() && this.antecedentsDP.size == 2))) {
			return new CorrectnessError('closed_reference_length');
		}

		let decomposed_statements = [];

		if (getDPMode()) {
			decomposed_statements = [...this.antecedentsDP].map(
				id => this.tree.nodes[id].statement
			);
		} else {
			decomposed_statements = [...this.decomposition].map(
				id => this.tree.nodes[id].statement
			);
		}

		for (let i = 0; i < 2; ++i) {
			const first = decomposed_statements[i];
			const second = decomposed_statements[1 - i];

			if (first === null || second === null) {
				// This should never happen
				return new CorrectnessError('closed_reference_invalid');
			}

			// The referenced statements must be a statement and its negation
			if (first instanceof NotStatement && first.operand.equals(second)) {
				if (
					this.tree.options.requireAtomicContradiction &&
					!(second instanceof AtomicStatement)
				) {
					return new CorrectnessError('closed_not_atomic');
				}

				// The referenced statements must also be ancestors of the
				// closed terminator and valid
				const ancestorBranch = this.getAncestorBranch();
				for (const id of this.decomposition) {
					if (!ancestorBranch.has(id)) {
						return new CorrectnessError('closed_not_ancestor');
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

		return new CorrectnessError('closed_not_contradiction');
	}

	/**
	 * Determines whether or not a statement has been reduced completely. This is
	 * done by checking to make sure every statement in its decomposition is valid.
	 * @returns true if this statement is fully reduced, false otherwise
	 */
	isReduced(): Response {
		// We would like to check the two decompositions are correct
		const decompArray = Array.from(this.decomposition);
		if (decompArray.length != 2) {
			return new CorrectnessError('invalid_decomposition');
		}
		const s1 = this.tree.nodes[decompArray[0]];
		const s2 = this.tree.nodes[decompArray[1]];
		if (s1.isDPValid() && s2.isDPValid()) {
			return true;
		}
		return new CorrectnessError('invalid_decomposition');
	}

	/**
	 * Determines whether or not this statement is fully decomposed in every
	 * open branch.
	 * @returns true if this statement is decomposed, false otherwise
	 */
	isDecomposed(): Response {
		// Null statements are decomposed only if they are terminators or empty
		// strings
		if (this.statement === null) {
			// Case 1: Empty string
			if (this.text.trim().length === 0) {
				return true;
			}

			// Case 2: Terminator
			if (this.isTerminator()) {
				return true;
			}

			// Otherwise, it failed to parse but is not one of the above cases
			return new CorrectnessError('not_parsable');
		}

		// A statement with no decomposition is vacuously decomposed
		const expectedDecomposition = this.statement.decompose();
		if (expectedDecomposition.length === 0) {
			return true;
		}

		// Every node in the decomposition must be in a child branch of this
		// node.
		for (const decomposedId of this.decomposition) {
			if (!this.isAncestorOf(decomposedId)) {
				return new CorrectnessError('reference_not_after');
			}
		}

		if (getDPMode() == true) {
			return this.isReduced();
		}

		// This statement must be decomposed in every non-closed branch that
		// contains it or exactly one open node if requireAllBranchesTerminated
		// is false
		let error: CorrectnessError | null = null;
		for (const leafId of this.tree.leaves) {
			const leafNode = this.tree.nodes[leafId];
			let leafError: CorrectnessError | null = null;

			// If this is an existence statement, we care that it is correctly
			// decomposed everywhere, not just non-closed terminators
			if (
				!(this.statement instanceof ExistenceStatement) &&
				leafNode.isClosedTerminator()
			) {
				continue;
			}

			// This statement must be contained in the leaf's branch
			if (!(this.isAncestorOf(leafId) || this.id === leafId)) {
				continue;
			}
			const branch = leafNode.getAncestorBranch(true);

			// Universals are unique from other statements
			if (this.statement instanceof UniversalStatement) {
				// For universal statements, each branch needs to instantiate
				// every single constant in the leaf's universe

				// Collect the decomposed nodes in this branch
				const decomposedInBranch = new Set<number>();
				for (const decomposed of this.decomposition) {
					if (branch.has(decomposed)) {
						decomposedInBranch.add(decomposed);
					}
				}

				// Each universal must instantiate at least one variable.
				if (decomposedInBranch.size === 0) {
					error = new CorrectnessError('universal_decompose_length');
					continue;
				}

				const symbolized = this.statement.symbolized();

				// Form every possible assignment of constants for this universal
				const uninstantiated = createNDimensionalMapping(
					this.statement.variables.length,
					leafNode.universe!
				);

				// Remove every assignment from our mapping that appears in the branch
				for (const decomposed of decomposedInBranch) {
					const decomposedNode = this.tree.nodes[decomposed];
					if (decomposedNode.statement === null) {
						// An empty statement cannot be a decomposition
						leafError = new CorrectnessError('invalid_decomposition');
						break;
					}

					const assignment = symbolized.getEqualsMap(decomposedNode.statement);
					if (assignment === false) {
						// Not an initialization of the antecedent
						leafError = new CorrectnessError('invalid_decomposition');
						break;
					}

					if (
						Object.keys(assignment).length !== this.statement.variables.length
					) {
						// If the assignment does not have an assignment for every variable
						// then arbitrarily assign a value from the universe. If one doesn't
						// exist then arbitrarily assign the constant 'x'

						let value: Formula;
						// Check universe for arbitrarily value
						if (leafNode.universe!.length > 0) {
							value = leafNode.universe!.values().next().value;
						} else {
							value = new Formula('x');
						}

						for (const variable of this.statement.variables) {
							if (Object.keys(assignment).includes(variable.toString())) {
								continue;
							}
							assignment[variable.toString()] = value;
						}
					}

					deleteMapping(uninstantiated, assignment, this.statement.variables);
				}

				if (leafError !== null) {
					error = leafError;
					continue;
				}

				// If there are still assignments left, then we did not instantiate every
				// possible assignment of constants in this branch
				if (Object.keys(uninstantiated).length !== 0) {
					const mapping = getFirstUnassigned(uninstantiated)!;
					leafError = new CorrectnessError(
						'universal_domain_not_decomposed',
						mapping
					);
				}
			} else {
				// Check if the correct decomposition is in this branch
				let containedInBranch = false;
				for (const correctlyDecomposedNode of this.correctDecomposition!) {
					if (branch.has(correctlyDecomposedNode)) {
						containedInBranch = true;
						break;
					}
				}

				if (!containedInBranch) {
					// This node is not decomposed in every non-closed branch
					if (this.statement instanceof ExistenceStatement) {
						leafError = new CorrectnessError('existence_instantiation_length');
					} else {
						leafError = new CorrectnessError('invalid_decomposition');
					}
				} else if (this.decomposition.size > this.correctDecomposition!.size) {
					leafError = new CorrectnessError('existence_instantiation_violation');
				}
			}

			if (leafError === null) {
				// If we have a valid open terminator and don't require all branches to
				// be terminated, then we can just return that it works!
				if (
					leafNode.isOpenTerminator() &&
					!this.tree.options.requireAllBranchesTerminated
				) {
					return true;
				}
			} else {
				// Save the error
				error = leafError;
			}
		}

		if (error !== null) {
			return error;
		}

		return true;
	}

	getFeedback(): string {
		const validity = this.isValid();
		if (validity !== true) {
			return validity.getErrorMessage();
		}
		const decomp = this.isDecomposed();
		if (decomp !== true) {
			return decomp.getErrorMessage();
		}
		if (this.premise) {
			return 'This statement is a premise.';
		}
		if (this.isTautology) {
			return 'This statement is a tautology.';
		}

		if (this.isTerminator()) {
			if (this.isOpenTerminator()) {
				return 'This open branch represents a valid assignment.';
			}
			return 'This branch is successfully closed.';
		}

		if(getDPMode()==false){
			return 'This statement is a logical consequence and is decomposed correctly.';
		}else{
			return 'This statement is a logical inference and is reduced correctly.';
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

	// Inner representation
	nodes: {[id: number]: TruthTreeNode} = {};
	private _root: number | undefined;
	leaves: Set<number> = new Set();

	initialized = true;

	// Controls which truth tree extensions are allowed
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
			requireAllBranchesTerminated:
				this.options['requireAllBranchesTerminated'],
			lockedOptions: this.options['lockedOptions'],
		};

		// Calculate the universe for each node
		newTree.calculateUniverse();
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
		tree.nodes[0].calculateUniverse();
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
		} catch (e: any) {
			throw new Error(
				`TruthTree#deserialize: The tree does not match the format: ${e.message}`
			);
		}

		// Grab the options
		newTree.options = parsed['options'];

		// Load the universe
		newTree.calculateUniverse();

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
				antecedentsDP: [...node.antecedentsDP], // TODO: add other DP mode variables here
				isBranchLiteral: node.isBranchLiteral
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
	 * @returns the id of the node at the bottom of the branch containing the
	 * node whose id is `id`
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
			// queue is non-empty, so we can guarantee that shift() does not
			// return undefined
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
	 * Determines whether current node is a leaf node. A leaf node has no
	 * children
	 * @param root the id of the root of the subtree
	 * @returns true if root is leaf node, false otherwise
	 */
	isLeafNode(root: number | null): boolean {
		let node = this.getNode(root);
		if (node === null) {
			return false;
		}
		return node.children.length === 0;
	}

	/**
	 * Returns the leftmost node in the subtree rooted at a given node, or the
	 * entire tree if no node is specified.
	 * @param root the id of the root of the subtree
	 * @returns the leftmost node
	 */
	leftmostNode(root?: number | null): TruthTreeNode | null {
		let node =
			typeof root === 'number' ? this.getNode(root) : this.getNode(this.root);
		if (node === null) {
			return null;
		}

		// Move down the tree, preferring the leftmost child if there are
		// multiple
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
	rightmostNode(root?: number | null): TruthTreeNode | null {
		let node =
			typeof root === 'number' ? this.getNode(root) : this.getNode(this.root);
		if (node === null) {
			return null;
		}

		// Move down the tree, preferring the rightmost child if there are
		// multiple
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
		}

		// Calculate the universe for the new node
		newNode.calculateUniverse();

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

		const newNode = this.nodes[newId];
		newNode.parent = parentId;

		// Update leaves set
		if (this.leaves.has(parentId)) {
			this.leaves.delete(parentId);
			this.leaves.add(newId);
		}

		if (newBranch) {
			// New Branch => just add a new child
			parentNode.children.push(newId);
			// The only node in a branch must be a leaf
			this.leaves.add(newId);
			// Have to calculate the universe for that node
			newNode.calculateUniverse();

			return newId;
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
		newNode.calculateUniverse();

		return newId;
	}

	/**
	 * Deletes a node. A node can only be deleted if it is not the root of a
	 * branch with multiple children; in other words, this function cannot
	 * delete the only node in a branch.
	 * @param id the id of the node to delete
	 * @returns null if the node could not be deleted; otherwise, if the node
	 * has one child, returns the id of that child; if the node has multiple
	 * children, returns the id of the deleted node's parent
	 */
	deleteNode(id: number): number | null {
		if (!(id in this.nodes)) {
			console.error(
				'TruthTree#deleteNode: Could not delete a node that does not exist'
			);
			return null;
		}
		const node = this.nodes[id];

		if (node.parent === null) {
			// If the node has no parent, then it is the root of the tree
			if (node.children.length !== 1) {
				// If the node has multiple children, then don't delete it
				return null;
			}

			// The node has no parent and exactly one child, so delete this node
			// (and make its sole child the new root of the tree)
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

		// Update child universes
		if (node.statement !== null) {
			for (const childId of node.children) {
				// Propogate the universe w/o the constants added by this node
				this.nodes[childId].calculateUniverse();
			}
		}

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
	isCorrect(): EvaluationResponse {
		if (!this.checkRepresentation()) {
			return {
				value: false,
				message:
					'This tree is malformed -- please save this tree and contact a developer.',
			};
		}

		// Refresh the universe to ensure it's correct before giving a result
		this.calculateUniverse();

		let hasValidOpenTerm = false;

		// All nodes always have to be valid in order for the tree to be
		// correct.
		for (const node of Object.values(this.nodes)) {
			// All nodes must be valid
			const nodeValidity = node.isValid();
			if (nodeValidity !== true) {
				return {value: false, message: 'This tree is incorrect.'};
			}

			if (this.leaves.has(node.id)) {
				if (this.options.requireAllBranchesTerminated) {
					// Require all leaves to be terminators
					if (!node.isTerminator()) {
						return {value: false, message: 'Every branch must be terminated.'};
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
			return {value: true, message: 'This tree is correct!'};
		}

		// Otherwise, every leaf must be a terminator of some kind
		for (const leafId of this.leaves) {
			const leaf = this.nodes[leafId];

			if (!leaf.isTerminator()) {
				if (this.options.requireAllBranchesTerminated) {
					return {
						value: false,
						message:
							'Every branch must be closed or there must be at least one open branch.',
					};
				}
				return {value: false, message: 'Every branch must be terminated.'};
			}
		}

		return {value: true, message: 'This tree is correct!'};
	}

	/**
	 * Determines whether or not this tree extends `base`, which occurs when
	 * this tree contains all of the branches of `base` (likely with additional
	 * nodes).
	 * @param base the original tree
	 * @returns true if this tree extends `base`, false otherwise
	 */
	extends(base: TruthTree): boolean {
		// Require all options to be the same
		const sameOptions = (
			Object.keys(this.options) as (keyof TreeOptions)[]
		).every(option => this.options[option] === base.options[option]);
		if (!sameOptions) {
			return false;
		}

		// Require the branches of this tree to extend those of `base`
		return this.extendsHelper(this.root, base.root, base);
	}

	/**
	 * Recursively checks branches of the assigned and submitted trees for
	 * structural and premise matching.
	 * @param thisNodeId node id of the head of the branch from submitted tree
	 * @param baseNodeId node id of the head of the branch from assigned tree
	 * @param base the assigned tree
	 * @returns whether or not the submitted tree's branch has the same structure
	 * and premises as the assigned tree
	 */
	private extendsHelper(
		thisNodeId: number,
		baseNodeId: number | null,
		base: TruthTree
	): boolean {
		// Get this branch from both trees
		let thisNode = this.getNode(thisNodeId)!;
		let baseNode: TruthTreeNode | null = base.getNode(baseNodeId);

		// If we start on a non-null node, then the branch cannot be exhausted yet
		let baseBranchExhausted = baseNode === null;
		let isLastBeforeSplit = thisNode.children.length !== 1;

		// Traverse the current branch across both trees in tandem
		while (thisNode.children.length === 1 || isLastBeforeSplit) {
			// Assigned nodes always have a statement
			if (thisNode.statement !== null) {
				// If the base branch still has assigned nodes to match and this node matches
				if (
					!baseBranchExhausted &&
					baseNode !== null &&
					thisNode.statement.equals(baseNode.statement!)
				) {
					// Since it matches an assigned node, they either both are or are not premises
					if (thisNode.premise !== baseNode.premise) {
						return false;
					}

					// Get the next base node if it exists
					// Otherwise mark the base branch as exhausted
					if (baseNode.children.length === 1) {
						baseNode = base.getNode(baseNode.children[0])!;
					} else {
						baseBranchExhausted = true;
					}
				} else {
					// Any statement that doesn't match the assigned cannot be
					// a premise (i.e., students cannot add their own premises)
					if (thisNode.premise) {
						return false;
					}
				}
			}

			if (isLastBeforeSplit) {
				isLastBeforeSplit = false;
			} else {
				thisNode = this.getNode(thisNode.children[0])!;
				isLastBeforeSplit = thisNode.children.length !== 1;
			}
		}

		// This branch must include all of the nodes from the base branch
		if (!baseBranchExhausted) {
			return false;
		}

		// If baseNode has no more children, we are at the end of this subtree,
		// so we can just check for student-added premises now
		if (baseNode === null || baseNode.children.length === 0) {
			for (const thisChildId of thisNode.children) {
				if (!this.extendsHelper(thisChildId, null, base)) {
					return false;
				}
			}
		} else {
			// Must branch the same number of times as assigned
			if (baseNode.children.length !== thisNode.children.length) {
				return false;
			}
			for (let index = 0; index < thisNode.children.length; ++index) {
				// The subtree must match (with the same order!)
				if (
					!this.extendsHelper(
						thisNode.children[index],
						baseNode.children[index],
						base
					)
				) {
					return false;
				}
			}
		}

		return true;
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

				if (node.antecedent === node.id) {
					console.log(`${node.id} is its own antecedent.`);
					return false;
				}

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
				if (decomposedId === node.id) {
					console.log(`${node.id} is in its own decomposition.`);
					return false;
				}
				const decomposedNode = this.nodes[decomposedId];

				// Don't worry about a contradiction's antecedents since it technically
				// has more than one
				if (getDPMode() && decomposedNode.statement instanceof Contradiction) {
					continue;
				}

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
	calculateUniverse() {
		this.nodes[this.root].calculateUniverse();
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
