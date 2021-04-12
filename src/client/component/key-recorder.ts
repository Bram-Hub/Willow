import hotkeys from 'hotkeys-js';
import * as vue from 'vue';

import * as keys from '../keys';

hotkeys.filter = event => {
	const target = event.target || event.srcElement;
	if (target instanceof Element) {
		return !target.classList.contains('key-recorder');
	}
	return true;
};

export const KeyRecorder: vue.Component = {
	name: 'key-recorder',
	props: {
		event: String,
		default: Array,
	},
	data() {
		return {
			recorded:
				(JSON.parse(
					localStorage.getItem(`shortcuts.${this.event}`) || 'null'
				) as string[] | null) ||
				(this.default as string[] | undefined) ||
				[],
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
		recorded: {
			handler(newVal: string[], oldVal: string[]) {
				const toHotkeysString: (keys: string[]) => string = this
					.toHotkeysString;
				if (oldVal !== undefined && oldVal.length > 0) {
					// Unbind the old shortcut if it exists
					hotkeys.unbind(toHotkeysString(oldVal));
				}

				hotkeys(toHotkeysString(newVal), (event: Event) => {
					event.preventDefault();
					this.$emit(this.event as string);
				});

				localStorage.setItem(
					`shortcuts.${this.event as string}`,
					JSON.stringify(newVal)
				);
			},
			immediate: true,
		},
	},
	template: `
    <input type="text" @keydown="onKeyDown($event)" :value="recorded.join('+')"
				class="key-recorder"/>
  `,
};
