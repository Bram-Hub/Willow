import * as express from 'express';

import {AssignmentsRow} from '../../../types/sql/public';
import db from '../util/database';

/**
 * GET /assignments
 * @param req the request sent from the client
 * @param res the response sent back to the client
 */
export async function get(req: express.Request, res: express.Response) {
	if (req.user === undefined) {
		return res.redirect('/');
	}

	const assignments: Pick<
		AssignmentsRow,
		'course_name' | 'due_date' | 'name'
	>[] = (
		await db.query(
			`
                SELECT
                    "assignments"."name",
                    COALESCE("courses"."display_name", "assignments"."course_name") AS "course_name",
                    "assignments"."due_date"
                FROM "assignments"
                INNER JOIN "courses"
                    ON (assignments.course_name = courses.name)
                INNER JOIN "students"
                    ON (courses.name = students.course_name)
                WHERE "students"."student_email" = $1
                ORDER BY
                    "assignments"."due_date" ASC NULLS LAST,
                    "assignments"."created_at" ASC
		    `,
			[req.user.email]
		)
	).rows;

	res.render('assignments', {assignments: assignments});
}
