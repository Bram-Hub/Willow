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
    <span v-if="$store.state.developerMode">id: {{ id }} valid: {{ node.isValid() }} decomposed: {{ node.isDecomposed() }} universe: {{ JSON.stringify(Array.from(node.universe).map(formula => formula.toString()) ) }}</span>
    <i v-if="node.isValid() === 'not_parsable'"
        class="fas fa-exclamation-triangle" title="This is not parsable."></i>
    <i v-else-if="node.isValid() === true && node.isDecomposed() === true"
        class="fas fa-check" :title="node.getFeedback()"></i>
    <i v-else class="fas fa-times" :title="node.getFeedback()"></i>
    <input :id='"node" + this.id' type="text" v-model="node.text"
        @focus="$store.commit('select', id)"
        :class="{
          'statement': true,
          'open-terminator': node.text === '◯',
          'closed-terminator': node.text === '×',
        }"/>
    <p v-if="node.premise" class="premise-label">Premise</p>
  `,
};
