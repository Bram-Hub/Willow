import * as express from 'express';

import {pool as db} from 'server/util/database';
import {AssignmentsRow, CoursesRow, SubmissionsRow} from 'types/sql/public';

export const router = express.Router();

router.get('/', async (req, res) => {
	// Only logged in users can view assignments
	if (req.user === undefined) {
		return res.redirect('/');
	}

	const assignments: (Pick<
		AssignmentsRow,
		'name' | 'course_name' | 'due_date'
	> &
		Pick<SubmissionsRow, 'correct' | 'submitted_at'> &
		Pick<CoursesRow, 'display_name'>)[] = (
		await db.query(
			`
				SELECT * FROM (
					SELECT DISTINCT ON (
						"assignments"."name",
						"assignments"."course_name"
					)
						"assignments"."name",
						COALESCE(
							"courses"."display_name",
							"assignments"."course_name"
						) AS "display_name",
						"assignments"."course_name",
						"assignments"."due_date",
						"submissions"."submitted_at",
						"submissions"."correct"
					FROM "assignments"
					INNER JOIN "courses"
						ON "assignments"."course_name" = "courses"."name"
					INNER JOIN "students"
						ON "courses"."name" = "students"."course_name"
					LEFT JOIN "submissions" ON (
						"submissions"."assignment_name" = "assignments"."name"
							AND "submissions"."course_name" = "courses"."name"
					)
					WHERE "students"."student_email" = $1
					ORDER BY
						"assignments"."name",
						"assignments"."course_name",
						"submissions"."submitted_at" DESC
				) AS "assignments_with_latest_submission"
				ORDER BY
					"assignments_with_latest_submission"."due_date",
					"assignments_with_latest_submission"."submitted_at" DESC
			`,
			[req.user.email]
		)
	).rows;

	res.render('assignments', {assignments: assignments});
});
