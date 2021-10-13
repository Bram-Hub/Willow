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
	const value = assignment[variable.toString()].toString();

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

export function getAssignment(map: InstantiationMapping): string | null {
	const variables = Object.keys(map);
	if (variables.length === 0) {
		console.log('ERROR: Empty instantiation map being accessed.');
		return '';
	}
	const variable = variables[0];
	if (Object.keys(map[variable]).length === 0) {
		return `${variable}`;
	}
	return `${variable},${getAssignment(map[variable])}`;
}
