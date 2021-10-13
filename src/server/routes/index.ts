import * as express from 'express';

import {execSync} from 'child_process';
import {AssignmentsRow, SubmissionsRow} from '../../../types/sql/public';
import db from '../util/database';

/**
 * GET /assignments
 * @param req the request sent from the client
 * @param res the response sent back to the client
 */
export async function get(req: express.Request, res: express.Response) {
	if (req.user === undefined) {
		return res.render('index', {
			commit:
				process.env.HEROKU_SLUG_COMMIT ||
				execSync('git rev-parse HEAD').toString().trim(),
		});
	}

	const assignments: (Pick<
		AssignmentsRow,
		'name' | 'course_name' | 'due_date'
	> &
		Pick<SubmissionsRow, 'correct' | 'submitted_at'>)[] = (
		await db.query(
			`
				SELECT
					"assignments"."name",
					COALESCE("courses"."display_name", "assignments"."course_name")
						AS "course_name",
					"assignments"."due_date"
				FROM "assignments"
				INNER JOIN "courses"
					ON "assignments"."course_name" = "courses"."name"
				INNER JOIN "students"
					ON "courses"."name" = "students"."course_name"
				WHERE
					"students"."student_email" = $1
				ORDER BY
					"assignments"."due_date" DESC NULLS LAST,
					"assignments"."name" ASC,
					"assignments"."course_name" ASC
			`,
			[req.user.email]
		)
	).rows;

	res.render('index', {
		commit:
			process.env.HEROKU_SLUG_COMMIT ||
			execSync('git rev-parse HEAD').toString().trim(),
		assignments: assignments,
	});
}
