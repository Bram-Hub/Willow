import * as express from 'express';

// import {TruthTree} from 'common/tree';
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
	const correct = false;
	// try {
	// 	const tree = TruthTree.deserialize(body.tree);
	// 	correct = tree.isCorrect().value;

	// 	// TODO: validate that the tree matches the options / premises of the assignment
	// } catch (err) {
	// 	return res.redirect('/?error=invalid_tree');
	// }

	// TODO: verify that assignment name and course name are valid for this user

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
				correct,
			]
		);
	} catch (err) {
		console.log(err);
		return res.redirect('/?error=submission_error');
	}

	// TODO: send some meaningful confirmation
	res.redirect('/?info=submission_successful');
});
