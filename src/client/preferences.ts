import * as vue from 'vue';

declare const theme: any;

export const instance = vue
	.createApp({
		data: function () {
			return {
				theme: localStorage.getItem('theme') || 'system',
			};
		},
		watch: {
			theme(newVal: string) {
				localStorage.setItem('theme', newVal);
				theme.updateTheme(newVal);
			},
		},
	})
	.mount('#preferences-form');
