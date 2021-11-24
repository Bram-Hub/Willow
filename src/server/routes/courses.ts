import * as express from 'express';

import {pool as db} from 'server/util/database';
import {CoursesRow} from 'types/sql/public';

export const router = express.Router();

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
	});
});
