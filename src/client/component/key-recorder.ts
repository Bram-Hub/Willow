import hotkeys from 'hotkeys-js';
import * as vue from 'vue';

hotkeys.filter = event => {
	const target = event.target || event.srcElement;
	if (target instanceof Element) {
		return !target.classList.contains('key-recorder');
	}
	return true;
};

interface Shortcuts {
	[action: string]: string;
}

export const KeyRecorder: vue.Component = {
	name: 'key-recorder',
	props: {
		event: String,
		default: Array,
	},
	emits: ['on-pressed'],
	data() {
		return {
			keyFilter: new Set<string>(['OS']),
			keyMap: {
				ArrowUp: 'Up',
				ArrowDown: 'Down',
				ArrowLeft: 'Left',
				ArrowRight: 'Right',
			},
			pressed: new Set<string>(),
			recorded:
				(JSON.parse(
					localStorage.getItem(`shortcuts.${this.event}`) || 'null'
				) as string[] | null) ||
				(this.default as string[] | undefined) ||
				[],
			bound: false,
		};
	},
	computed: {
		hasConflict() {
			const recorded: string[] = this.recorded;
			if (recorded.length === 0) {
				return false;
			}

			for (const [action, shortcut] of Object.entries(
				this.$store.state.shortcuts as Shortcuts
			)) {
				if (action === this.event) {
					continue;
				}
				if (
					shortcut ===
					(this.toUniqueString as (keys: string[]) => string)(recorded)
				) {
					return true;
				}
			}
			return false;
		},
	},
	methods: {
		onKeyDown(event: KeyboardEvent) {
			event.preventDefault();

			const pressed = this.pressed as Set<string>;
			pressed.add(event.key);

			const keyMap: {[key: string]: string} = this.keyMap;
			(this.recorded as string[]) = Array.from(pressed)
				.filter(key => !(this.keyFilter as Set<string>).has(key))
				.map(key => (key in keyMap ? keyMap[key] : key));
		},
		onKeyUp(event: KeyboardEvent) {
			(this.pressed as Set<string>).delete(event.key);
		},
		toHotkeysString(keys: string[]) {
			return keys.join('+').toLowerCase();
		},
		toUniqueString(keys: string[]) {
			return Array.from(keys).sort().join('+').toLowerCase();
		},
	},
	watch: {
		recorded: {
			handler(newVal: string[], oldVal: string[]) {
				const event: string = this.event;
				const toHotkeysString: (keys: string[]) => string = this
					.toHotkeysString;
				const toUniqueString: (keys: string[]) => string = this.toUniqueString;

				if (
					oldVal !== undefined &&
					oldVal.length > 0 &&
					(this.bound as boolean)
				) {
					hotkeys.unbind(toHotkeysString(oldVal));
					(this.bound as boolean) = false;
				}

				if (newVal.length > 0 && !(this.hasConflict as boolean)) {
					hotkeys(toHotkeysString(newVal), (keyEvent: Event) => {
						keyEvent.preventDefault();
						this.$emit('on-pressed');
					});
					(this.bound as boolean) = true;
				}
				(this.$store.state.shortcuts as Shortcuts)[event] = toUniqueString(
					newVal
				);

				localStorage.setItem(`shortcuts.${event}`, JSON.stringify(newVal));
			},
			immediate: true,
		},
	},
	template: `
    <i
				:class="{
					'fas': true,
					'fa-exclamation-circle': true,
					'shortcut-conflict': hasConflict,
				}"
				title="This shortcut has already been bound to another action."></i>
		<input v-bind="$attrs" type="text" @focus="pressed.clear()"
				@keydown="onKeyDown($event)"
				@keyup="onKeyUp($event)" :value="recorded.join('+')"
				:class="{
					'key-recorder': true,
					'shortcut-conflict': hasConflict,
				}"/>
		<button @click="recorded = []" class="hidden">
			<i class="fas fa-trash clear-shortcut"></i>
		</button>
  `,
};
