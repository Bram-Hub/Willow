import {defineComponent} from 'vue';
import {TruthTree, TruthTreeNode} from '../../common/tree';
import {TruthTreeNodeComponent} from './truth-tree-node';

/**
 * A Vue component that renders a branch of a truth tree. Note that this
 * component represents a path whose head is the child of a node with multiple
 * children and whose tail is the first node in the path with multiple children.
 * It does not represent a root-to-leaf path. Therefore, all nodes in a branch
 * are at the same indentation level in the interface.
 */
export const TruthTreeBranchComponent = defineComponent({
	name: 'truth-tree-branch',
	components: {
		// A branch is composed of the nodes that span from its head to its tail
		'truth-tree-node': TruthTreeNodeComponent,
	},
	props: {
		// A branch can be uniquely defined by its head
		head: {
			type: Number,
			required: true,
		},
	},
	data() {
		return {
			// Whether or not this branch is expanded
			expanded: true,
			// An array that holds references to any branch components rendered by
			// this component
			childBranches: [] as any[],
		};
	},
	beforeUpdate() {
		this.childBranches = [];
	},
	computed: {
		tree(): TruthTree {
			return this.$store.state.tree;
		},
		selected(): number | null {
			return this.$store.state.selected;
		},
		selectedNode(): TruthTreeNode | null {
			return this.$store.getters.selectedNode;
		},
		/**
		 * Returns the node at the head of this branch.
		 * @returns the head node of this branch
		 */
		headNode(): TruthTreeNode {
			return this.tree.nodes[this.head];
		},
		/**
		 * Traverses the branch represented by this component. Returns an array
		 * containing the ids of nodes between the head and tail of this branch
		 * (inclusive).
		 * @returns an array of ids of nodes in this branch
		 */
		branch() {
			const branch: number[] = [this.head];
			while (this.tree.nodes[branch[branch.length - 1]].children.length === 1) {
				branch.push(this.tree.nodes[branch[branch.length - 1]].children[0]);
			}
			return branch;
		},
	},
	methods: {
		/**
		 * Private method used to add references to branch components rendered by
		 * this component.
		 * @param ref a reference to the child branch
		 */
		addChildBranchRef(ref?: any | null) {
			if (ref) {
				this.childBranches.push(ref);
			}
		},
		modifyAntecedentsDP(id: number) {
			// TODO: Document this function more
			const selectedNode: TruthTreeNode | null =
				this.$store.getters.selectedNode;

			if (selectedNode === null || selectedNode.id === id) {
				return;
			}
			const otherNode: TruthTreeNode = this.$store.state.tree.nodes[id]; // the node you right click (statement to reduce/branch)

			if (selectedNode.antecedentsDP.has(id)) {
				// the node your cursor is on
				selectedNode.antecedentsDP.delete(id);
				otherNode.decomposition.delete(selectedNode.id);
			} else {
				selectedNode.antecedentsDP.add(id);
				otherNode.decomposition.add(selectedNode.id);
			}

			if (selectedNode.antecedent === id) {
				selectedNode.antecedent = null;
			} else {
				// Remove this node from the current antecedent decomposition
				selectedNode.antecedent = id;
			}

			otherNode.correctDecomposition = null;
			selectedNode.correctDecomposition = null;
		},
		/**
		 * Adds or removes a given node from the decomposition of the selected node,
		 * or vice-versa depending on the position of the selected node relative to
		 * the given one. Note that, with the exception of terminators, a node will
		 * always be in the decomposition of an ancestor node, not the other way
		 * around.
		 * @param id the id of the other node (not the selected one)
		 */
		modifyDecomposition(id: number) {
			// TODO: Document this function more
			const selectedNode: TruthTreeNode | null =
				this.$store.getters.selectedNode;

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
				const decomp = Array.from(selectedNode.decomposition);
				for (let i = 0; i < decomp.length; i++) {
					// console.log("hello");
					// console.log(decomp[i]);
					console.log(this.tree.nodes[decomp[i]]);
				}
				// let first = decomp[0]
				// console.log(this.tree.nodes[decomp[0]])
			} else if (selectedNode.isAncestorOf(id)) {
				// When the selected is BEFORE, it becomes decomposition
				const otherNode: TruthTreeNode = this.$store.state.tree.nodes[id];
				if (selectedNode.decomposition.has(id)) {
					selectedNode.decomposition.delete(id);
					otherNode.antecedent = null;
				} else {
					selectedNode.decomposition.add(id);

					if (otherNode.antecedent !== null) {
						const antecedentNode =
							this.$store.state.tree.nodes[otherNode.antecedent];
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
						const currentAntecedent: TruthTreeNode =
							this.$store.state.tree.nodes[selectedNode.antecedent];
						currentAntecedent.decomposition.delete(selectedNode.id);
					}
					selectedNode.antecedent = id;
					otherNode.decomposition.add(selectedNode.id);
				}
				otherNode.correctDecomposition = null;
			}
			selectedNode.correctDecomposition = null;
		},
		/**
		 * Toggles whether or not this branch is expanded if this branch contains
		 * the selected node. Otherwise, this just propogates down the tree.
		 */
		toggleBranchExpansion() {
			if (this.selected === null) {
				return alert('You must select a statement before doing this.');
			}
			if (this.branch.includes(this.selected)) {
				this.expanded = !this.expanded;
			} else {
				for (const childBranch of this.childBranches) {
					childBranch.toggleBranchExpansion();
				}
			}
		},
		/**
		 * Collapses this branch and propogates down the tree so that every branch
		 * is collapsed.
		 */
		collapseAllBranches() {
			for (const childBranch of this.childBranches) {
				childBranch.collapseAllBranches();
			}
			this.expanded = false;
		},
		/**
		 * Expands this branch and propogates down the tree so that every branch is
		 * expanded.
		 */
		expandAllBranches() {
			this.expanded = true;
			for (const childBranch of this.childBranches) {
				childBranch.expandAllBranches();
			}
		},
		/**
		 * Collapses this branch if it is terminated or if all of its child branches
		 * are terminated, which is determined by propogating down the tree.
		 */
		collapseTerminatedBranches() {
			if (this.childBranches.length === 0) {
				// If this branch has no child branches, then check if the last node in
				// this branch (the tail) is a terminator
				const tail = this.tree.nodes[this.branch[this.branch.length - 1]];
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
						//       call collapseTerminatedBranches() for all child branches
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
						@contextmenu.prevent="modifyAntecedentsDP(id)"
						@click="$store.commit('select', {id: id})"
						:class="{
							selected: selected === id,
							antecedent:
								selectedNode !== null &&
								selectedNode.antecedent === id,
							decomposition:
								selectedNode !== null &&
								selectedNode.decomposition.has(id),
							'closing-terminator-decomposition':
								selectedNode !== null &&
								selectedNode.decomposition.has(id) &&
								selectedNode.isClosedTerminator(),
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
				<template v-if="tree.nodes[id].children.length > 1">
					<div
							v-show="expanded"
							v-for="child in tree.nodes[id].children">
						<hr class="branch-line"/>
						<truth-tree-branch :head="child"
								:ref="addChildBranchRef"></truth-tree-branch>
					</div>
        </template>
      </template>
      <li v-if="!expanded && headNode.children.length > 0">
        <i class="fas fa-ellipsis-v"></i>
      </li>
    </ul>
  `,
});
