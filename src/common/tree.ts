class TruthTreeNode {
	statement: string = null;
	tree: TruthTree = null;
	premise = false;
	nodeId: number = null;
	parent: number = null;
	children: number[] = [];
	antecedent: number = null;
	decomposition: number[] = [];

	constructor(statement: string, tree: TruthTree) {
		this.statement = statement;
		this.tree = tree;
	}

	isValid(): boolean {
		if (this.premise) {
			// premises are assumed true
			return true;
		}

		// terminators are a special case
		if (TruthTree.TERMINATORS.includes(this.statement)) {
			if (this.statement === TruthTree.OPEN_TERMINATOR) {
				// open branch

				let current: TruthTreeNode = this;
				while (current.parent !== null) {
					current = this.tree.adjList[current.parent];
					// dprint(f"Now checking `{current.statement}` for decomposition and validity")
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

			const decomposedStmts = [];
			for (const nodeId of this.decomposition) {
				decomposedStmts.push(this.tree.parseNodeStatement(nodeId));
			}
			// dprint(f"Checking if statements {decomp_stmts} form a valid contradiction.")

			for (let i = 0; i < 2; ++i) {
				const a = decomposedStmts[i];
				const b = decomposedStmts[i - 1];

				if (a instanceof NotStatement && a.operand === b) {
					if (!(b instanceof AtomicStatement)) {
						// print(f"Invalid: Contradiction must occur on atomic statements.")
						return false;
					}

					const thisBranch = this.getAncestorBranch();

					const invalidNodes = [];
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
						if (!this.tree.adjList[nodeId].isValid()) {
							return false;
						}
					}
					return true;
				}
			}
			// print(f"Invalid: Contradictions do not match")
			return false;
		}

		// non-terminators without children are never valid
		if (!this.children) {
			// print(f"Invalid: node {self.node_id} is a leaf node but not a terminator.")
			return false;
		}

		// non-premises without antecedents are never valid
		if (this.antecedent === null) {
			// print(f"Invalid: node {self.node_id} is not a logical consequence of a previous statement.")
			return false;
		}

		const parsedSource = this.tree.parseNodeStatement(this.antecedent);

		const parsedStmt = this.tree.parseNodeStatement(this.nodeId);

		// dprint(f"Checking if {parsed_stmt} is an element of a branch of {valid_decomp}")

		if (!parsedStmt.isMemberOfDecomp(parsedSource)) {
			// print(f"Invalid: {self.node_id} is not a logical consequence of the marked antecedent.")
			return false;
		}

		return true;
	}

	isDecomposed(): boolean {
		const parsed = this.tree.parseNodeStatement(this.nodeId);
		const expectedDecomp = parsed.decompose();

		if (expectedDecomp === []) {
			// no decomposition means it is vacuously decomposed
			return true;
		}

		// ensure the decomposition is in every open branch
		for (const openTermId of this.tree.leaves) {
			const openTerm = this.tree.adjList[openTermId];

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
		const branch: number[] = [this.nodeId];
		let current: TruthTreeNode = this;
		while (current.parent !== null) {
			branch.push(current.parent);
			current = this.tree.adjList[current.parent];
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

	leaves: Set<number>;
	adjList: {[id: number]: TruthTreeNode};
	parser: PL_Parser;

	constructor() {
		this.parser = new PL_Parser();
		this.leaves = new Set();
	}

	fromWillowFile() {
		// for loading a truth tree...
	}

	isCorrect(): boolean {
		for (const leaf of this.leaves) {
			const leafNode = this.adjList[leaf];
			if (TruthTree.TERMINATORS.includes(leafNode.statement)) {
				// print(f"Invalid: leaf nodes must be terminators.")
				return false;
			}
			if (!leafNode.isValid()) {
				return false;
			}
		}

		return true;
	}

	isValid(): boolean {
		// for validation checking, unnecessary now.
		return true;
	}

	parseNodeStatement(nodeId): Statement {
		// parses the statement at node `nodeId`
		return this.parser.parse(this.adjList[nodeId].statement);
	}
}
