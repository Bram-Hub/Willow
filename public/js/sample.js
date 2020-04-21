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
      new TreeNode(["C", "I∧V", "I", "V", "◯"]),
      new TreeNode(["¬C", "¬(I∧V)"], [
          new TreeNode(["¬I", "◯"]),
          new TreeNode(["¬V", "×"]),
      ]),
    ]),
    new TreeNode(["C"], [
      new TreeNode(["C", "I∧V", "I", "V", "◯"]),
      new TreeNode(["¬C", "¬(I∧V)", "×"]),
    ]),
  ]),
};
