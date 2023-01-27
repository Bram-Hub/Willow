import {execSync} from 'child_process';
import * as express from 'express';

import {pool as db} from 'server/util/database';
import * as schemas from 'server/util/schemas';
import {Assignment} from 'types/routes/index/assignment';
import {AssignmentsByCourse} from 'types/routes/index/assignments-by-course';
import {GetRequest} from 'types/routes/index/get-request';
import {AssignmentsRow, CoursesRow, SubmissionsRow} from 'types/sql/public';

export const router = express.Router();

router.get('/', async (req, res) => {
	if (req.user === undefined) {
		return res.render('index', {
			commit:
				process.env.HEROKU_SLUG_COMMIT ??
				execSync('git rev-parse HEAD').toString().trim(),
		});
	}

	// Retrieve all assignments for the courses of which the user is a student
	const assignments = (
		await db.query<
			Pick<AssignmentsRow, 'name' | 'course_name'> &
				Pick<CoursesRow, 'display_name'>
		>(
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
	const assignmentsByCourse: AssignmentsByCourse = {};
	for (const assignment of assignments) {
		const courseName = assignment.course_name;
		if (!(courseName in assignmentsByCourse)) {
			assignmentsByCourse[courseName] = {
				assignments: [],
				displayName: assignment.display_name ?? courseName,
			};
		}
		assignmentsByCourse[courseName].assignments.push(assignment.name);
	}

	const coursesAsInstructor = (
		await db.query<Pick<CoursesRow, 'name' | 'display_name'>>(
			`
				SELECT
					COALESCE("courses"."display_name", "courses"."name") AS "display_name",
					"courses"."name"
				FROM "instructors"
				INNER JOIN "courses" ON "courses"."name" = "instructors"."course_name"
				WHERE "instructors"."instructor_email" = $1
			`,
			[req.user.email]
		)
	).rows;

	let assignment: Assignment | undefined = undefined;
	const validate = schemas.compileFile(
		'./schemas/routes/index/get-request.json'
	);

	if (validate(req.query)) {
		const query: GetRequest = req.query as any;

		const isInstructor = coursesAsInstructor
			.map(tuple => {
				return tuple.name;
			})
			.includes(query.course);
		// A user is in a course if they are an instructor or have an assignment from the course.
		const userInCourse =
			isInstructor ||
			Object.prototype.hasOwnProperty.call(assignmentsByCourse, query.course);

		if (!userInCourse) {
			// If the user isn't in the course, fast-track them out of the function.
			return res.render('index', {
				commit:
					process.env.HEROKU_SLUG_COMMIT ??
					execSync('git rev-parse HEAD').toString().trim(),
				assignmentsByCourse: assignmentsByCourse,
				coursesAsInstructor: coursesAsInstructor,
				assignment: assignment,
				csrfToken: req.csrfToken(),
			});
		}

		// Selecting another user's tree
		let email = req.user.email;
		if (query.student !== undefined && email !== query.student) {
			// Only instructors of a course can query for trees of other users.
			if (isInstructor) {
				email = query.student;
				// If an instructor wants to see a student's submission, they will always want the
				// latest submission.
				query.version = 'latest';
				// TODO: show which user the instructor is viewing in an accessible spot.
			} else {
				console.warn(
					`User "${req.user.email}" tried to access user "${query.student}"'s submission (access denied).`
				);
				// TODO: inform user that their request failed.
				// TODO: log insecure attempts to disk.
			}
		}

		let tree: string | undefined = undefined;
		if (query.version === 'latest') {
			tree = (
				await db.query<Pick<SubmissionsRow, 'tree'>>(
					`
						SELECT "tree"
						FROM "submissions"
						WHERE "student_email" = $1
							AND "assignment_name" = $2
							AND "course_name" = $3
						ORDER BY "submitted_at" DESC
						LIMIT 1
					`,
					[email, query.assignment, query.course]
				)
			).rows.shift()?.tree;

			// If a student requests their latest submission but have never submitted, they should
			// get the original tree.
			if (tree === undefined) {
				query.version = 'original';
			}
		}

		if (query.version === 'original') {
			tree = (
				await db.query<Pick<AssignmentsRow, 'tree'>>(
					`
						SELECT "tree"
						FROM "assignments"
						WHERE "name" = $1 AND "course_name" = $2
					`,
					[query.assignment, query.course]
				)
			).rows.shift()?.tree;
		}

		assignment = {
			name: query.assignment,
			courseName: query.course,
			tree: tree,
		};
	}

	return res.render('index', {
		commit:
			process.env.HEROKU_SLUG_COMMIT ??
			execSync('git rev-parse HEAD').toString().trim(),
		assignmentsByCourse: assignmentsByCourse,
		coursesAsInstructor: coursesAsInstructor,
		assignment: assignment,
		csrfToken: req.csrfToken(),
	});
});
