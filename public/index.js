const vm = new Vue({
  el: "#tree-container",
  data: {
    root: new TreeNode(undefined, [new TreeNode(), new TreeNode(undefined, [new TreeNode(), new TreeNode()])]),
  },
  components: {
    treeNode: {
      name: "tree-node",
      props: {node: Object, level: Number},
      template: `
<div>
  <div><input type="text" oninput="makeSubstitutions(this)"/></div>
  <div style="display: flex;">
    <tree-node v-for="child in node.children" :node="child" :level="level + 1" style="flex: 1 1 auto;"/>
  </div>
</div>`,
    }
  }
});