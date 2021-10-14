import {execSync} from 'child_process';
import * as express from 'express';

import {AssignmentsRow, CoursesRow} from 'types/sql/public';
import {pool as db} from 'server/util/database';

export const router = express.Router();

router.get('/', async (req, res) => {
	if (req.user === undefined) {
		return res.render('index', {
			commit:
				process.env.HEROKU_SLUG_COMMIT ||
				execSync('git rev-parse HEAD').toString().trim(),
		});
	}

	// Retrieve all assignments that are not past due for the courses of which the user is a student
	const assignments: (Pick<AssignmentsRow, 'name' | 'course_name'> &
		Pick<CoursesRow, 'display_name'>)[] = (
		await db.query(
			`
				SELECT
					"assignments"."name",
					COALESCE("courses"."display_name", "assignments"."course_name")
						AS "display_name",
					"assignments"."course_name"
				FROM "assignments"
				INNER JOIN "courses"
					ON "assignments"."course_name" = "courses"."name"
				INNER JOIN "students"
					ON "courses"."name" = "students"."course_name"
				WHERE "students"."student_email" = $1
				ORDER BY
					"assignments"."course_name" ASC,
					"assignments"."due_date" DESC NULLS LAST,
					"assignments"."name" ASC
			`,
			[req.user.email]
		)
	).rows;

	// Partition the assignment names by course
	const assignmentsByCourse: {
		[courseName: string]: {
			assignments: string[];
			displayName: string;
		};
	} = {};
	for (const assignment of assignments) {
		const courseName = assignment.course_name;
		if (!(courseName in assignmentsByCourse)) {
			assignmentsByCourse[courseName] = {
				assignments: [],
				displayName: assignment.display_name || courseName,
			};
		}
		assignmentsByCourse[courseName].assignments.push(assignment.name);
	}

	res.render('index', {
		commit:
			process.env.HEROKU_SLUG_COMMIT ||
			execSync('git rev-parse HEAD').toString().trim(),
		assignmentsByCourse: assignmentsByCourse,
		csrfToken: req.csrfToken(),
	});
});
