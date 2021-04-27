import * as vue from 'vue';

export interface Substitutions {
	[symbol: string]: string;
}

export const SubstitutionRecorder: vue.Component = {
	name: 'substitution-recorder',
	props: {
		symbol: String,
		default: String,
	},
	data() {
		return {
			text:
				(JSON.parse(
					localStorage.getItem(`substitutions.${this.symbol}`) || 'null'
				) as string | null) ||
				(this.default as string | undefined) ||
				'',
		};
	},
	watch: {
		text: {
			handler(newVal: string) {
				const symbol: string = this.symbol;
				this.$store.commit('setSubstitution', {
					symbol: symbol,
					text: newVal,
				});
				localStorage.setItem(`substitutions.${symbol}`, JSON.stringify(newVal));
			},
			immediate: true,
		},
	},
	template: `
    <input type="text" v-model="text" class="substitution-recorder"/>
  `,
};
