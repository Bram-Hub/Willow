import {Formula} from './formula';

export interface AssignmentMap {
	[variable: string]: Formula;
}

export interface InstantiationMapping {
	[variable: string]: InstantiationMapping;
}

export interface EvaluationResponse {
	value: boolean;
	message: string;
}

/**
 * Recursively creates an N-dimensional map for the given universe. Each
 * constant in the universe is a key which maps to an (N-1)-dimensional map.
 * Effectively, if there are |U| elements in the universe, then the N-dimensional
 * map will have |U|^N elements.
 *
 * @param num_dims the number of dimensions N, typically the number of variables
 * @param universe the set of constants U
 * @returns an N-dimensional map representing every N-tuple of the elements in the universe
 */
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

/**
 * Recursively deletes an assignment of constants to variables from the given map.
 * This function will delete any maps with zero elements.
 * @param map the N-dimensional map to remove from
 * @param assignment the map from variable to constant
 * @param variables the order that the variables have been assigned
 */
export function deleteMapping(
	map: InstantiationMapping,
	assignment: AssignmentMap,
	variables: Formula[]
) {
	recursiveDeleteMapping(map, assignment, variables, 0);
}

function recursiveDeleteMapping(
	map: InstantiationMapping,
	assignment: AssignmentMap,
	variables: Formula[],
	variableIndex: number
) {
	const variable = variables[variableIndex];
	const assignedValue = assignment[variable.toString()].toString();

	// If this assignment is already satisfied, stop early
	if (!(assignedValue in map)) {
		return;
	}

	// Recurse to the last variable
	if (variableIndex < variables.length - 1) {
		recursiveDeleteMapping(
			map[assignedValue],
			assignment,
			variables,
			variableIndex + 1
		);
	}

	// If the submap is empty, we can delete it
	// The last variable's submap will always be empty, so we always delete it
	if (Object.keys(map[assignedValue]).length === 0) {
		delete map[assignedValue];
	}
}

/**
 * Gets the first tuple of constants in the instantiation map
 * @param map the map representing the set of all possible tuples of constants
 * @returns the (arbitrarily) first tuple of constants in the instantiation map
 */
export function getFirstUnassigned(map: InstantiationMapping): string | null {
	const constant = Object.keys(map).shift();
	if (constant === undefined) {
		console.error('ERROR: Empty instantiation map being accessed.');
		return null;
	}

	if (Object.keys(map[constant]).length === 0) {
		return `${constant}`;
	}
	return `${constant},${getFirstUnassigned(map[constant])}`;
}
