const sampleRoot = new TreeNode([
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
]);

const vm = new Vue({
  el: "#tree-container",
  data: {
    root: sampleRoot,
  },
  components: {
    treeNode: {
      name: "tree-node",
      data: () => ({
        expanded: true,
      }),
      props: {
        node: Object,
        level: Number,
      },
      template: `
<ul class="node-list">
  <li v-for="(statement, idx) in node.statements">
    <input v-if="idx == 0 || expanded" v-model="statement.str" class="statement" type="text" oninput="makeSubstitutions(this)"/>
    <button v-if="idx == 0 && (node.statements.length > 1 || node.children.length > 1)" @click="expanded = !expanded" class="expand-arrow">{{ expanded ? "▼" : "►" }}</button>
  </li>
  <li v-if="(node.statements.length > 1 || node.children.length > 1) && !expanded" class="dots">⋮</li>
  <template v-if="expanded" v-for="child in node.children">
    <hr class="branch-line">
    <tree-node :node="child" :level="level + 1"/>
  </template>
</ul>`,
    }
  }
});
