import {defineComponent} from 'vue';
import {TruthTree, TruthTreeNode, CorrectnessError} from '../../common/tree';

export function getNodeIconClasses(node: TruthTreeNode): string[] {
	const validity = node.isValid();
	if (
		validity instanceof CorrectnessError &&
		validity.errorCode === 'not_parsable'
	) {
		return ['fas', 'fa-exclamation-triangle', 'statement-error'];
	} else if (validity === true && node.isDecomposed() === true) {
		return ['fas', 'fa-check', 'statement-correct'];
	} else {
		return ['fas', 'fa-times', 'statement-incorrect'];
	}
}

function resizeFromBbox(
	elementId: string,
	bboxId: string,
	text: string | null
) {
	if (text === null) {
		return;
	}
	const element = document.getElementById(elementId);
	const bboxElement = document.getElementById(bboxId);
	if (element === null || bboxElement === null) {
		return;
	}
	bboxElement.textContent = text;
	element.style.width = `${bboxElement.scrollWidth}px`;
}

export const TruthTreeNodeComponent = defineComponent({
	name: 'truth-tree-node',
	props: {
		id: {
			type: Number,
			required: true,
		},
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
		makeSubstitutions(event: FocusEvent) {
			if (this.node === null) {
				return;
			}

			let cursor = 0;
			const target = event.target;
			if (target instanceof HTMLInputElement) {
				cursor = target.selectionStart ?? 0;
			}

			let beforeCursor = this.node.text.substring(0, cursor);
			let afterCursor = this.node.text.substring(cursor);
			for (const [symbol, text] of Object.entries(
				this.$store.state.substitutions
			)) {
				if (text.length === 0) {
					continue;
				}
				beforeCursor = beforeCursor?.replace(text, symbol);
				afterCursor = afterCursor?.replace(text, symbol);
			}
			this.node.text = beforeCursor + afterCursor;

			cursor = beforeCursor?.length ?? 0;
			if (target instanceof HTMLInputElement) {
				setTimeout(() => target.setSelectionRange(cursor, cursor), 0);
			}
		},
	},
	updated() {
		const id: number = this.id;
		const node: TruthTreeNode | null = this.node;
		if (node === null) {
			return;
		}
		resizeFromBbox(`node${id}`, `bbox-node${id}`, node.text);
		resizeFromBbox(`comment${id}`, `bbox-comment${id}`, node.comment);
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
        @input="makeSubstitutions($event)"
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
});
