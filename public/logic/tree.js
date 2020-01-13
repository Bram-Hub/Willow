class TreeNode {
  /**
   * Constructs a {@link TreeNode}.
   * 
   * @param {Statement} statement the logic statement of the node
   * @param {TreeNode[]} [children=[]] the children of the node
   */
  constructor(statement, children) {
    this.statement = statement;
    // if no children were provided, initialize to an empty array
    this.children = children || [];
  }
}

class TruthTree {
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