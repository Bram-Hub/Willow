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
}

class TruthTree {
  /**
   * @returns {number} the width of the entire truth tree
   */
  get width() {
    return this.root ? this.root.width : 0;
  }

  /**
   * Finds all branches in this truth tree.
   * 
   * @returns {TreeNode[][]} an array of branches, with each branch represented
   * by an array of {@link TreeNode}
   */
  get branches() {
    if (!this.root) {
      // if this tree does not have a root, there are no branches
      return [];
    } else if (this.root.children.length === 0) {
      // if the root does not have any children, then there is a single path which
      // only contains the root
      return [[this.root]];
    }

    // traverse the tree and find all branches by performing a breadth-first
    // search

    // initialize an array to store completed branches (last node has no children)
    const completed = [];
    // maintain a queue of in-progress branches
    const queue = [[this.root]];
    while (queue.length > 0) {
      const branch = queue.shift();
      for (const child of branch[branch.length - 1].children) {
        // extend the current branch by each of its children
        const nextBranch = [...branch, child];
        // add the extended branch to the array of completed branches if the
        // current child has no children, otherwise add it back to the queue
        if (child.children.length === 0) {
          completed.push(nextBranch);
        } else {
          queue.push(nextBranch);
        }
      }
    }

    return completed;
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
