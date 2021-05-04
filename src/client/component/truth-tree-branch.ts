import * as vue from 'vue';
import {TruthTree, TruthTreeNode} from '../../common/tree';
import {TruthTreeNodeComponent} from './truth-tree-node';

export const TruthTreeBranchComponent: vue.Component = {
	name: 'truth-tree-branch',
	components: {
		'truth-tree-node': TruthTreeNodeComponent,
	},
	props: {
		head: Number,
	},
	data() {
		return {
			expanded: true,
			childBranches: [],
		};
	},
	beforeUpdate() {
		this.childBranches = [];
	},
	computed: {
		branch() {
			const tree: TruthTree = this.$store.state.tree;
			const branch: number[] = [this.head];
			while (tree.nodes[branch[branch.length - 1]].children.length === 1) {
				branch.push(tree.nodes[branch[branch.length - 1]].children[0]);
			}
			return branch;
		},
		closedTerminator() {
			return TruthTree.CLOSED_TERMINATOR;
		},
		headNode() {
			return this.$store.state.tree.nodes[this.head];
		},
	},
	methods: {
		addChildBranchRef(ref: any) {
			if (ref) {
				this.childBranches.push(ref);
			}
		},
		modifyDecomposition(id: number) {
			const selectedNode: TruthTreeNode | null = this.$store.getters
				.selectedNode;

			if (selectedNode === null || selectedNode.id === id) {
				return;
			}

			// NOTE: if `otherNode` is a terminator, then things can get wacky
			if (selectedNode.isTerminator()) {
				// Terminators only manage their decomposition
				if (selectedNode.decomposition.has(id)) {
					selectedNode.decomposition.delete(id);
				} else {
					selectedNode.decomposition.add(id);
				}
			} else if (selectedNode.isAncestorOf(id)) {
				// When the selected is BEFORE, it becomes decomposition
				const otherNode: TruthTreeNode = this.$store.state.tree.nodes[id];
				if (selectedNode.decomposition.has(id)) {
					selectedNode.decomposition.delete(id);
					otherNode.antecedent = null;
				} else {
					selectedNode.decomposition.add(id);

					if (otherNode.antecedent !== null) {
						const antecedentNode = this.$store.state.tree.nodes[
							otherNode.antecedent
						];
						antecedentNode.decomposition.delete(id);
						antecedentNode.correctDecomposition = null;
					}

					otherNode.antecedent = selectedNode.id;
				}
				otherNode.correctDecomposition = null;
			} else {
				// When the selected is AFTER, it becomes antecedent
				const otherNode: TruthTreeNode = this.$store.state.tree.nodes[id];
				if (selectedNode.antecedent === id) {
					selectedNode.antecedent = null;
					otherNode.decomposition.delete(selectedNode.id);
				} else {
					// Remove this node from the current antecedent decomposition
					if (selectedNode.antecedent !== null) {
						const currentAntecedent: TruthTreeNode = this.$store.state.tree
							.nodes[selectedNode.antecedent];
						currentAntecedent.decomposition.delete(selectedNode.id);
					}
					selectedNode.antecedent = id;
					otherNode.decomposition.add(selectedNode.id);
				}
				otherNode.correctDecomposition = null;
			}
			selectedNode.correctDecomposition = null;
		},
		toggleBranchExpansion() {
			const selected: number | null = this.$store.state.selected;
			if (selected === null) {
				return alert('You must select a statement before doing this.');
			}
			if ((this.branch as number[]).includes(selected)) {
				(this.expanded as boolean) = !(this.expanded as boolean);
			} else {
				for (const childBranch of this.childBranches) {
					childBranch.toggleBranchExpansion();
				}
			}
		},
		collapseAllBranches() {
			for (const childBranch of this.childBranches) {
				childBranch.expandAllBranches();
			}
			(this.expanded as boolean) = false;
		},
		expandAllBranches() {
			(this.expanded as boolean) = true;
			for (const childBranch of this.childBranches) {
				childBranch.expandAllBranches();
			}
		},
		collapseTerminatedBranches() {
			const branch: number[] = this.branch;
			const tail = (this.$store.state.tree as TruthTree).nodes[
				branch[branch.length - 1]
			];
			if (this.childBranches.length === 0) {
				if (tail.isTerminator()) {
					this.expanded = false;
					return true;
				}
			} else {
				// Only collapse this branch if all of its child branches are collapsed
				let collapse = true;
				for (const childBranch of this.childBranches) {
					if (!childBranch.collapseTerminatedBranches()) {
						collapse = false;
						// NOTE: Do not break outside of for loop, since we still need to
						// 			 call collapseTerminatedBranches() for all child branches
					}
				}
				if (collapse) {
					this.expanded = false;
					return true;
				}
			}
			return false;
		},
	},
	template: `
    <ul class="branch">
      <template v-for="id, index in branch">
        <li v-if="index === 0 || expanded"
						@contextmenu.prevent="modifyDecomposition(id)"
						@click="$store.commit('select', {id: id})"
						:class="{
							selected: $store.state.selected === id,
							antecedent: $store.getters.selectedNode !== null
									&& $store.getters.selectedNode.antecedent === id,
							decomposition: $store.getters.selectedNode !== null
									&& $store.getters.selectedNode.decomposition.has(id),
							'closing-terminator-decomposition': (
								$store.getters.selectedNode !== null
									&& $store.getters.selectedNode.decomposition.has(id)
									&& $store.getters.selectedNode.text === closedTerminator
							),
						}">
          <truth-tree-node :id="id"></truth-tree-node>
          <button v-if="index === 0 && headNode.children.length > 0"
              class="expand-btn hidden" @click="expanded = !expanded">
            <i :class="[
              'fas',
              expanded ? 'fa-chevron-down' : 'fa-chevron-right',
            ]"></i>
          </button>
        </li>
        <template
            v-if="$store.state.tree.nodes[id].children.length > 1 && expanded"
            v-for="child in $store.state.tree.nodes[id].children">
          <hr class="branch-line"/>
          <truth-tree-branch :head="child"
							:ref="addChildBranchRef"></truth-tree-branch>
        </template>
      </template>
      <li v-if="!expanded && headNode.children.length > 0">
        <i class="fas fa-ellipsis-v"></i>
      </li>
    </ul>
  `,
};
