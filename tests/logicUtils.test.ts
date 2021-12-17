import {
	createNDimensionalMapping,
	deleteMapping,
	InstantiationMapping,
	AssignmentMap,
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
});
