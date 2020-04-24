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
    <i class="fa fa-check valid-mark" v-if="node.isValid(branches, idx)"></i>
    <i class="fa fa-times valid-mark" v-else></i>
    <div v-if="JSON.stringify(selected.branches) === JSON.stringify(branches) && selected.offset === idx" class="selected-statement"></div>
    <input v-model="statement.str" @focus="selected.branches = branches; selected.offset = idx; selected.references = statement.references;" :class="{statement: true, 'branch-terminator': statement.str === '◯' || statement.str === '×'}" type="text" oninput="makeSubstitutions(this)" :branches="JSON.stringify(branches)" :offset="idx"/>
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



Vue.component('keybindings', {
  data: function () {
    return {
      substitutions: substitutions,
      reverse_substitutions: {},
      shortcuts: shortcuts
    }
  },
  beforeMount(){
    this.reverse();
  },
  methods:{
    reverse: function() {
      for(var key in this.substitutions){
        this.reverse_substitutions[this.substitutions[key]] = key;
      }
    },
    saveChanges: function(input, substitution_key) {
      this.reverse_substitutions[substitution_key] = input.target.value
      this.substitutions = {}
      for(var key in this.reverse_substitutions){
        this.substitutions[this.reverse_substitutions[key]] = key;
      }
      localStorage.setItem("substitutions", JSON.stringify(this.substitutions));
      substitutions = this.substitutions;
    },
    saveChangesShortcut: function(input, index){
      this.shortcuts[index].key = parseInt(input.target.value) ? parseInt(input.target.value) : input.target.value;
      localStorage.setItem("shortcuts", JSON.stringify(this.shortcuts));
    },
    saveChangesShortcutCtrl: function(input, index){
      this.shortcuts[index].ctrl = input.target.checked;
      localStorage.setItem("shortcuts", JSON.stringify(this.shortcuts));
    }
  },
  template: `
<div>
  <p>Change substitutions:</p>
  <table>
    <tr>
      <th>Logic Symbol</th>
      <th></th>
      <th>Key</th>
    </tr>
    <tr v-for="substitution_value, substitution_key, index in reverse_substitutions">
      <td>{{substitution_key}}</td>
      <td></td>
      <td><input style="width:3rem" type="text" maxlength="1" :value="substitution_value" v-on:input="saveChanges($event, substitution_key)"></td>
    </tr>
    <tr><td></td></tr>
    <tr><td></td></tr>
    <tr>
      <th>Action</th>
      <th>ctrl</th>
      <th>Key</th>
    </tr>
    <tr v-for="shortcut,index in shortcuts">
      <td>{{shortcut.callback.name.replace(/([A-Z])/g, ' $1').replace(/^./, function(str){ return str.toUpperCase(); })}}:</td>
      <td><input type="checkbox" v-bind:checked="shortcut.ctrl" v-on:input="saveChangesShortcutCtrl($event, index)"></td>
      <td><input type="text" style="width:3rem" maxlength="3" v-bind:value="shortcut.key" v-on:input="saveChangesShortcut($event, index)"></td>
    </tr>
  </table>
</div>
  `
})
new Vue({ el: '#keybindings' })
