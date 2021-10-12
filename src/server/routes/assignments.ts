import * as express from 'express';

import {AssignmentsRow, SubmissionsRow} from '../../../types/sql/public';
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

	const assignments: (Pick<
		AssignmentsRow,
		'name' | 'course_name' | 'due_date'
	> &
		Pick<SubmissionsRow, 'correct' | 'submitted_at'>)[] = (
		await db.query(
			`
				SELECT * FROM (
					SELECT DISTINCT ON ("assignments"."name", "assignments"."course_name")
						"assignments"."name",
						COALESCE("courses"."display_name", "assignments"."course_name")
							AS "course_name",
						"assignments"."due_date",
						"submissions"."submitted_at",
						"submissions"."correct"
					FROM "assignments"
					INNER JOIN "courses"
						ON "assignments"."course_name" = "courses"."name"
					INNER JOIN "students"
						ON "courses"."name" = "students"."course_name"
					LEFT JOIN "submissions"
						ON (
							"submissions"."assignment_name" = "assignments"."name" AND
							"submissions"."course_name" = "courses"."name"
						)
					WHERE
						"students"."student_email" = $1
					ORDER BY
						"assignments"."name" ASC,
						"assignments"."course_name" ASC,
						"submissions"."submitted_at" DESC NULLS LAST
				) AS "submission_table"
				ORDER BY
					"submission_table"."submitted_at" DESC NULLS LAST,
					"submission_table"."due_date" ASC NULLS LAST
			`,
			[req.user.email]
		)
	).rows;

	res.render('assignments', {assignments: assignments});
}
