import * as express from 'express';

import {PostRequest} from '../../../types/routes/submissions/post-request';
import db from '../util/database';
import * as schemas from '../util/schemas';
// import {TruthTree} from '../../common/tree';

/**
 * POST /courses/:courseName/assignments/:assignmentName
 * @param req the request sent from the client
 * @param res the response sent back to the client
 */
export async function post(req: express.Request, res: express.Response) {
	// Only logged in users can submit
	if (req.user === undefined) {
		return res.redirect('/?error=not_logged_in');
	}

	const validate = schemas.compileFile(
		'./schemas/routes/submissions/post-request.json'
	);
	if (!validate(req.body)) {
		return res.status(400).render('error', {code: 400});
	}
	const body: PostRequest = req.body as any;

	// Validate the tree
	const correct = false;
	// try {
	// 	const tree = TruthTree.deserialize(body.tree);
	// 	correct = tree.isCorrect();

	// 	// TODO: validate that the tree matches the options / premises of the assignment
	// } catch (err) {
	// 	return res.redirect('/?error=invalid_tree');
	// }

	// Add the submission to the database
	try {
		await db.query(
			`
				INSERT INTO "submissions" ("student_email", "assignment_name", "course_name", "tree", "correct")
				VALUES ($1, $2, $3, $4, $5)
			`,
			[
				req.user.email,
				req.params.assignmentName,
				req.params.courseName,
				body.tree,
				correct,
			]
		);
	} catch (err) {
		return res.redirect('/?error=submit_error');
	}

	// TODO: send some meaningful confirmation
	res.redirect('/?successful_submission');
}
