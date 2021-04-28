import * as vue from 'vue';
import * as vuex from 'vuex';
import {TruthTree, TruthTreeNode} from '../common/tree';
import {KeyRecorder} from './component/key-recorder';
import {
	SubstitutionRecorder,
	Substitutions,
} from './component/substitution-recorder';
import {TruthTreeComponent} from './component/truth-tree';

interface StoreState {
	developerMode: boolean;
	tree: TruthTree;
	selected: number | null;
	substitutions: Substitutions;
}

vue
	.createApp({
		components: {
			'key-recorder': KeyRecorder,
			'substitution-recorder': SubstitutionRecorder,
			'truth-tree': TruthTreeComponent,
		},
		data: function () {
			return {
				name: 'Untitled',
				colorTheme: 'system',
			};
		},
		mounted() {
			this.colorTheme = localStorage.getItem('theme');
			this.setColorTheme();
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
						this.$store.commit('select', null);
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
			togglePremise() {
				const selectedNode: TruthTreeNode | null = this.selectedNode;
				if (selectedNode === null) {
					return alert('You must select a statement before doing this.');
				}
				selectedNode.togglePremise();
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
							: tree.rightmostNode()?.id,
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
							: tree.rightmostNode()?.id,
						true
					)
				);
			},
			deleteStatement() {
				const tree: TruthTree = this.tree;
				const nodeId = this.selected as number | null;
				if (nodeId === null) {
					return;
				}
				const toSelect = tree.deleteNode(nodeId);
				if (toSelect === null) {
					alert('You may not delete the only statement in a branch.');
					return;
				}
				this.$store.commit('select', toSelect);
			},
			deleteBranch() {
				const tree: TruthTree = this.tree;
				const nodeId = this.selected as number | null;
				if (nodeId === null) {
					return;
				}
				const head = tree.getBranchHead(nodeId);
				const toSelect = tree.deleteBranch(head);
				if (toSelect === null) {
					return alert('You may not delete the root branch.');
				}
				this.$store.commit('select', toSelect);
			},
			moveUp() {
				const tree: TruthTree = this.$store.state.tree;
				const selectedNode: TruthTreeNode =
					(this.$store.getters.selectedNode as TruthTreeNode | null) ||
					tree.nodes[tree.root];

				const parentNode = tree.getNode(selectedNode.parent);
				if (parentNode === null) {
					// Prevent the user from moving above the root node
					this.$store.commit('select', tree.root);
				} else if (parentNode.children.length > 1) {
					const childIndex = parentNode.children.indexOf(selectedNode.id);
					if (childIndex > 0) {
						this.$store.commit(
							'select',
							tree.rightmostNode(parentNode.children[childIndex - 1])?.id
						);
					} else {
						this.$store.commit('select', parentNode.id);
					}
				} else {
					this.$store.commit('select', parentNode.id);
				}
			},
			moveDown() {
				const tree: TruthTree = this.$store.state.tree;
				const selectedNode: TruthTreeNode =
					(this.$store.getters.selectedNode as TruthTreeNode | null) ||
					tree.nodes[tree.root];

				if (selectedNode.children.length > 0) {
					this.$store.commit('select', selectedNode.children[0]);
				} else {
					let node = selectedNode;
					let parentNode = tree.getNode(node.parent);
					while (
						parentNode !== null &&
						parentNode.children[parentNode.children.length - 1] === node.id
					) {
						node = parentNode;
						parentNode = tree.getNode(node.parent);
					}
					if (parentNode === null) {
						return;
					}
					const childIndex = parentNode.children.indexOf(node.id);
					this.$store.commit('select', parentNode.children[childIndex + 1]);
				}
			},
			moveUpBranch() {},
			moveDownBranch() {},
			moveUpTree() {},
			moveDownTree() {},
			checkTree() {
				alert((this.tree as TruthTree).isCorrect());
			},
			toggleDeveloperMode() {
				this.$store.commit('toggleDeveloperMode');
			},
			setColorTheme() {
				let newColorTheme = this.colorTheme;
				if (newColorTheme === 'system') {
					newColorTheme = window.matchMedia('(prefers-color-scheme: dark)')
						.matches
						? 'dark'
						: 'light';
				}

				document.documentElement.setAttribute('data-theme', newColorTheme);
				this.colorTheme = newColorTheme;
				localStorage.setItem('theme', this.colorTheme);
			},
			toggleTheme() {
				if (this.colorTheme === 'system') {
					this.colorTheme = window.matchMedia('(prefers-color-scheme: dark)')
						.matches
						? 'light'
						: 'dark';
					return;
				}
				this.colorTheme = this.colorTheme === 'dark' ? 'light' : 'dark';
			},
		},
		watch: {
			name(newVal) {
				window.document.title = `${newVal} | Willow`;
			},
			colorTheme() {
				this.setColorTheme();
			},
		},
	})
	.use(
		vuex.createStore({
			state: {
				developerMode: false,
				tree: TruthTree.empty(),
				selected: null,
				substitutions: {},
			} as StoreState,
			getters: {
				selectedNode(state) {
					return state.tree.getNode(state.selected);
				},
			},
			mutations: {
				toggleDeveloperMode(state) {
					state.developerMode = !state.developerMode;
				},
				select(state, id: number) {
					state.selected = id;

					// Focus on the text box corresponding to the selected node
					// NOTE: We must use setTimeout as select is usually called
					//       immediately after a node is created, but before it
					//       is rendered in the DOM
					setTimeout(() => {
						const input = document.getElementById(`node${id}`);
						if (input instanceof HTMLInputElement) {
							input.focus();
						}
					}, 0);
				},
				setSubstitution(state, payload: {symbol: string; text: string}) {
					state.substitutions[payload.symbol] = payload.text;
				},
				setTree(state, tree: TruthTree) {
					state.tree = tree;
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
