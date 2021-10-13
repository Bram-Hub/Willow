import * as express from 'express';

import {pool as db} from 'server/util/database';
import {CoursesRow} from 'types/sql/public';

export const router = express.Router();

router.get('/', async (req, res) => {
	if (req.user === undefined) {
		return res.redirect('/');
	}

	// Retrieve all courses of which this user is a student
	const courses: Pick<CoursesRow, 'display_name'>[] = (
		await db.query(
			`
				SELECT COALESCE("courses"."display_name", "courses"."name") AS "display_name"
				FROM "courses"
				INNER JOIN "students"
					ON "courses"."name" = "students"."course_name"
				WHERE "students"."student_email" = $1
				ORDER BY "courses"."created_at" DESC
			`,
			[req.user.email]
		)
	).rows;

	res.render('courses', {courses: courses});
});
