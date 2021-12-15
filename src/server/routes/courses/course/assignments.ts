import * as express from 'express';
import * as fs from 'fs';
import * as tmp from 'tmp';
import * as xlsx from 'xlsx';

import {pool as db} from 'server/util/database';
import * as schemas from 'server/util/schemas';
import {PostRequest} from 'types/routes/courses/course/assignments/post-request';
import {
	AssignmentsRow,
	CoursesRow,
	SubmissionsRow,
	UsersRow,
} from 'types/sql/public';

export const router = express.Router({mergeParams: true});

interface Params {
	course: string;
}

router.get<'/', Params>('/', async (req, res) => {
	// Only logged in users can view course rosters
	if (req.user === undefined) {
		return res.redirect('/?error=not_logged_in');
	}

	const course = (
		await db.query<Pick<CoursesRow, 'display_name'>>(
			`
				SELECT "display_name"
				FROM "courses"
				WHERE "name" = $1
			`,
			[req.params.course]
		)
	).rows.shift();
	if (course === undefined) {
		return res.status(404).render('error', {code: 404});
	}

	// Check that the user is an instructor for this course
	const isInstructor = (
		await db.query<{exists: boolean}>(
			`
				SELECT EXISTS (
					SELECT 1
					FROM "instructors"
					WHERE "course_name" = $1 AND "instructor_email" = $2
				)
			`,
			[req.params.course, req.user.email]
		)
	).rows[0].exists;
	if (!isInstructor) {
		return res.status(403).render('error', {code: 403});
	}

	const assignments = (
		await db.query<Pick<AssignmentsRow, 'name' | 'due_date'>>(
			`
				SELECT "name", "due_date"
				FROM "assignments"
				WHERE "course_name" = $1
			`,
			[req.params.course]
		)
	).rows;

	res.render('courses/course/assignments', {
		assignments: assignments,
		course: course,
		csrfToken: req.csrfToken(),
	});
});

router.post<'/', Params>('/', async (req, res) => {
	// Only logged in users can download grade reports
	if (req.user === undefined) {
		return res.redirect('/?error=not_logged_in');
	}

	const validate = schemas.compileFile(
		'./schemas/routes/courses/course/assignments/post-request.json'
	);
	if (!validate(req.body)) {
		return res.status(400).render('error', {code: 400});
	}
	const body: PostRequest = req.body as any;

	// Check that the user is an instructor for this course
	const isInstructor = (
		await db.query<{exists: boolean}>(
			`
				SELECT EXISTS (
					SELECT 1
					FROM "instructors"
					WHERE "course_name" = $1 AND "instructor_email" = $2
				)
			`,
			[req.params.course, req.user.email]
		)
	).rows[0].exists;
	if (!isInstructor) {
		return res.status(403).render('error', {code: 403});
	}

	const assignments = body.assignments ?? [];
	const rows = [['Email', 'First Name', 'Last Name', 'RCS ID', ...assignments]];
	const students = (
		await db.query<
			Pick<UsersRow, 'email' | 'first_name' | 'last_name' | 'rcs_id'>
		>(
			`
				SELECT
					"users"."email",
					"users"."first_name",
					"users"."last_name",
					"users"."rcs_id"
				FROM "students"
				INNER JOIN "users" ON "students"."student_email" = "users"."email"
				WHERE "students"."course_name" = $1
			`,
			[req.params.course]
		)
	).rows;
	for (const student of students) {
		const submissionsByAssignment = (
			await db.query<
				Pick<SubmissionsRow, 'assignment_name' | 'correct'> & {late: boolean}
			>(
				`
					SELECT DISTINCT ON (
						"submissions"."assignment_name",
						"submissions"."course_name"
					)
						"submissions"."assignment_name",
						"submissions"."correct",
						"submissions"."submitted_at" > "assignments"."due_date"
							AS "late"
					FROM "submissions"
					INNER JOIN "assignments"
						ON "submissions"."assignment_name" = "assignments"."name"
					WHERE "submissions"."student_email" = $1
						AND "submissions"."course_name" = $2
						AND "submissions"."assignment_name" = ANY($3)
					ORDER BY
						"submissions"."assignment_name",
						"submissions"."course_name",
						"submissions"."submitted_at" DESC
				`,
				[student.email, req.params.course, assignments]
			)
		).rows.reduce((previous, row) => {
			previous[row.assignment_name] = {
				correct: row.correct,
				late: row.late,
			};
			return previous;
		}, {} as {[assignmentName: string]: Pick<SubmissionsRow, 'correct'> & {late: boolean}});

		rows.push([
			student.email,
			student.first_name,
			student.last_name,
			student.rcs_id || '',
			...assignments.map(assignment => {
				let cell = 'No submission';
				if (assignment in submissionsByAssignment) {
					const submission = submissionsByAssignment[assignment];
					cell = submission.correct ? 'Correct' : 'Incorrect';
					if (submission.late) {
						cell += ' (LATE)';
					}
				}
				return cell;
			}),
		]);
	}

	const workbook = xlsx.utils.book_new();
	xlsx.utils.book_append_sheet(workbook, xlsx.utils.aoa_to_sheet(rows));

	const filename = tmp.tmpNameSync({
		prefix: 'grade-report-',
		postfix: '.xlsx',
	});
	xlsx.writeFile(workbook, filename);
	res.download(filename, () => {
		fs.unlinkSync(filename);
	});
});
