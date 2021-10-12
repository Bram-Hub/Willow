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

	// Retrieve all assignments for every course of which this user is a student
	const assignments: Pick<
		AssignmentsRow,
		'name' | 'course_name' | 'due_date'
	>[] = (
		await db.query(
			`
                SELECT
                    "assignments"."name",
                    COALESCE("courses"."display_name", "courses"."name")
						AS "course_name",
                    "assignments"."due_date"
                FROM "assignments"
                INNER JOIN "courses"
                    ON "courses"."name" = "assignments"."course_name"
                INNER JOIN "students"
					ON "courses"."name" = "students"."course_name"
                WHERE "students"."student_email" = $1
                ORDER BY "assignments"."due_date", "assignments"."created_at"
		    `,
			[req.user.email]
		)
	).rows;

	res.render('assignments', {assignments: assignments});
}
