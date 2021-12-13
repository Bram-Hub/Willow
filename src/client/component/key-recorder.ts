import hotkeys from 'hotkeys-js';
import {defineComponent, PropType} from 'vue';

/**
 * Overrides the default hotkeys.js filter. This determines which elements may
 * be focused in order for a shortcut to be triggered.
 * @param event the key press event
 * @returns true if the shortcut should be trigerred, false otherwise
 */
hotkeys.filter = event => {
	const target = event.target ?? event.srcElement;
	if (target instanceof Element) {
		// Do not trigger any shortcuts if a key-recorder component is focused. This
		// prevents shortcuts from being triggered while the user is changing the
		// keys for a shortcut.
		return !target.classList.contains('key-recorder');
	}
	// Otherwise, always trigger the shortcut
	return true;
};

/**
 * An interface which maps native HTML key names to reserved hotkeys.js key
 * names. For instance, the HTML key 'ArrowUp' is mapped to the hotkeys.js key
 * 'Up'.
 */
interface KeyMap {
	[key: string]: string;
}

/**
 * A Vue component that records keyboard input and binds it to shortcuts.
 */
export const KeyRecorder = defineComponent({
	name: 'key-recorder',
	props: {
		// The `event` property is used to identify the shortcut in local storage
		event: {
			type: String,
			required: true,
		},
		// The `default` property is used to provide a default sequence of keys that
		// triggers this shortcut
		default: Array as PropType<string[]>,
	},
	// This component emits the `on-pressed` custom event when the keys for this
	// shortcut are pressed. The owner of this component should listen for this
	// event and call any appropriate methods.
	emits: ['on-pressed'],
	data() {
		return {
			// Tracks which keys are currently pressed. Only modified when the
			// component is focused by the user.
			pressed: new Set<string>(),
			// Certain keys cannot be captured by hotkeys.js and will be filtered out
			// from any recorded keyboard input
			keyFilter: new Set(['OS']),
			// Maps HTML key names to reserved hotkeys.js key names
			keyMap: {
				ArrowUp: 'Up',
				ArrowDown: 'Down',
				ArrowLeft: 'Left',
				ArrowRight: 'Right',
			} as KeyMap,
			// The recorded sequence of keys that trigger this shortcut
			recorded:
				// TODO: Check that the user did not manually set the value in local
				//       storage in order to break the type cast
				(JSON.parse(
					localStorage.getItem(`shortcuts.${this.event}`) ?? 'null'
				) as string[] | null) ??
				this.default ??
				[],
			// Whether or not this shortcut has been bound using hotkeys.js, used to
			// avoid unbinding another shortcut if two components have the same
			// sequence of keys
			bound: false,
		};
	},
	computed: {
		// TODO: Replace with mapState once it has support for TypeScript
		shortcuts(): {[action: string]: string} {
			return this.$store.state.shortcuts;
		},
		/**
		 * Determines whether or not this shortcut conflicts with another.
		 * @returns true if there is a conflict, false otherwise
		 */
		hasConflict() {
			const recorded: string[] = this.recorded;
			// If there is no key sequence, then do not consider this shortcut to have
			// a conflict (even if there is another one that does not have a key
			// sequence)
			if (recorded.length === 0) {
				return false;
			}

			for (const [action, shortcut] of Object.entries(this.shortcuts)) {
				if (action === this.event) {
					// A shortcut cannot have a conflict with itself
					continue;
				}
				// Use `toUniqueString` to guarantee that order and casing do not
				// matter; i.e., 'Control+S' and 's+Control' conflict
				if (shortcut === this.toUniqueString(recorded)) {
					return true;
				}
			}
			return false;
		},
	},
	methods: {
		/**
		 * Called when a key changes to the 'down' state while this component is
		 * focused.
		 * @param event the key down event
		 */
		onKeyDown(event: KeyboardEvent) {
			event.preventDefault();

			this.pressed.add(event.key);

			// Every time a key is pressed while this component is focused, change the
			// key sequence for this shortcut
			this.recorded = Array.from(this.pressed)
				.filter(key => !this.keyFilter.has(key))
				.map(key => (key in this.keyMap ? this.keyMap[key] : key));
		},
		/**
		 * Called when a key changes to the 'up' state while this component is
		 * focused.
		 * @param event the key up event
		 */
		onKeyUp(event: KeyboardEvent) {
			this.pressed.delete(event.key);
		},
		/**
		 * Converts an array of keys into a string recognized by hotkeys.js.
		 * @param keys the array of keys
		 * @returns the string passed to hotkeys.js
		 */
		toHotkeysString(keys: string[]) {
			return keys.join('+').toLowerCase();
		},
		/**
		 * Converts an array of keys to an order- and casing-independent string used
		 * to identify a key sequence. For instance, 'Control+S' and 's+Control'
		 * both have the same return value: 'control+s'.
		 * @param keys the array of keys
		 * @returns the order- and casing-independent string.
		 */
		toUniqueString(keys: string[]) {
			return Array.from(keys).sort().join('+').toLowerCase();
		},
	},
	watch: {
		recorded: {
			/**
			 * Called when the value of `this.recorded` changes.
			 * @param newVal the new value of `this.recorded`
			 * @param oldVal the old value of `this.recorded`
			 */
			handler(newVal: string[], oldVal: string[]) {
				if (oldVal !== undefined && oldVal.length > 0 && this.bound) {
					// If this shortcut is being re-bound, then unbind the old shortcut
					hotkeys.unbind(this.toHotkeysString(oldVal));
					this.bound = false;
				}

				if (newVal.length > 0 && !this.hasConflict) {
					// If the key sequence has not been cleared and it does not conflict
					// with another shortcut, then bind this shortcut using hotkeys.js
					hotkeys(this.toHotkeysString(newVal), (keyEvent: Event) => {
						keyEvent.preventDefault();
						this.$emit('on-pressed');
					});
					this.bound = true;
				}

				// Store this shortcut for conflict checking
				this.shortcuts[this.event] = this.toUniqueString(newVal);

				// Update local storage so that the new key sequence persists on page
				// reload
				localStorage.setItem(`shortcuts.${this.event}`, JSON.stringify(newVal));
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
});
