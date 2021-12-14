import * as express from 'express';

import {pool as db} from 'server/util/database';
import * as schemas from 'server/util/schemas';
import {PostRequest} from 'types/routes/courses/course/roster/post-request';
import {CoursesRow, InstructorsRow, StudentsRow} from 'types/sql/public';

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

	const [instructors, students] = await Promise.all([
		db.query<Pick<InstructorsRow, 'instructor_email'>>(
			`
				SELECT "instructor_email"
				FROM "instructors"
				WHERE "course_name" = $1
			`,
			[req.params.course]
		),
		db.query<Pick<StudentsRow, 'student_email'>>(
			`
				SELECT "student_email"
				FROM "students"
				WHERE "course_name" = $1
			`,
			[req.params.course]
		),
	]);

	res.render('courses/course/roster', {
		course: course,
		csrfToken: req.csrfToken(),
		instructors: instructors.rows.map(row => row.instructor_email),
		students: students.rows.map(row => row.student_email),
	});
});

router.post<'/', Params>('/', async (req, res) => {
	// Only logged in users can modify course rosters
	if (req.user === undefined) {
		return res.redirect('/?error=not_logged_in');
	}

	const validate = schemas.compileFile(
		'./schemas/routes/courses/course/roster/post-request.json'
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

	const emails = body.emails.split('\n');
	if (body.action === 'add') {
		const allUsersAdded = (
			await Promise.all(
				emails.map(email =>
					(async () => {
						try {
							await db.query(
								`
									INSERT INTO "${body.role}s" (
										"course_name",
										"${body.role}_email"
									)
									VALUES ($1, $2)
								`,
								[req.params.course, email]
							);
						} catch (err) {
							return false;
						}

						return true;
					})()
				)
			)
		).every(Boolean);
		if (!allUsersAdded) {
			return res.redirect(
				`/courses/${req.params.course}/roster?error=some_users_not_added`
			);
		}
	} else if (body.action === 'remove') {
		await db.query(
			`
				DELETE FROM "${body.role}s"
				WHERE "course_name" = $1 AND "${body.role}_email" = ANY($2)
			`,
			[req.params.course, emails]
		);
	}

	res.redirect(
		`/courses/${req.params.course}/roster?info=operation_successful`
	);
});
