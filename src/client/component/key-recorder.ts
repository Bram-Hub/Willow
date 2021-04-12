import hotkeys from 'hotkeys-js';
import * as vue from 'vue';

import * as keys from '../keys';

export const KeyRecorder: vue.Component = {
	name: 'key-recorder',
	props: {
		event: String,
	},
	data() {
		return {
			recorded: [],
		};
	},
	computed: {
		pressedKeyCodes() {
			return keys.pressedKeyCodes;
		},
	},
	methods: {
		onKeyDown(event: KeyboardEvent) {
			this.recorded = Array.from(this.pressedKeyCodes as Set<string>);
			event.preventDefault();
		},
		toHotkeysString(keys: string[]) {
			return keys.join('+').toLowerCase();
		},
	},
	watch: {
		recorded(newVal: string[], oldVal: string[]) {
			const toHotkeysString: (keys: string[]) => string = this.toHotkeysString;
			if (oldVal.length > 0) {
				// Unbind the old shortcut if it exists
				hotkeys.unbind(toHotkeysString(oldVal));
			}

			hotkeys(toHotkeysString(newVal), (event: Event) => {
				event.preventDefault();
				this.$emit(this.event as string);
			});
		},
	},
	template: `
    <input type="text" @keydown="onKeyDown($event)" :value="recorded.join('+')"/>
  `,
};
