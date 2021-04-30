import {Formula} from './formula';

export interface InstantiationMapping {
	[variable: string]: InstantiationMapping;
}

export function createNDimensionalMapping(
	num_dims: number,
	universe: Formula[]
) {
	const map: InstantiationMapping = {};

	if (num_dims === 0) {
		return map;
	}

	for (const value of universe) {
		map[value.toString()] = createNDimensionalMapping(num_dims - 1, universe);
	}

	return map;
}

export function deleteMapping(
	map: InstantiationMapping,
	assignment: {[variable: string]: string},
	variables: Formula[]
) {
	recursiveDeleteMapping(map, assignment, variables, 0);
}

function recursiveDeleteMapping(
	map: InstantiationMapping,
	assignment: {[variable: string]: string},
	variables: Formula[],
	variableIndex: number
) {
	const variable = variables[variableIndex];
	const value = assignment[variable.toString()];

	// If this assignment is already satisfied, stop early
	if (!Object.keys(map).includes(value)) {
		return;
	}

	if (variableIndex < variables.length - 1) {
		recursiveDeleteMapping(
			map[value],
			assignment,
			variables,
			variableIndex + 1
		);
	}

	if (Object.keys(map[value]).length === 0) {
		delete map[value];
	}
}