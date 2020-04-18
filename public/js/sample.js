const root = {
  node: new TreeNode([
    "(W∨S) → C",
    "C ↔ (I∧V)",
    "¬(¬W → ¬V)",
    "¬W",
    "¬¬V",
    "V",
  ], [
    new TreeNode(["¬(W∨S)", "¬W", "¬S"], [
      new TreeNode(["C", "I∧V", "I", "V", "o"]),
      new TreeNode(["¬C", "¬(I∧V)"], [
          new TreeNode(["¬I", "o"]),
          new TreeNode(["¬V", "x"]),
      ]),
    ]),
    new TreeNode(["C"], [
      new TreeNode(["C", "I∧V", "I", "V", "o"]),
      new TreeNode(["¬C", "¬(I∧V)", "x"]),
    ]),
  ]),
};
