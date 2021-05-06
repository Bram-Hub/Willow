import {ComponentCustomProperties} from 'vue';
import {Store} from 'vuex';
import {TruthTree} from '../common/tree';

declare module '@vue/runtime-core' {
	interface State {
		shortcuts: {
			[action: string]: string;
		};
		substitutions: {
			[symbol: string]: string;
		};
		developerMode: boolean;
		tree: TruthTree;
		selected: number | null;
	}

	interface ComponentCustomProperties {
		$store: Store<State>;
	}
}
