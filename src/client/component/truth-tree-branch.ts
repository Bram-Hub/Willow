import * as vue from 'vue';
import {TruthTree} from '../../common/tree';
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
		};
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
		headNode() {
			return this.$store.state.tree.nodes[this.head];
		},
	},
	template: `
    <ul class="branch">
      <template v-for="id, index in branch">
        <li v-if="index === 0 || expanded">
          <truth-tree-node :id="id"></truth-tree-node>
          <button v-if="index === 0 && headNode.children.length > 0"
              class="hidden" @click="expanded = !expanded">
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
          <truth-tree-branch :head="child"></truth-tree-branch>
        </template>
      </template>
      <li v-if="!expanded && headNode.children.length > 0">
        <i class="fas fa-ellipsis-v"></i>
      </li>
    </ul>
  `,
};
