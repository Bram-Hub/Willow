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
  references: undefined,
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
        itemClasses: undefined,
      }),
      methods: {
        hasSelection: function() {
          return selected !== undefined
              && selected.branches !== undefined
              && selected.offset !== undefined
              && selected.references !== undefined;
        },
        isSelected: function(branches, offset) {
          return JSON.stringify(selected.branches) === JSON.stringify(branches)
              && selected.offset === offset;
        },
        referenceStatement: function(event) {
          if (!this.hasSelection()) {
            return;
          }

          let referenceEl = $(event.target);
          if (!referenceEl.is(".statement")) {
            referenceEl = referenceEl.find(".statement");
          }

          const reference = {
            branches: JSON.parse(referenceEl.attr("branches")),
            offset: parseInt(referenceEl.attr("offset")),
          };
          if (this.isSelected(reference.branches, reference.offset)) {
            return;
          }
          const referenceStr = JSON.stringify(reference);
          const references = root.node.child(
              selected.branches
          ).statements[selected.offset].references;
          const referenceIdx = references.indexOf(referenceStr);
          if (referenceIdx !== -1) {
            references.splice(referenceIdx, 1);
          } else {
            references.push(referenceStr);
          }

          event.preventDefault();
          event.stopPropagation();
        },
        isValid: function(statement, node){
          const answer = parseStatement(statement.str);
          
          //must be decomposed into the correct number of statements
          //TODO this actually is not correct because it needs to check this per branch
          //Which makes some of the later code also wrong
          if(statement.references.length != answer.decompose().flat().length){
            return false;
          }
          
          //atomic statements are always correctly decomposed
          if(answer.value == parseStatement(statement.str).toString()){
            return true;
          }
          
          console.log(statement.str)
          console.log(statement.references)
          console.log(answer.decompose())
          
          if(answer.decompose().length == 2){
            let val0 = JSON.parse(statement.references[0])
            val0 = parseStatement(node.child(val0.branches).statements[val0.offset].str).toString();
            let val1 = JSON.parse(statement.references[1])
            val1 = parseStatement(node.child(val1.branches).statements[val1.offset].str).toString();
            if(val0 == answer.lhs.toString() && val1 == answer.rhs.toString()
              || val0 == answer.rhs.toString() && val1 == answer.lhs.toString() ){
              return true;
            }
          }

          return false;
        },
      },
      props: {
        node: Object,
        branches: {
          type: Array,
          default: () => [],
        },
      },
      watch: {
        selected: {
          handler: function() {
            const classes = this.node.statements.map(() => []);
            if (this.hasSelection()) {
              const branchesStr = JSON.stringify(this.branches);
              for (const referenceStr of this.selected.references) {
                const reference = JSON.parse(referenceStr);
                if (JSON.stringify(reference.branches) === branchesStr) {
                  classes[reference.offset].push("referenced");
                }
              }
            }
            this.itemClasses = classes;
          },
          immediate: true,
          deep: true,
        },
      },
      template: `
<ul class="node-list">
  <li v-for="(statement, idx) in node.statements" v-if="idx === 0 || expanded" @contextmenu="referenceStatement" :class="itemClasses[idx]">
    <i class="fa fa-check" style="color:green" v-if="isValid(statement, node)"></i>
    <i class="fa fa-times" style="color:red" v-else></i>
    <div v-if="JSON.stringify(selected.branches) === JSON.stringify(branches) && selected.offset === idx" class="selected-statement"></div>
    <input v-model="statement.str" @focus="selected.branches = branches; selected.offset = idx; selected.references = statement.references;" class="statement" type="text" oninput="makeSubstitutions(this)" :branches="JSON.stringify(branches)" :offset="idx"/>
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
