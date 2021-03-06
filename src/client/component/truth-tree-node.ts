import * as vue from 'vue';

export const TruthTreeNodeComponent: vue.Component = {
  name: 'truth-tree-node',
  props: {
    id: Number,
  },
  computed: {
    node() {
      return this.$store.state.tree.nodes[this.id];
    },
  },
  template: `
    <span>id: {{ id }} valid: {{ JSON.stringify(node.isValid()) }} decomposed: {{ JSON.stringify(node.isDecomposed()) }}</span>
    <i v-if="Object.keys(node.isValid()).length === 0 && Object.keys(node.isDecomposed()).length === 0" class="fas fa-check"></i>
    <i v-else class="fas fa-times"></i>
    <input type="text" v-model="node.text" :class="{
      'statement': true,
      'open-terminator': node.text === '◯',
      'closed-terminator': node.text === '×',
    }"/>
    <p v-if="node.premise" class="premise-label">Premise</p>
  `,
};
