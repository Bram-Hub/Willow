import {TruthTree} from '../src/common/tree';

const tree = TruthTree.empty();

test('Empty Truth Tree has exactly one node which is a leaf', () => {
	expect(Object.keys(tree.nodes)).toHaveLength(1);
	expect(tree.leaves.size).toEqual(1);
});

test('Add a node after the root', () => {
	const rootNode = tree.getNode(tree.root)!;
	// Originally root has no children
	expect(rootNode.children).toHaveLength(0);

	// Add a node after the root
	tree.addNodeAfter(rootNode.id, false);

	// Now we should have two nodes
	expect(Object.keys(tree.nodes).length).toEqual(2);

	// And the root should have a child
	expect(rootNode.children).toHaveLength(1);

	// But we should still only have one leaf
	expect(tree.leaves.size).toEqual(1);
});

test('Add a node before the root', () => {
	const originalRootNode = tree.getNode(tree.root)!;
	expect(originalRootNode.id).toEqual(0);

	// Add a node after the root
	const newNodeId = tree.addNodeBefore(originalRootNode.id);
	const newRootNode = tree.getNode(tree.root)!;

	// The new node should be the root
	expect(newNodeId).toEqual(newRootNode.id);
	expect(tree.root).not.toEqual(originalRootNode.id);

	// Now we should have three nodes
	expect(Object.keys(tree.nodes)).toHaveLength(3);

	// All non-leaves should have one child
	expect(newRootNode.children).toHaveLength(1);
	expect(originalRootNode.children).toHaveLength(1);

	// And we should still only have one leaf
	expect(tree.leaves.size).toEqual(1);
});

test('Add new branches', () => {
	const leafNode = tree.getNode(tree.leaves.values().next().value)!;
	expect(leafNode.children).toHaveLength(0);

	const leftBranchId = tree.addNodeAfter(leafNode.id, true);
	const rightBranchId = tree.addNodeAfter(leafNode.id, true);
	// The node ids should be distinct
	expect(leftBranchId).not.toEqual(rightBranchId);

	// Branching correctly means having multiple children
	expect(leafNode.children).toHaveLength(2);
	expect(tree.leaves.size).toEqual(2);
	expect(Object.keys(tree.nodes)).toHaveLength(5);
});

test('Remove parent of branching nodes', () => {
	const nodeToRemove = tree.getNode(
		tree.getNode(tree.leaves.values().next().value)!.parent
	)!;

	for (const leafId of tree.leaves) {
		const leafNode = tree.getNode(leafId)!;
		expect(leafNode.parent).toEqual(nodeToRemove.id);
	}

	tree.deleteNode(nodeToRemove.id);

	for (const leafId of tree.leaves) {
		const leafNode = tree.getNode(leafId)!;
		expect(leafNode.parent).toEqual(nodeToRemove.parent);
	}

	expect(Object.keys(tree.nodes)).toHaveLength(4);
});
