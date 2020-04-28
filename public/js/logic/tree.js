class TreeNode {
  /**
   * Constructs a {@link TreeNode}.
   * 
   * @param {String[]} [statements=[]] the logic statements within the node
   * @param {TreeNode[]} [children=[]] the children of the node
   */
  constructor(statements, children) {
    // default value of both arguments is an empty array
    this.statements = statements || [];
    // convert any string statements to objects
    for (let i = 0; i < this.statements.length; ++i) {
      const statement = this.statements[i];
      if (typeof statement === "string" || statement instanceof String) {
        this.statements[i] = {
          str: statement,
          premise: false,
          references: [],
        };
      }
    }

    this.children = children || [];
    this.correctlyDecomposed = {};
  }

  /**
   * Parses a raw object into a {@link TreeNode} instance.
   * 
   * @param {Object} obj the raw object
   * @returns {TreeNode} the parsed TreeNode instance 
   */
  static fromObject(obj) {
    return new TreeNode(
        obj.statements,
        obj.children.map(child => TreeNode.fromObject(child))
    );
  }

  /**
   * @returns {number} the width of the tree rooted at this node
   */
  get width() {
    if (this.children.length === 0) {
      // if this is a leaf node, the width is 1
      return 1;
    }
    let width = 0;
    // if this is a non-leaf node, then its width is the sum of the widths of its
    // children
    for (const child of this.children) {
      width += child.width;
    }
    return width;
  }

  /**
   * @returns {TreeNode} the last (rightmost) leaf node in the tree rooted at this
   * node
   */
  get lastLeaf() {
    // start at this node
    let node = this;
    while (node.children.length > 0) {
      // move to the rightmost child until we reach a leaf node
      node = node.children[node.children.length - 1];
    }
    return node;
  }

  /**
   * Returns whether or not the statement at a given offset is a premise or not.
   * 
   * @param {Number} offset the offset of the statement
   * @returns {Boolean} if the statement is a premise or not 
   */
  isPremise(offset) {
    return this.statements[offset].premise;
  }

  /**
   * Determines if the statement at the given offset is valid or not.
   * 
   * @param {Number[]} branches the branch indices for this node
   * @param {Number} offset the offset of the statement
   */
  isValid(branches, offset) {
    const statementStr = this.statements[offset].str;
    if (statementStr.length === 0) {
      // an empty statement is always valid
      return true;
    }

    const references = Array.from(
        this.statements[offset].references,
        JSON.parse
    );
    if (statementStr === "◯") {
      if (offset !== this.statements.length - 1) {
        // a terminator must be the last statement in the branch
        return {error: "terminator_not_last"};
      }

      // check every ancestor statement
      const ancestorBranches = [];
      while (ancestorBranches.length <= branches.length) {
        const ancestor = root.node.child(ancestorBranches);
        for (let i = 0; i < ancestor.statements.length; ++i) {
          if (
              ancestorBranches.length === branches.length
              && i === ancestor.statements.length - 1
          ) {
            // prevent self-dependence
            continue;
          }
          if (ancestor.isValid(ancestorBranches, i) !== true) {
            // if any ancestor statement is invalid, then this open terminator is
            // invalid
            return {error: "open_invalid_ancestor"};
          }
        }
        ancestorBranches.push(branches[ancestorBranches.length]);
      }
      // if all ancestor statements are valid, then this open terminator is valid
      return true;
    } else if (statementStr === "×") {
      if (offset !== this.statements.length - 1) {
        // a terminator must be the last statement in the branch
        return {error: "terminator_not_last"};
      }
      if (references.length !== 2) {
        // a close terminator must have exactly two references
        return {error: "closed_reference_length"};
      }
      // all references must be ancestors of the terminator
      for (const reference of references) {
        if (!isAncestor({branches: branches, offset: offset}, reference)) {
          return {error: "closed_not_ancestor"}
        }
        const refNode = root.node.child(reference.branches);
        if (
            !refNode.isPremise(reference.offset)
            && refNode.isValid(reference.branches, reference.offset) !== true
        ) {
          return {error: "closed_reference_invalid"};
        }
      }

      const statements = references.map(reference => parseStatement(
          root.node.child(reference.branches).statements[reference.offset].str)
      );
      // the terminator is valid if the references are a literal and its negation
      if (statements[0] instanceof AtomicStatement && (
          statements[1].toString()
          === new NotStatement(statements[0]).toString()
      )) {
        return true;
      } else if (statements[0] instanceof NotStatement && (
          statements[1].toString() === statements[0].operand.toString()
      )) {
        return true;
      }
      // otherwise, the terminator is invalid
      return {error: "closed_not_negation"};
    }

    // determine if this statement is a logical consequence of some other
    // statement
    const referenceStr = JSON.stringify({branches: branches, offset: offset});
    let consequence = this.isPremise(offset);

    const ancestorBranches = [];
    while (ancestorBranches.length <= branches.length && !consequence) {
      const ancestor = root.node.child(ancestorBranches);
      const end = ancestorBranches.length === branches.length
          ? offset
          : ancestor.statements.length;
      for (let i = 0; i < end; ++i) {
        if (ancestor.statements[i].references.includes(referenceStr) && (
            ancestor.isValid(ancestorBranches, i) === true
        )) {
          // if this statement is referenced by a valid ancestor, then it is a
          // logical consequence
          consequence = true;
          break;
        }
      }
      ancestorBranches.push(branches[ancestorBranches.length]);
    }
    if (!consequence) {
      // if this statement is not a logical consequence of some other statement,
      // then it is invalid
      return {error: "not_logical_consequence"};
    }

    const statement = parseStatement(statementStr);
    // if this statement is not a terminator, verify that there are no backwards
    // references
    for (const reference of references) {
      if (!arrayStartsWith(reference.branches, branches) || (
          JSON.stringify(reference.branches) === JSON.stringify(branches)
          && reference.offset <= offset
      )) {
        return {error: "reference_not_after"};
      }
    }

    const decomposition = normalize(recursiveMap(
        statement.decompose(),
        el => el.toString()
    ));
    if (validateDecomposition(decomposition, references, branches, this)) {
      return true;
    }
    return {error: "invalid_decomposition"};
  }

  /**
   * Determines if a node is closed or not. A node is closed iff it has a valid
   * close terminator or all of its grandchildren are closed.
   * 
   * @param {Number[]} branches the branch indices for this node 
   * @returns {Boolean} if this node is closed, as defined above
   */
  isClosed(branches) {
    // search for the close terminator in this branch
    let closeIdx = -1;
    for (let i = 0; i < this.statements.length; ++i) {
      if (this.statements[i].str === "×") {
        closeIdx = i;
        break;
      }
    }

    if (closeIdx === -1) {
      // if this node does not contain a close terminator, check all of its
      // grandchildren
      if (this.children.length === 0) {
        // if this node has no children, then it cannot possibly be closed
        return false;
      }
      return this.children.every(
          (child, idx) => child.isClosed([...branches, idx])
      );
    }

    // otherwise, this node has a close terminator, so make sure it's valid
    return this.isValid(branches, closeIdx) === true;
  }

  /**
   * Returns the string that should be displayed when hovering over the validity
   * indicator for a statement.
   * 
   * @param {Number[]} branches the branch indices for this node 
   * @param {*} offset the offset of the statement
   * @returns {String} the title attribute for this statement, as described above
   */
  getTitle(branches, offset) {
    if (this.isPremise(offset)) {
      return "This statement is a premise.";
    }
    const result = this.isValid(branches, offset);
    if (result === true) {
      if (
          this.statements[offset].str === "◯"
          || this.statements[offset].str === "×"
      ) {
        return "This terminator is correct.";
      }
      return "This statement is a logical consequence and is decomposed"
          + " correctly.";
    }
    if (this.isClosed(branches)) {
      return "This statement is in a closed branch, so it does not need to be"
          + " decomposed.";
    }
    
    if (result.error === "terminator_not_last") {
      return "A branch terminator must be the last statement in a branch.";
    } else if (result.error === "open_invalid_ancestor") {
      return "This branch contains statements that are not correctly"
          + " decomposed.";
    } else if (result.error === "closed_reference_length") {
      return "A closing terminator must reference exactly two statements.";
    } else if (result.error === "closed_not_ancestor") {
      return "A closing terminator must only reference statements that occur"
          + " before it.";
    } else if (result.error === "closed_reference_invalid") {
      return "The referenced statements must be valid.";
    } else if (result.error === "closed_not_negation") {
      return "The referenced statements must consist of a literal and its"
          + " negation.";
    } else if (result.error === "not_logical_consequence") {
      return "This statement is not a logical consequence of a statement that"
          + " occurs before it.";
    } else if (result.error === "reference_not_after") {
      return "A statement must decompose into statements that occur after it.";
    } else if (result.error === "invalid_decomposition") {
      return "This statement is not decomposed correctly.";
    }
    return "This statement is invalid.";
  }

  /**
   * Returns the node at the given position, determined by branch indices relative
   * to this node.
   * 
   * @param {Number[]} [branches=[]] the branch indices to follow 
   * @returns {TreeNode} the node at the position described above
   */
  child(branches) {
    let node = this;
    // follow the provided branch indices, if they exist
    for (const branch of (branches || [])) {
      node = node.children[branch];
    }
    return node;
  }

  /**
   * Clones this node (deep copy).
   * 
   * @returns {TreeNode} the cloned node
   */
  clone() {
    return new TreeNode(
        this.statements.map(statement => statement.str),
        this.children.map(child => child.clone())
    );
  }
}

function isAncestor(node, ancestor) {
  return arrayStartsWith(node.branches, ancestor.branches) || (
      JSON.stringify(node.branches) === JSON.stringify(ancestor.branches)
      && ancestor.offset < node.offset
  );
}

function addToReferenceDict(referenceDict, branches, el) {
  const branchesStr = JSON.stringify(branches);
  if (!(branchesStr in referenceDict)) {
    referenceDict[branchesStr] = [];

    const parentBranches = [...branches];
    parentBranches.pop();
    addToReferenceDict(
        referenceDict,
        parentBranches,
        referenceDict[branchesStr]
    );
  }

  referenceDict[branchesStr].push(el);
}

function validateDecomposition(decomposition, references, branches, node) {
  const referenceDict = {};
  // initialize the root branch to an empty array
  referenceDict[JSON.stringify(branches)] = [];
  for (const reference of references) {
    addToReferenceDict(
        referenceDict,
        reference.branches,
        parseStatement(
            root.node.child(reference.branches).statements[reference.offset].str
        ).toString()
    );
  }

  const unorderedReferences = referenceDict[JSON.stringify(branches)];
  if (decomposition === normalize(unorderedReferences)) {
    return true;
  }

  if (node.children.length === 0) {
    return false;
  }

  for (let i = 0; i < node.children.length; ++i) {
    // check if the statement is decomposed in each child branch
    const childBranches = [...branches, i];
    // filter references only in this child branch
    const branchReferences = references.filter(
        reference => arrayStartsWith(reference.branches, childBranches)
    );
    if (!validateDecomposition(
        decomposition,
        branchReferences,
        childBranches,
        node.children[i]
    )) {
      // if this statement is not decomposed in this child branch, then the
      // decomposition is invalid
      return false;
    }
  }
  // if this statement is decomposed in each child branch, then the decomposition
  // is valid
  return true;
}
