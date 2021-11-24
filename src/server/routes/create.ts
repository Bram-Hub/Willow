import * as express from 'express';

import {TruthTree} from 'common/tree';
import {pool as db} from 'server/util/database';
import * as schemas from 'server/util/schemas';
import {PostRequest} from 'types/routes/create/post-request';

export const router = express.Router();

router.post('/', async (req, res) => {
	// Only logged in users can create assignments
	if (req.user === undefined) {
		return res.redirect('/?error=not_logged_in');
	}

	const validate = schemas.compileFile(
		'./schemas/routes/create/post-request.json'
	);
	if (!validate(req.body)) {
		return res.status(400).render('error', {code: 400});
	}
	const body: PostRequest = req.body as any;

	// Check that the user is an instructor for the course for which they are
	// trying to create an assignment
	const isInstructor = (
		await db.query<{exists: boolean}>(
			`
        SELECT EXISTS (
          SELECT 1
          FROM "instructors"
          WHERE "course_name" = $1 AND "instructor_email" = $2
        )
      `,
			[body.course_name, req.user.email]
		)
	).rows[0].exists;
	if (!isInstructor) {
		return res.status(403).render('error', {code: 403});
	}

	// Check that the tree is well-formed
	let tree;
	try {
		tree = TruthTree.deserialize(body.tree);
	} catch (err) {
		return res.status(400).render('error', {code: 400});
	}

	// Delete all empty nodes
	for (const node of Object.values(tree.nodes)) {
		if (node.text.trim() === '') {
			if (tree.deleteNode(node.id) === null) {
				return res.redirect('/?error=assigned_invalid_tree');
			}
		}
	}
	// All nodes must have statements since empty nodes were deleted
	if (!Object.values(tree.nodes).every(node => node.statement !== null)) {
		return res.redirect('/?error=assigned_invalid_tree');
	}

	if (!tree.checkRepresentation()) {
		return res.redirect('/?error=assigned_invalid_tree');
	}

	tree.options.lockedOptions = true;

	// Insert the assignment into the database
	try {
		await db.query(
			`
          INSERT INTO "assignments" (
            "name",
            "course_name",
            "due_date",
            "tree"
          )
          VALUES ($1, $2, $3, $4)
        `,
			[
				body.assignment_name,
				body.course_name,
				body.due_date ? new Date(body.due_date) : null,
				tree.serialize(),
			]
		);
	} catch (err) {
		return res.redirect('/?error=assignment_already_exists');
	}

	res.redirect('/?info=assignment_created');
});
