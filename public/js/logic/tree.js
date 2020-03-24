class TreeNode {
  /**
   * Constructs a {@link TreeNode}.
   * 
   * @param {String[]} [statements=[]] the logic statements within the node
   * @param {TreeNode[]} [children=[]] the children of the node
   */
  constructor(statements, children) {
    this.statements = (statements || []).map(statement => ({str: statement}));
    // if no children were provided, initialize to an empty array
    this.children = children || [];
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

/**
 * Determines if a branch is able to be closed, which is when the branch contains
 * both a literal and its negation.
 * 
 * @param {Statement[]} branch the branch
 * @returns {boolean} if the branch can be closed
 */
function canCloseBranch(branch) {
  // convert the branch to a set of strings for constant-time lookup
  // TODO: define toString for Statement
  branch = Set(branch.map(statement => statement.toString()));

  for (const statement of branch) {
    if (statement.isLiteral()) {
      // if the statement is a literal, check if the branch contains its negation
      if (statement instanceof NotStatement &&
          branch.has(statement.operand.toString())) {
        // if the statement is a NotStatement, check if the branch contains its
        // operand
        return true;
      } else if (branch.has(new NotStatement(statement).toString())) {
        // if the statement is an AtomicStatement, check if the branch contains
        // its negation
        return true;
      }
    }
  }
  // if none of the statements had a negation contained in the branch, then the
  // branch cannot be closed
  return false;
}
