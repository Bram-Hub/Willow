import * as express from 'express';

import {isAdministrator} from 'server/config';
import {router as courseRouter} from 'server/routes/courses/course';
import {pool as db} from 'server/util/database';
import * as schemas from 'server/util/schemas';
import {PostRequest} from 'types/routes/courses/post-request';
import {CoursesRow} from 'types/sql/public';

export const router = express.Router();

router.use('/:course', courseRouter);

router.get('/', async (req, res) => {
	if (req.user === undefined) {
		return res.redirect('/');
	}

	// Retrieve all courses of which this user is a student
	const coursesAsStudent = (
		await db.query<Pick<CoursesRow, 'name' | 'display_name'>>(
			`
				SELECT
					"courses"."name",
					COALESCE("courses"."display_name", "courses"."name")
						AS "display_name"
				FROM "courses"
				INNER JOIN "students"
					ON "courses"."name" = "students"."course_name"
				WHERE "students"."student_email" = $1
				ORDER BY "courses"."created_at" DESC
			`,
			[req.user.email]
		)
	).rows;

	// Retrieve all courses of which this user is an instructor
	const coursesAsInstructor = (
		await db.query<Pick<CoursesRow, 'name' | 'display_name'>>(
			`
				SELECT
					"courses"."name",
					COALESCE("courses"."display_name", "courses"."name")
						AS "display_name"
				FROM "courses"
				INNER JOIN "instructors"
					ON "courses"."name" = "instructors"."course_name"
				WHERE "instructors"."instructor_email" = $1
				ORDER BY "courses"."created_at" DESC
			`,
			[req.user.email]
		)
	).rows;

	res.render('courses', {
		coursesAsStudent: coursesAsStudent,
		coursesAsInstructor: coursesAsInstructor,
		csrfToken: req.csrfToken(),
	});
});

router.post('/', async (req, res) => {
	if (!isAdministrator(req.user)) {
		return res.status(401).render('error', {code: 401});
	}

	const validate = schemas.compileFile(
		'./schemas/routes/courses/post-request.json'
	);
	if (!validate(req.body)) {
		return res.status(400).render('error', {code: 400});
	}
	const body: PostRequest = req.body as any;

	try {
		await db.query(
			`
				INSERT INTO "courses" ("name", "display_name")
				VALUES ($1, $2)
			`,
			[body.name, body.display_name]
		);
		await db.query(
			`
				INSERT INTO "instructors" ("course_name", "instructor_email")
				VALUES ($1, $2)
			`,
			[body.name, req.user?.email as string]
		);
	} catch (err) {
		return res.redirect('/courses?error=course_already_exists');
	}

	res.redirect('/courses?info=course_created');
});
