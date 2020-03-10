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
  <div><input class="node" type="text" oninput="makeSubstitutions(this)"/></div>
  <div v-if="node.children.length > 1" class="level-separator">
    <tree-node v-for="child in node.children" :node="child" :level="level + 1" style="flex: 1 1 auto;"/>
  </div>
  <tree-node v-else v-for="child in node.children" :node="child" :level="level + 1"/>
</div>`,
    }
  }
});
