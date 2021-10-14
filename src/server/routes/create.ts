import * as express from 'express';

import {pool as db} from 'server/util/database';
import * as schemas from 'server/util/schemas';
import {PostRequest} from 'types/routes/create/post-request';

export const router = express.Router();

router.post('/', async (req, res) => {
	// Only logged in users can submit
	if (req.user === undefined) {
		return res.redirect('/?error=not_logged_in');
	}

	// TODO: Only admins can submit
	// if (req.user === undefined) {
	// 	return res.redirect('/?error=not_admin');
	// }

	const validate = schemas.compileFile(
		'./schemas/routes/create/post-request.json'
	);
	if (!validate(req.body)) {
		return res.status(400).render('error', {code: 400});
	}
	const body: PostRequest = req.body as any;

	// Add the submission to the database
	try {
		if (body.due_date.length === 0) {
			await db.query(
				`
					INSERT INTO "assignments" (
						"name",
						"course_name",
						"tree"
					)
					VALUES (
						$1,
						$2,
						$3
					)
				`,
				[body.assignment_name, body.course_name, body.tree]
			);
		} else {
			const date_parts = body.due_date.split('-');
			const year = parseInt(date_parts[0]);
			const month = parseInt(date_parts[1]);
			const day = parseInt(date_parts[2]);

			const due_date = new Date(year, month - 1, day);

			if (body.time_due.length !== 0) {
				const time_parts = body.time_due.split(':');
				const hours = parseInt(time_parts[0]);
				const minutes = parseInt(time_parts[1]);

				due_date.setHours(hours);
				due_date.setMinutes(minutes);
			}

			await db.query(
				`
					INSERT INTO "assignments" (
						"name",
						"course_name",
						"tree",
						"due_date"
					)
					VALUES (
						$1,
						$2,
						$3,
						to_timestamp($4, 'MM/DD/YYYY, HH:MI:SS PM')
					)
				`,
				[
					body.assignment_name,
					body.course_name,
					body.tree,
					due_date.toLocaleString(),
				]
			);
		}
	} catch (err) {
		console.log(err);
		return res.redirect('/?error=assignment_creation_error');
	}

	// TODO: send some meaningful confirmation
	res.redirect('/?info=assignment_creation_successful');
});
