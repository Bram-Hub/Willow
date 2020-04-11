$(function() {
  $(".dropdown button").click(function() {
    const menu = $(this).parent().find(".dropdown-menu");
    menu.toggle();
    $(".dropdown-menu").not(menu).hide();
  });

  window.onclick = function(event) {
    if (!event.target.matches(".dropdown button")) {
      $(".dropdown-menu").hide();
    }
  }
});

// store the selected statement in a shared object so that all components can
// access/modify it
let selected = {
  branches: undefined,
  offset: undefined,
};

const vm = new Vue({
  el: "#tree-container",
  data: {
    name: "Untitled",
    root: root,
  },
  watch: {
    name: {
      immediate: true,
      handler: function(name) {
        document.title = name + " | Willow";
      },
    },
  },
  components: {
    treeNode: {
      name: "tree-node",
      data: () => ({
        expanded: true,
        selected: selected,
      }),
      props: {
        node: Object,
        branches: {
          type: Array,
          default: () => [],
        },
      },
      template: `
<ul class="node-list">
  <li v-for="(statement, idx) in node.statements" v-if="idx === 0 || expanded">
    <div v-if="JSON.stringify(selected.branches) === JSON.stringify(branches) && selected.offset === idx" class="selected-statement"></div>
    <input v-model="statement.str" @focus="selected.branches = branches; selected.offset = idx;" class="statement" type="text" oninput="makeSubstitutions(this)" :branches="JSON.stringify(branches)" :offset="idx"/>
    <button v-if="idx == 0 && (node.statements.length > 1 || node.children.length > 0)" @click="expanded = !expanded" class="expand-arrow">{{ expanded ? "▼" : "►" }}</button>
  </li>
  <li v-if="(node.statements.length > 1 || node.children.length > 0) && !expanded" class="dots">⋮</li>
  <template v-if="expanded" v-for="(child, idx) in node.children">
    <hr class="branch-line">
    <tree-node :node="child" :branches="[...branches, idx]"/>
  </template>
</ul>`,
    }
  }
});
