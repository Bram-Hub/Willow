import * as express from 'express';

import {TruthTree} from 'common/tree';
import {pool as db} from 'server/util/database';
import * as schemas from 'server/util/schemas';
import {PostRequest} from 'types/routes/submit/post-request';
import {AssignmentsRow} from 'types/sql/public';
import {logger} from 'server/logger';

export const router = express.Router();

router.post('/', async (req, res) => {
	try {
		// Only logged in users can submit assignments
		if (req.user === undefined) {
			return res.redirect('/?error=not_logged_in');
		}

		const validate = schemas.compileFile(
			'./schemas/routes/submit/post-request.json'
		);
		if (!validate(req.body)) {
			return res.status(400).render('error', {code: 400});
		}
		const body: PostRequest = req.body as any;

		// Check that the user is a student for the course for which they are trying
		// to submit an assignment
		const isStudent = (
			await db.query<{exists: boolean}>(
				`
				SELECT EXISTS (
					SELECT 1
					FROM "students"
					WHERE "course_name"	= $1 AND "student_email" = $2
				)
			`,
				[body.course_name, req.user.email]
			)
		).rows[0].exists;
		if (!isStudent) {
			return res.status(403).render('error', {code: 403});
		}

		// Check that the tree is well-formed
		let tree;
		try {
			tree = TruthTree.deserialize(body.tree);
		} catch (err) {
			return res.status(400).render('error', {code: 400});
		}

		const originalTree = (
			await db.query<Pick<AssignmentsRow, 'tree'>>(
				`
				SELECT "assignments"."tree"
				FROM "assignments"
				WHERE "assignments"."course_name" = $1
					AND "assignments"."name" = $2
			`,
				[body.course_name, body.assignment_name]
			)
		).rows.shift()?.tree;
		if (originalTree === undefined) {
			return res.status(400).render('error', {code: 400});
		}

		if (!tree.extends(TruthTree.deserialize(JSON.stringify(originalTree)))) {
			return res.redirect('/?error=does_not_match_assignment');
		}

		// Add the submission to the database
		try {
			await db.query(
				`
				INSERT INTO "submissions" (
					"student_email",
					"assignment_name",
					"course_name",
					"tree",
					"correct"
				)
				VALUES ($1, $2, $3, $4, $5)
			`,
				[
					req.user.email,
					body.assignment_name,
					body.course_name,
					body.tree,
					tree.isCorrect().value,
				]
			);
		} catch (err) {
			logger.error(
				`User ${req.user.email} could not submit assignment "${body.assignment_name}" for course "${body.course_name}"`
			);
			logger.error(err);

			return res.status(500).render('error', {code: 500});
		}

		res.redirect('/?info=submission_successful');
	} catch (err) {
		console.log(err);
	}
});
