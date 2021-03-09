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
				tree: TruthTree.deserialize(`[
						{
								"id": 9,
								"text": "L",
								"children": [
										10
								],
								"decomposition": [],
								"parent": 8,
								"antecedent": 8
						},
						{
								"id": 10,
								"text": "\u00d7",
								"children": [],
								"decomposition": [
										9,
										6
								],
								"parent": 9
						},
						{
								"id": 12,
								"text": "\u00acM",
								"children": [
										13
								],
								"decomposition": [],
								"parent": 11,
								"antecedent": 2
						},
						{
								"id": 13,
								"text": "\u00d7",
								"children": [],
								"decomposition": [
										12,
										11
								],
								"parent": 12
						},
						{
								"id": 16,
								"text": "\u00acL",
								"children": [
										17
								],
								"decomposition": [],
								"parent": 15,
								"antecedent": 1
						},
						{
								"id": 17,
								"text": "\u25ef",
								"children": [],
								"decomposition": [],
								"parent": 16
						},
						{
								"id": 18,
								"text": "M",
								"children": [
										19
								],
								"decomposition": [],
								"parent": 15,
								"antecedent": 1
						},
						{
								"id": 19,
								"text": "\u25ef",
								"children": [],
								"decomposition": [],
								"parent": 18
						},
						{
								"id": 15,
								"text": "K",
								"children": [
										16,
										18
								],
								"decomposition": [],
								"parent": 14,
								"antecedent": 3
						},
						{
								"id": 20,
								"text": "L",
								"children": [
										21
								],
								"decomposition": [],
								"parent": 14,
								"antecedent": 3
						},
						{
								"id": 21,
								"text": "\u00d7",
								"children": [],
								"decomposition": [
										20,
										6
								],
								"parent": 20
						},
						{
								"id": 14,
								"text": "K",
								"children": [
										15,
										20
								],
								"decomposition": [],
								"parent": 11,
								"antecedent": 2
						},
						{
								"id": 11,
								"text": "M",
								"children": [
										12,
										14
								],
								"decomposition": [],
								"parent": 8,
								"antecedent": 8
						},
						{
								"id": 7,
								"text": "K",
								"children": [
										8
								],
								"decomposition": [],
								"parent": 6,
								"antecedent": 0
						},
						{
								"id": 8,
								"text": "L \u2228 M",
								"children": [
										9,
										11
								],
								"decomposition": [
										9,
										11
								],
								"parent": 7,
								"antecedent": 0
						},
						{
								"id": 22,
								"text": "\u00acK",
								"children": [
										23
								],
								"decomposition": [],
								"parent": 6,
								"antecedent": 0
						},
						{
								"id": 23,
								"text": "\u00ac(L \u2228 M)",
								"children": [
										24
								],
								"decomposition": [],
								"parent": 22,
								"antecedent": 0
						},
						{
								"id": 24,
								"text": "\u00d7",
								"children": [],
								"decomposition": [
										22,
										5
								],
								"parent": 23
						},
						{
								"id": 0,
								"text": "K \u2194 (L \u2228 M)",
								"children": [
										1
								],
								"decomposition": [
										7,
										8,
										22,
										23
								],
								"premise": true
						},
						{
								"id": 1,
								"text": "L \u2192 M",
								"children": [
										2
								],
								"decomposition": [
										16,
										18
								],
								"premise": true,
								"parent": 0
						},
						{
								"id": 2,
								"text": "M \u2192 K",
								"children": [
										3
								],
								"decomposition": [
										12,
										14
								],
								"premise": true,
								"parent": 1
						},
						{
								"id": 3,
								"text": "K \u2228 L",
								"children": [
										4
								],
								"decomposition": [
										15,
										20
								],
								"premise": true,
								"parent": 2
						},
						{
								"id": 4,
								"text": "\u00ac(K \u2192 L)",
								"children": [
										5
								],
								"decomposition": [
										5,
										6
								],
								"premise": true,
								"parent": 3
						},
						{
								"id": 5,
								"text": "K",
								"children": [
										6
								],
								"decomposition": [],
								"parent": 4,
								"antecedent": 4
						},
						{
								"id": 6,
								"text": "\u00acL",
								"children": [
										7,
										22
								],
								"decomposition": [],
								"parent": 5,
								"antecedent": 4
						}
				]`),
			},
			mutations: {
				setTree(state, tree) {
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
