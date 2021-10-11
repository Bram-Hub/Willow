declare namespace Express {
	export interface User {
		email: string;
		first_name: string;
		last_name: string;
		rcs_id: string | null;
	}
}
