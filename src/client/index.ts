import * as vue from 'vue';
import * as vuex from 'vuex';
import {TruthTree} from '../common/tree';
import {TruthTreeComponent} from './component/truth-tree';

vue
	.createApp({
		components: {
			'truth-tree': TruthTreeComponent,
		},
		data: function () {
			return {
				name: 'Untitled',
			};
		},
		computed: {
			tree() {
				return this.$store.state.tree;
			},
			selected() {
				return this.$store.state.selected;
			},
			selectedNode() {
				return this.$store.getters.selectedNode;
			},
		},
		methods: {
			openFile() {
				if (
					confirm(
						'Opening a file will overwrite the current truth tree. Are you sure that you would like to do this?'
					)
				) {
					document.querySelector<HTMLInputElement>('#open-file')?.click();
				}
			},
			loadFile(event: Event) {
				const input = event.target;
				if (!(input instanceof HTMLInputElement)) {
					return alert('An error occurred while opening the file.');
				}

				const file = input.files?.[0];
				if (file === undefined) {
					return alert('You must select a file to open.');
				}

				const reader = new FileReader();
				reader.readAsText(file, 'UTF-8');

				reader.onload = loadEvent => {
					this.name = file.name.endsWith('.willow')
						? file.name.substring(0, file.name.length - '.willow'.length)
						: file.name;

					const fileContents = loadEvent.target?.result;
					if (typeof fileContents !== 'string') {
						return alert(
							'The selected file does not contain a truth tree. Perhaps you selected the wrong file, or the file has been corrupted.'
						);
					}
					try {
						this.$store.commit('setTree', TruthTree.deserialize(fileContents));
					} catch (err) {
						alert(
							'The selected file does not contain a truth tree. Perhaps you selected the wrong file, or the file has been corrupted.'
						);
						console.error(err);
					}
				};
			},
			saveFile() {
				const a = document.createElement('a');
				a.href = URL.createObjectURL(
					new Blob([(this.tree as TruthTree).serialize()], {type: 'text/plain'})
				);
				a.download = `${this.name as string}.willow`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(a.href);
			},
			saveFileAs() {
				const name = prompt('Save as...');
				if (name !== null) {
					this.name = name;
				}
				this.saveFile();
			},
			addStatementBefore() {
				const tree: TruthTree = this.tree;
				this.$store.commit(
					'select',
					tree.addNodeBefore(
						typeof this.selected === 'number' ? this.selected : tree.root
					)
				);
			},
			addStatementAfter() {
				const tree: TruthTree = this.tree;
				this.$store.commit(
					'select',
					tree.addNodeAfter(
						typeof this.selected === 'number'
							? this.selected
							: tree.getLastLeaf(),
						false
					)
				);
			},
			createBranch() {
				const tree: TruthTree = this.tree;
				this.$store.commit(
					'select',
					tree.addNodeAfter(
						typeof this.selected === 'number'
							? this.selected
							: tree.getLastLeaf(),
						true
					)
				);
			},
			deleteStatement() {
				const tree: TruthTree = this.tree;
				const toSelect = tree.deleteNode(
					(this.selected as number | null) || tree.getLastLeaf()
				);
				if (toSelect === null) {
					alert('You may not delete the only statement in a branch.');
					return;
				}
				this.$store.commit('select', toSelect);
			},
			togglePremise() {
				const tree: TruthTree = this.tree;
				const id = typeof this.selected === 'number' ? this.selected : null;
				if (id === null) {
					return;
				}
				const selectedNode = tree.getNode(id);
				if (selectedNode === null) {
					return;
				}
				selectedNode.togglePremise();
			},
			toggleDeveloperMode() {
				this.$store.commit('toggleDeveloperMode');
			},
		},
		watch: {
			name(newVal) {
				window.document.title = `${newVal} | Willow`;
			},
		},
	})
	.use(
		vuex.createStore({
			state: {
				developerMode: false,
				tree: TruthTree.empty(),
				selected: null,
			},
			getters: {
				selectedNode(state) {
					return state.tree.getNode(state.selected);
				},
			},
			mutations: {
				toggleDeveloperMode(state) {
					state.developerMode = !state.developerMode;
				},
				setTree(state, tree) {
					state.tree = tree;
				},
				select(state, id) {
					state.selected = id;
				},
			},
		})
	)
	.mount('#content');

document.querySelectorAll('#toolbar > .dropdown > button').forEach(button => {
	button.addEventListener('click', () => {
		const menu = button.parentNode?.querySelector<HTMLElement>(
			'.dropdown-menu'
		);
		if (menu === null || menu === undefined) {
			return;
		}

		// Toggle the visibility of the dropdown menu when the button is clicked
		menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
		// Hide all other dropdown menus
		document
			.querySelectorAll<HTMLElement>('#toolbar > .dropdown > .dropdown-menu')
			.forEach(otherMenu => {
				if (menu === otherMenu) {
					return;
				}
				otherMenu.style.display = 'none';
			});
	});
});

window.addEventListener('click', event => {
	// Hide any visible dropdown menus if anything besides a dropdown button is
	// clicked
	if (
		!(event.target instanceof Element) ||
		!event.target.matches('#toolbar > .dropdown > button')
	) {
		document
			.querySelectorAll<HTMLElement>('#toolbar > .dropdown > .dropdown-menu')
			.forEach(menu => (menu.style.display = 'none'));
	}
});
