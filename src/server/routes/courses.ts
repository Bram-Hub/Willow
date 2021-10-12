import * as express from 'express';

import {CoursesRow} from '../../../types/sql/public';
import db from '../util/database';

/**
 * GET /courses
 * @param req the request sent from the client
 * @param res the response sent back to the client
 */
export async function get(req: express.Request, res: express.Response) {
	if (req.user === undefined) {
		return res.redirect('/');
	}

	const courses: Pick<CoursesRow, 'display_name'>[] = (
		await db.query(
			`
				SELECT COALESCE("courses"."display_name", "courses"."name") AS "display_name"
				FROM "courses"
				INNER JOIN "students"
					ON (courses.name = students.course_name)
				WHERE "students"."student_email" = $1
				ORDER BY "courses"."created_at" DESC
			`,
			[req.user.email]
		)
	).rows;

	res.render('courses', {courses: courses});
}
