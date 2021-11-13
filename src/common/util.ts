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
 * @param num_dims N - the number of dimensions (variables)
 * @param universe U - the set of constants
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
	if (!Object.keys(map).includes(assignedValue)) {
		return Object.keys(map).length;
	}

	// Recurse if we haven't gotten to the end
	if (variableIndex < variables.length - 1) {
		const leftOver = recursiveDeleteMapping(
			map[assignedValue],
			assignment,
			variables,
			variableIndex + 1
		);

		// We deleted the last element in this 
		if (leftOver === 0) {
			delete map[assignedValue];
		}
	}

	return Object.keys(map).length;
}

/**
 * Gets the first tuple of constants in the instantiation map
 * @param map the map representing the set of all possible tuples of constants
 * @returns the (arbitrarily) first tuple of constants in the instantiation map
 */
export function getFirstUnassigned(map: InstantiationMapping): string | null {
	const constants = Object.keys(map);
	if (constants.length === 0) {
		console.log('ERROR: Empty instantiation map being accessed.');
		return '';
	}
	const constant = constants[0];
	if (Object.keys(map[constant]).length === 0) {
		return `${constant}`;
	}
	return `${constant},${getFirstUnassigned(map[constant])}`;
}
