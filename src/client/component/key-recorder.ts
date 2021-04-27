import hotkeys from 'hotkeys-js';
import * as vue from 'vue';

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
			pressed: new Set<string>(),
			recorded:
				(JSON.parse(
					localStorage.getItem(`shortcuts.${this.event}`) || 'null'
				) as string[] | null) ||
				(this.default as string[] | undefined) ||
				[],
		};
	},
	methods: {
		onKeyDown(event: KeyboardEvent) {
			const pressed = this.pressed as Set<string>;
			pressed.add(event.key);
			this.recorded = Array.from(pressed);
			event.preventDefault();
		},
		onKeyUp(event: KeyboardEvent) {
			(this.pressed as Set<string>).delete(event.key);
		},
		toHotkeysString(keys: string[]) {
			return keys.join('+').toLowerCase();
		},
	},
	watch: {
		recorded: {
			handler(newVal: string[], oldVal: string[]) {
				const event: string = this.event;
				const toHotkeysString: (keys: string[]) => string = this
					.toHotkeysString;
				if (oldVal !== undefined && oldVal.length > 0) {
					// Unbind the old shortcut if it exists
					hotkeys.unbind(toHotkeysString(oldVal));
				}

				hotkeys(toHotkeysString(newVal), (keyEvent: Event) => {
					keyEvent.preventDefault();
					this.$emit(event);
				});

				localStorage.setItem(`shortcuts.${event}`, JSON.stringify(newVal));
			},
			immediate: true,
		},
	},
	template: `
    <input type="text" @focus="pressed.clear()" @keydown="onKeyDown($event)"
				@keyup="onKeyUp($event)" :value="recorded.join('+')"
				class="key-recorder"/>
  `,
};
