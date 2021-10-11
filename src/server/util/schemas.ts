import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as fs from 'fs';

// Use a single Ajv instance for schema caching
const ajv = new Ajv();
addFormats(ajv);

/**
 * Compiles a schema from a file.
 *
 * @param path the path to the schema
 * @returns the validator function for the schema located at `path`
 */
export function compileFile(path: string) {
	const schema = fs.readFileSync(path).toString();
	return ajv.compile(JSON.parse(schema));
}
