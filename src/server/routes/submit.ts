import * as express from 'express';

import {TruthTree} from 'common/tree';
import {pool as db} from 'server/util/database';
import * as schemas from 'server/util/schemas';
import {PostRequest} from 'types/routes/submit/post-request';

export const router = express.Router();

router.post('/', async (req, res) => {
	// Only logged in users can submit
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

	// Validate the tree
	let tree: TruthTree;
	try {
		tree = TruthTree.deserialize(body.tree);
	} catch (err) {
		return res.redirect('/?error=invalid_tree');
	}

	const rows = (
		await db.query(
			`
			SELECT "assignments"."tree"
			FROM "assignments"
			WHERE "assignments"."course_name" = $1
				AND "assignments"."name" = $2
			LIMIT 1
		`,
			[body.course_name, body.assignment_name]
		)
	).rows;

	if (rows.length === 0) {
		// Course or Assignment does not exist
		return res.redirect('/?error=submission_error');
	}

	let assignedTree: TruthTree;
	try {
		assignedTree = TruthTree.deserialize(JSON.stringify(rows[0]['tree']));
	} catch (err) {
		return res.redirect('/?error=assignment_created_with_malformed_tree');
	}

	const valid = tree.extends(assignedTree);
	if (!valid) {
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
		console.log(err);
		return res.redirect('/?error=submission_error');
	}

	// TODO: send some meaningful confirmation
	res.redirect('/?info=submission_successful');
});
