import * as vue from 'vue';
import * as vuex from 'vuex';
import {TruthTree, TruthTreeNode} from '../common/tree';
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
			selectedNode() {
				return this.$store.getters.selectedNode;
			},
			nextId() {
				if (this.tree.nodes.length === 0) {
					return 0;
				}
				return (
					Math.max(...Object.keys(this.tree.nodes).map(id => parseInt(id))) + 1
				);
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
					new Blob([this.$store.state.tree.serialize()], {type: 'text/plain'})
				);
				a.download = `${this.name}.willow`;
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
				const selectedNode: TruthTreeNode =
					(this.selectedNode as TruthTreeNode | null) ||
					(tree.getNode(tree.root) as TruthTreeNode);

				const newNode = new TruthTreeNode(this.nextId as number, tree);
				const parentNode: TruthTreeNode | null = tree.getNode(
					selectedNode.parent
				);
				if (parentNode !== null) {
					for (let index = 0; index < parentNode.children.length; ++index) {
						if (parentNode.children[index] === selectedNode.id) {
							parentNode.children[index] = newNode.id;
						}
					}
				}
				newNode.parent = selectedNode.parent;
				newNode.children = [selectedNode.id];
				selectedNode.parent = newNode.id;

				tree.nodes[newNode.id] = newNode;
				if (newNode.parent === null) {
					tree.root = newNode.id;
				}
			},
			addStatementAfter() {
				const tree: TruthTree = this.tree;
				const selectedNode: TruthTreeNode =
					(this.selectedNode as TruthTreeNode | null) ||
					(tree.getNode(tree.root) as TruthTreeNode);

				const newNode = new TruthTreeNode(this.nextId as number, tree);
				newNode.children = selectedNode.children;
				selectedNode.children = [newNode.id];
				newNode.parent = selectedNode.id;
				for (const child of newNode.children) {
					const childNode = tree.getNode(child);
					if (childNode !== null) {
						childNode.parent = newNode.id;
					}
				}

				tree.nodes[newNode.id] = newNode;
				if (tree.leaves.has(selectedNode.id)) {
					tree.leaves.delete(selectedNode.id);
					tree.leaves.add(newNode.id);
				}
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
				selected: undefined,
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
