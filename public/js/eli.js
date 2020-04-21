const root = {
  node: new TreeNode(["(W∨S) → C"], [
    new TreeNode(["¬(W∨S)"], [
      new TreeNode(["¬W", "¬S"]),
    ]),
    new TreeNode(["C"]),
  ]),
};
