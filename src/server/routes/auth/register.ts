import * as express from 'express';

import {pool as db} from 'server/util/database';
import * as schemas from 'server/util/schemas';
import {PostRequest} from 'types/routes/auth/register/post-request';

export const router = express.Router();

router.get('/', (req, res) => {
	res.render('auth/register', {csrfToken: req.csrfToken()});
});

router.post('/', async (req, res) => {
	const validate = schemas.compileFile(
		'./schemas/routes/auth/register/post-request.json'
	);
	if (!validate(req.body)) {
		return res.status(400).render('error', {code: 400});
	}
	const body: PostRequest = req.body as any;

	try {
		await db.query(
			`
				INSERT INTO "users" ("email", "password", "first_name", "last_name", "rcs_id")
				VALUES ($1, CRYPT($2, GEN_SALT('bf')), $3, $4, $5)
			`,
			[
				body.email,
				body.password,
				body.first_name,
				body.last_name,
				body.rcs_id || null,
			]
		);
	} catch (err) {
		return res.redirect('/auth/register?error=email_already_used');
	}

	res.redirect('/auth/login');
});
