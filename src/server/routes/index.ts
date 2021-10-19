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
				WHERE "students"."student_email" = $1 AND
					(
						CURRENT_TIMESTAMP <= "assignments"."due_date"
							OR "assignments"."due_date" IS NULL
					)
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

	const instructingCourses: Pick<CoursesRow, 'name' | 'display_name'>[] = (
		await db.query(
			`
			SELECT
				COALESCE("courses"."display_name", "instructors"."course_name")
					AS "display_name",
				"instructors"."course_name"
			FROM "instructors"
			INNER JOIN "courses"
				ON "courses"."name" = "instructors"."course_name"
			WHERE "instructors"."instructor_email" = $1
		`,
			[req.user.email]
		)
	).rows;

	const coursesInstructing: {
		[courseName: string]: string;
	} = {};
	for (const course of instructingCourses) {
		coursesInstructing[course.name] = course.display_name!;
	}

	// Handle assignment query
	const queryKeys = Object.keys(req.query);
	if (
		queryKeys.length > 0 &&
		queryKeys.includes('assignment') &&
		queryKeys.includes('course') &&
		queryKeys.includes('version') &&
		typeof req.query['assignment'] === 'string' &&
		typeof req.query['course'] === 'string' &&
		typeof req.query['version'] === 'string' &&
		['original', 'latest'].includes(req.query['version'])
	) {
		const assignmentName = req.query['assignment'];
		const courseName = req.query['course'];

		let rows = [];

		if (req.query['version'] === 'original') {
			rows = (
				await db.query(
					`
						SELECT "assignments"."tree"
						FROM "assignments"
						WHERE "assignments"."course_name" = $1
							AND "assignments"."name" = $2
						LIMIT 1
					`,
					[courseName, assignmentName]
				)
			).rows;
		} else if (req.query['version'] === 'latest') {
			rows = (
				await db.query(
					`
						SELECT "submissions"."tree"
						FROM "submissions"
						WHERE "submissions"."course_name" = $1
							AND "submissions"."assignment_name" = $2
							AND "submissions"."student_email" = $3
						ORDER BY "submissions"."submitted_at" DESC
						LIMIT 1
					`,
					[courseName, assignmentName, req.user.email]
				)
			).rows;
		}

		// Invalid input (or no prev. submissions) may return 0 rows,
		// in which case pretend there is no query
		if (rows.length === 1) {
			const assignedTreeData = {
				name: assignmentName,
				tree: rows[0]['tree'],
			};

			return res.render('index', {
				commit:
					process.env.HEROKU_SLUG_COMMIT ||
					execSync('git rev-parse HEAD').toString().trim(),
				assignmentsByCourse: assignmentsByCourse,
				coursesInstructing: coursesInstructing,
				assignedTreeData: assignedTreeData,
				csrfToken: req.csrfToken(),
			});
		}
	}

	res.render('index', {
		commit:
			process.env.HEROKU_SLUG_COMMIT ||
			execSync('git rev-parse HEAD').toString().trim(),
		assignmentsByCourse: assignmentsByCourse,
		coursesInstructing: coursesInstructing,
		csrfToken: req.csrfToken(),
	});
});
