import {
	createNDimensionalMapping,
	deleteMapping,
	InstantiationMapping,
	AssignmentMap,
	getFirstUnassigned,
} from '../src/common/util';
import {Formula} from '../src/common/formula';

function getSize(map: InstantiationMapping) {
	let size = 0;
	for (const x of Object.values(map)) {
		size += getSize(x);
	}
	if (Object.values(map).length === 0) {
		return 1;
	}
	return size;
}

test('Create a 2-dimensional map and remove elements from it', () => {
	const variables = [new Formula('x'), new Formula('y')];

	const universe = [
		new Formula('a'),
		new Formula('b'),
		new Formula('inv', [new Formula('b')]),
	];

	const uninstantiated = createNDimensionalMapping(variables.length, universe);

	// We expect a 3x3 map
	expect(getSize(uninstantiated)).toEqual(9);

	const firstAssignment: AssignmentMap = {
		x: new Formula('a'),
		y: new Formula('b'),
	};

	// Remove the assignment (x=a, y=b)
	deleteMapping(uninstantiated, firstAssignment, variables);

	// We expect the map to be one size smaller
	expect(getSize(uninstantiated)).toEqual(8);
	expect(getSize(uninstantiated['a'])).toEqual(2);

	const secondAssignment: AssignmentMap = {
		x: new Formula('a'),
		y: new Formula('a'),
	};
	const thirdAssignment: AssignmentMap = {
		x: new Formula('a'),
		y: new Formula('inv', [new Formula('b')]),
	};

	// Remove all remaining assignments where x=a
	deleteMapping(uninstantiated, secondAssignment, variables);
	deleteMapping(uninstantiated, thirdAssignment, variables);

	// We expect the map to be even smaller
	expect(getSize(uninstantiated)).toEqual(6);
	expect('a' in uninstantiated).toBeFalsy();
});

test('Create a 3-dimensional map and remove elements from it', () => {
	const variables = [new Formula('x'), new Formula('y'), new Formula('z')];

	const universe = [
		new Formula('a'),
		new Formula('b'),
		new Formula('inv', [new Formula('a')]),
		new Formula('inv', [new Formula('b')]),
	];

	const uninstantiated = createNDimensionalMapping(variables.length, universe);

	// Size should be 4^3 = 64
	expect(getSize(uninstantiated)).toEqual(64);

	let numberDeleted = 0;

	for (const constant of universe) {
		const newAssignment: AssignmentMap = {
			x: new Formula('a'),
			y: new Formula('b'),
			z: constant,
		};

		deleteMapping(uninstantiated, newAssignment, variables);
		numberDeleted += 1;

		// Every time we delete we should reduce the size by exactly one
		expect(getSize(uninstantiated)).toEqual(64 - numberDeleted);
	}

	// When we remove all assignments of (a,b,_), 'b' should be removed from a's submap
	expect('a' in uninstantiated).toBeTruthy();
	expect('b' in uninstantiated['a']).toBeFalsy();

	// Getting the unassigned shouldn't edit it
	const firstUnassigned = getFirstUnassigned(uninstantiated);
	const secondUnassigned = getFirstUnassigned(uninstantiated);
	expect(firstUnassigned).toEqual(secondUnassigned);
});
