import * as fs from 'fs';
import * as yaml from 'yaml';

export const config: {
	administrators?: string[];
} = yaml.parse(fs.readFileSync('config.yml').toString());

/**
 * Determines if a user is an administrator.
 * @param user the user
 * @returns true if `user` is an administrator, false otherwise
 */
export function isAdministrator(user: Express.User | undefined): boolean {
	return (
		user !== undefined &&
		user.email !== undefined &&
		(config.administrators?.includes(user.email) ?? false)
	);
}
