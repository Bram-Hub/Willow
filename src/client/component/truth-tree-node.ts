import * as vue from 'vue';
import {TruthTreeNode} from '../../common/tree';
import {Substitutions} from './substitution-recorder';

export function getNodeIconClasses(node: TruthTreeNode): string[] {
	if (node.isValid() === 'not_parsable') {
		return ['fas', 'fa-exclamation-triangle', 'statement-error'];
	} else if (node.isValid() === true && node.isDecomposed() === true) {
		return ['fas', 'fa-check', 'statement-correct'];
	} else {
		return ['fas', 'fa-times', 'statement-incorrect'];
	}
}

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
	methods: {
		getNodeIconClasses: getNodeIconClasses,
		makeSubstitutions() {
			const node = this.node as TruthTreeNode;
			for (const [symbol, text] of Object.entries(
				this.$store.state.substitutions as Substitutions
			)) {
				if (text.length === 0) {
					continue;
				}
				node.text = node.text.replace(text, symbol);
			}
		},
	},
	watch: {
		'node.text': {
			handler() {
				const id: number = this.id;
				const node = document.getElementById(`node${id}`);
				const hiddenNode = document.getElementById(`hidden-node${id}`);
				if (node === null || hiddenNode === null) {
					return;
				}
				hiddenNode.textContent = (this.node as TruthTreeNode).text;
				node.style.width = `${hiddenNode.scrollWidth}px`;
			},
			immediate: true,
		},
	},
	template: `
    <span v-if="$store.state.developerMode">
      id: {{ id }},
      valid: {{ node.isValid() }},
      decomposed: {{ node.isDecomposed() }},
      universe: {{
        JSON.stringify(node.universe.map(formula => formula.toString()))
      }}
    </span>
    <i :class="getNodeIconClasses(node)" :title="node.getFeedback()"></i>
    <input :id="'node' + this.id" type="text" v-model="node.text"
        @focus="$store.commit('select', {id: id, focus: false})"
        @input="makeSubstitutions()"
        :class="{
          'statement': true,
          'open-terminator': node.text === '◯',
          'closed-terminator': node.text === '×',
        }"
        :readonly="node.premise && $store.state.tree.options.lockedOptions"/>
		<span :id="'hidden-node' + this.id" class="hidden-statement"></span>
    <p v-if="node.premise" class="premise-label">Premise</p>
  `,
};
