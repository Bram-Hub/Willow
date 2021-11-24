import {defineComponent} from 'vue';

/**
 * A Vue component that records text from the user and replaces that text with
 * logic symbols in the truth tree.
 */
export const SubstitutionRecorder = defineComponent({
	name: 'substitution-recorder',
	props: {
		// The `symbol` property is used both to identify the substitution in local
		// storage and as the replacement text in the truth tree
		symbol: {
			type: String,
			required: true,
		},
		// The `default` property is used as the default text that is replaced with
		// `symbol`
		default: String,
	},
	data() {
		return {
			// The text that gets replaced with the logic symbol
			text:
				// TODO: Check that the user did not manually set the value in local
				//       storage in order to break the type cast
				(JSON.parse(
					localStorage.getItem(`substitutions.${this.symbol}`) || 'null'
				) as string | null) ||
				this.default ||
				'',
		};
	},
	watch: {
		text: {
			/**
			 * Called when the value of `this.text` changes.
			 * @param newVal the new value of `this.text`
			 */
			handler(newVal: string) {
				// Update this substitution in the store, which is what is used to make
				// the actual substitutions in truth-tree-node.ts
				this.$store.commit('setSubstitution', {
					symbol: this.symbol,
					text: newVal,
				});

				// Update local storage so that the new text persists on page reload
				localStorage.setItem(
					`substitutions.${this.symbol}`,
					JSON.stringify(newVal)
				);
			},
			immediate: true,
		},
	},
	template: `
    <input type="text" v-model="text" class="substitution-recorder"/>
  `,
});
