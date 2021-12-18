import * as vue from 'vue';
import * as vuex from 'vuex';
import {TruthTree, TruthTreeNode} from '../common/tree';
import {KeyRecorder} from './component/key-recorder';
import {SubstitutionRecorder} from './component/substitution-recorder';
import {TruthTreeBranchComponent} from './component/truth-tree-branch';
import {getNodeIconClasses} from './component/truth-tree-node';
import {Assignment} from '../types/routes/index/assignment';
import {AssignmentsByCourse} from 'types/routes/index/assignments-by-course';

interface StoreState {
	shortcuts: {
		[action: string]: string;
	};
	substitutions: {
		[symbol: string]: string;
	};
	developerMode: boolean;
	tree: TruthTree;
	selected: number | null;
}

/**
 * Focuses on the text box corresponding to a given node in the DOM.
 * @param id the node id
 */
function focusOnNode(id?: number | null) {
	if (typeof id !== 'number') {
		return;
	}
	const input = document.getElementById(`node${id}`);
	if (input instanceof HTMLInputElement) {
		input.focus();
	}
}

interface HistoryState {
	tree: TruthTree;
	selected: number | null;
}

declare const assignmentsByCourse: AssignmentsByCourse;

declare const assignment:
	| {
			name: string;
			courseName: string;
			tree?: string;
	  }
	| undefined;

export const instance = vue
	.createApp({
		components: {
			'key-recorder': KeyRecorder,
			'substitution-recorder': SubstitutionRecorder,
			'truth-tree-branch': TruthTreeBranchComponent,
		},
		data: function () {
			return {
				assignment: assignment,
				name: assignment?.name ?? 'Untitled',
				assignmentsByCourse: assignmentsByCourse,
				courseName: assignment?.courseName ?? '',
				assignmentName: assignment?.name ?? '',
				undoStack: [],
				redoStack: [],
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
			getNodeIconClasses: getNodeIconClasses,
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
					const name = file.name.endsWith('.willow')
						? file.name.substring(0, file.name.length - '.willow'.length)
						: file.name;

					const fileContents = loadEvent.target?.result;
					if (typeof fileContents !== 'string') {
						return alert(
							'The selected file does not contain a truth tree. Perhaps you selected the wrong file, or the file has been corrupted.'
						);
					}
					try {
						(this.undoStack as HistoryState[]) = [];
						(this.redoStack as HistoryState[]) = [];
						this.$store.commit('select', {id: null});
						this.$store.commit('setTree', TruthTree.deserialize(fileContents));
						this.name = name;
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
					this.saveFile();
				}
			},
			recordState() {
				(this.undoStack as HistoryState[]).push({
					tree: (this.tree as TruthTree).clone(),
					selected: this.selected as number | null,
				});
				(this.redoStack as HistoryState[]) = [];
			},
			undo() {
				const undoStack: HistoryState[] = this.undoStack;
				if (undoStack.length === 0) {
					return alert('There is nothing to undo.');
				}

				(this.redoStack as HistoryState[]).push({
					tree: (this.tree as TruthTree).clone(),
					selected: this.selected as number | null,
				});

				this.$store.commit('select', {id: null});
				const lastState = undoStack.pop() as HistoryState;
				this.$store.commit('setTree', lastState.tree);
				this.$store.commit('select', {id: lastState.selected, delay: true});
			},
			redo() {
				const redoStack: HistoryState[] = this.redoStack;
				if (redoStack.length === 0) {
					return alert('There is nothing to redo.');
				}

				(this.undoStack as HistoryState[]).push({
					tree: (this.tree as TruthTree).clone(),
					selected: this.selected as number | null,
				});

				this.$store.commit('select', {id: null});
				const lastState = redoStack.pop() as HistoryState;
				this.$store.commit('setTree', lastState.tree);
				this.$store.commit('select', {id: lastState.selected, delay: true});
			},
			toggleComment() {
				const selectedNode: TruthTreeNode | null = this.selectedNode;
				if (selectedNode === null) {
					return alert('You must select a statement before doing this.');
				}

				this.recordState();
				selectedNode.comment = selectedNode.comment === null ? '' : null;
			},
			togglePremise() {
				const selectedNode: TruthTreeNode | null = this.selectedNode;
				if (selectedNode === null) {
					return alert('You must select a statement before doing this.');
				}

				if ((this.tree as TruthTree).options.lockedOptions) {
					return alert('You may not toggle premises while they are locked.');
				}

				this.recordState();
				selectedNode.togglePremise();
			},
			addStatementBefore() {
				const tree: TruthTree = this.tree;
				this.recordState();
				this.$store.commit('select', {
					id: tree.addNodeBefore(
						typeof this.selected === 'number' ? this.selected : tree.root
					),
					delay: true,
				});
			},
			addStatementAfter() {
				const tree: TruthTree = this.tree;
				this.recordState();
				this.$store.commit('select', {
					id: tree.addNodeAfter(
						typeof this.selected === 'number'
							? this.selected
							: tree.rightmostNode()?.id,
						false
					),
					delay: true,
				});
			},
			createBranch() {
				const tree: TruthTree = this.tree;
				this.recordState();

				const parentNodeId =
					typeof this.selected === 'number'
						? this.selected
						: tree.rightmostNode()?.id;

				const newNodeId = tree.addNodeAfter(parentNodeId, true);
				if (newNodeId === null) {
					return alert(
						'You must select a node to perform this action; if there are no nodes then try creating a new tree. If this issue persists, please contact an instructor.'
					);
				}

				// We return the parent node's id so users can quickly create new branches
				this.$store.commit('select', {
					id: parentNodeId,
					delay: true,
				});
			},
			deleteStatement() {
				const tree: TruthTree = this.tree;
				const selected: number | null = this.selected;
				if (selected === null) {
					return;
				}

				if (tree.nodes[selected].premise && tree.options.lockedOptions) {
					return alert('You may not delete premises while they are locked.');
				}

				this.recordState();
				const toSelect = tree.deleteNode(selected);
				if (toSelect === null) {
					alert('You may not delete the only statement in a branch.');
					return;
				}
				this.$store.commit('select', {id: toSelect, delay: true});
			},
			deleteBranch() {
				const tree: TruthTree = this.tree;
				const selected: number | null = this.selected;
				if (selected === null) {
					return;
				}
				const head = tree.getBranchHead(selected);
				if (head === null) {
					return;
				}

				if (tree.branchContainsPremise(head) && tree.options.lockedOptions) {
					return alert(
						'You may not delete branches that contain premises while premises are locked.'
					);
				}

				this.recordState();
				const toSelect = tree.deleteBranch(head);
				if (toSelect === null) {
					return alert('You may not delete the root branch.');
				}
				this.$store.commit('select', {id: toSelect, delay: true});
			},
			moveUp() {
				const tree: TruthTree = this.$store.state.tree;
				const selectedNode: TruthTreeNode =
					(this.$store.getters.selectedNode as TruthTreeNode | null) ??
					tree.nodes[tree.root];

				const parentNode = tree.getNode(selectedNode.parent);
				if (parentNode === null) {
					// Prevent the user from moving above the root node
					this.$store.commit('select', {id: tree.root});
				} else if (parentNode.children.length > 1) {
					const childIndex = parentNode.children.indexOf(selectedNode.id);
					if (childIndex > 0) {
						this.$store.commit('select', {
							id: tree.rightmostNode(parentNode.children[childIndex - 1])?.id,
						});
					} else {
						this.$store.commit('select', {id: parentNode.id});
					}
				} else {
					this.$store.commit('select', {id: parentNode.id});
				}
			},
			moveDown() {
				const tree: TruthTree = this.$store.state.tree;
				const selectedNode: TruthTreeNode =
					(this.$store.getters.selectedNode as TruthTreeNode | null) ??
					tree.nodes[tree.root];

				if (selectedNode.children.length > 0) {
					this.$store.commit('select', {id: selectedNode.children[0]});
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
					this.$store.commit('select', {
						id: parentNode.children[childIndex + 1],
					});
				}
			},
			moveUpBranch() {
				this.moveUp();
				this.$store.commit('select', {
					id: (this.tree as TruthTree).getBranchHead(
						this.selected as number | null
					),
				});
			},
			moveDownBranch() {
				this.moveDown();
				this.$store.commit('select', {
					id: (this.tree as TruthTree).getBranchTail(
						this.selected as number | null
					),
				});
			},
			moveUpTree() {
				this.$store.commit('select', {id: (this.tree as TruthTree).root});
			},
			moveDownTree() {
				this.$store.commit('select', {
					id: (this.tree as TruthTree).rightmostNode()?.id,
				});
			},
			toggleBranchExpansion() {
				this.$refs.rootBranch.toggleBranchExpansion();
			},
			collapseAllBranches() {
				this.$refs.rootBranch.collapseAllBranches();
			},
			expandAllBranches() {
				this.$refs.rootBranch.expandAllBranches();
			},
			collapseTerminatedBranches() {
				this.$refs.rootBranch.collapseTerminatedBranches();
			},
			checkStatement() {
				const selectedNode: TruthTreeNode | null = this.selectedNode;
				if (selectedNode === null) {
					return alert('You must select a statement before doing this.');
				}
				alert(selectedNode.getFeedback());
			},
			checkTree() {
				alert((this.tree as TruthTree).isCorrect().message);
			},
			toggleDeveloperMode() {
				this.$store.commit('toggleDeveloperMode');
			},
		},
		mounted: function () {
			const tree = (this.assignment as Assignment | undefined)?.tree;
			if (tree !== undefined) {
				try {
					this.$store.commit(
						'setTree',
						TruthTree.deserialize(JSON.stringify(assignment?.tree))
					);
				} catch (err) {
					alert(
						'The assigned tree could not be opened. Contact your instructor to resolve this issue.'
					);
					console.error(err);
				}
			}
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
				shortcuts: {},
				substitutions: {},
				developerMode: false,
				tree: TruthTree.empty(),
				selected: null,
			} as StoreState,
			getters: {
				selectedNode(state) {
					return state.tree.getNode(state.selected);
				},
			},
			mutations: {
				toggleDeveloperMode(state: StoreState) {
					state.developerMode = !state.developerMode;
				},
				select(
					state: StoreState,
					payload: {id: number | null; focus?: boolean; delay?: boolean}
				) {
					// Default values for payload
					payload = {
						focus: true,
						delay: false,
						...payload,
					};

					state.selected = payload.id;

					if (payload.focus) {
						if (payload.delay) {
							// Focus on the text box corresponding to the selected node
							// NOTE: We must use setTimeout if `delay` is true; for instance,
							//       immediately after a node is created, but before it is
							//       rendered in the DOM
							setTimeout(() => focusOnNode(payload.id), 0);
						} else {
							focusOnNode(payload.id);
						}
					}
				},
				setSubstitution(
					state: StoreState,
					payload: {symbol: string; text: string}
				) {
					state.substitutions[payload.symbol] = payload.text;
				},
				setTree(state: StoreState, tree: TruthTree) {
					state.tree = tree;
				},
			},
		})
	)
	.mount('#content');
