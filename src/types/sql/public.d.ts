export interface UsersRow {
	email: string;
	password: string;
	first_name: string;
	last_name: string;
	rcs_id: string | null;
	created_at: Date;
	last_login_at: Date | null;
	reset_token: string;
	reset_token_created_at: Date | null;
}

export interface CoursesRow {
	name: string;
	display_name: string | null;
	created_at: Date;
}

export interface InstructorsRow {
	course_name: string;
	instructor_email: string;
}

export interface StudentsRow {
	course_name: string;
	student_email: string;
}

export interface AssignmentsRow {
	name: string;
	course_name: string;
	created_at: Date;
	due_date: Date | null;
	tree: string;
}

export interface SubmissionsRow {
	student_email: string;
	assignment_name: string;
	course_name: string;
	submitted_at: Date;
	tree: string;
	correct: boolean;
}
