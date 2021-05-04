import * as vue from 'vue';
import {node} from 'webpack';
import {TruthTree, TruthTreeNode} from '../../common/tree';
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

function resizeText(id: number, node: TruthTreeNode | null) {
	if (node === null) {
		return;
	}
	resizeFromBbox(`node${id}`, `bbox-node${id}`, node.text);
}

function resizeComment(id: number, node: TruthTreeNode | null) {
	if (node === null || node.comment === null) {
		return;
	}
	resizeFromBbox(`comment${id}`, `bbox-comment${id}`, node.comment);
}

function resizeFromBbox(elementId: string, bboxId: string, text: string) {
	const element = document.getElementById(elementId);
	const bboxElement = document.getElementById(bboxId);
	if (element === null || bboxElement === null) {
		return;
	}
	bboxElement.textContent = text;
	element.style.width = `${bboxElement.scrollWidth}px`;
}

export const TruthTreeNodeComponent: vue.Component = {
	name: 'truth-tree-node',
	props: {
		id: Number,
	},
	data() {
		return {
			rendered: false,
		};
	},
	computed: {
		node() {
			const id: number = this.id;
			const tree: TruthTree = this.$store.state.tree;
			return id in tree.nodes ? tree.nodes[id] : null;
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
	updated() {
		// Only run this hook once, since resizing is handled by watchers after the
		// component has been rendered for the first time
		if (this.rendered as boolean) {
			return;
		}
		resizeText(this.id as number, this.node as TruthTreeNode | null);
		resizeComment(this.id as number, this.node as TruthTreeNode | null);
		(this.rendered as boolean) = true;
	},
	watch: {
		'node.text'() {
			resizeText(this.id as number, this.node as TruthTreeNode | null);
		},
		'node.comment'() {
			resizeComment(this.id as number, this.node as TruthTreeNode | null);
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
		<span :id="'bbox-node' + this.id" class="bbox"></span>
		<input v-if="node.comment !== null" :id="'comment' + this.id" type="text"
				placeholder="Comment" v-model="node.comment"
				@click.stop="$store.commit('select', {id: id, focus: false})"
				@focus="$store.commit('select', {id: id, focus: false})"
				class="comment"
        :readonly="node.premise && $store.state.tree.options.lockedOptions"/>
		<span :id="'bbox-comment' + this.id" class="bbox comment-bbox"></span>
    <p v-if="node.premise" class="premise-label">Premise</p>
  `,
};
