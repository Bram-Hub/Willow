import * as vue from 'vue';
import {TruthTreeBranchComponent} from './truth-tree-branch';

export const TruthTreeComponent: vue.Component = {
	name: 'truth-tree',
	components: {
		'truth-tree-branch': TruthTreeBranchComponent,
	},
	template: `
    <truth-tree-branch :head="$store.state.tree.root"></truth-tree-branch>
  `,
};
