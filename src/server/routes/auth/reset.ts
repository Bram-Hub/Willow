import * as express from 'express';

import * as schemas from 'server/util/schemas';
import {pool as db} from 'server/util/database';
import {PostRequest} from 'types/routes/auth/reset/post-request';

export const router = express.Router();

router.get('/', (req, res) => {
	res.render('auth/reset', {csrfToken: req.csrfToken()});
});

router.post('/', async (req, res) => {
	const validate = schemas.compileFile(
		'./schemas/routes/auth/reset/post-request.json'
	);

	if (!validate(req.body)) {
		return res.status(400).render('error', {code: 400});
	}
	const body: PostRequest = req.body as any;

	if (Object.keys(body).includes('email')) {
		// Send an email with a reset link to the user
		const userHasEmail =
			(
				await db.query(
					`
						SELECT "users"."email"
						FROM "users"
						WHERE "users"."email" = $1
					`,
					[body.email]
				)
			).rowCount === 1;

		if (!userHasEmail) {
			// TODO: make this more user-friendly / apparent to user
			return res.redirect('/auth/reset/?error=email_not_found');
		}

		// TODO: send the email

		// TODO: make this more user-friendly / apparent to user
		return res.redirect('/auth/login');
	}

	// Any other type of request on this page requires you to be logged in
	if (req.user === undefined) {
		return res.redirect('/auth/reset/?error=not_logged_in');
	}

	if (Object.keys(body).includes('password')) {
		// Set the new password in the db
		await db.query(
			`
				UPDATE "users"
				SET "password"=CRYPT($2, GEN_SALT('bf'))
				WHERE "users"."email" = $1
			`,
			[req.user.email, body.password]
		);

		// TODO: make this more user-friendly / apparent to user
		return res.redirect('/?info=password_changed');
	}

	res.redirect('/auth/reset/?error=unknown_request');
});
