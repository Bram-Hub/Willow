import * as express from 'express';

import * as schemas from 'server/util/schemas';
import {pool as db} from 'server/util/database';
import {GetRequest} from 'types/routes/auth/reset/get-request';
import {PostRequest} from 'types/routes/auth/reset/post-request';
import {UsersRow} from 'types/sql/public';

export const router = express.Router();

router.get('/', (req, res) => {
	if (req.user !== undefined) {
		return res.redirect('/?error=already_logged_in');
	}

	const validate = schemas.compileFile(
		'./schemas/routes/auth/reset/get-request.json'
	);
	if (!validate(req.query)) {
		return res.status(400).render('error', {code: 400});
	}
	const body: GetRequest = req.query as any;

	res.render('auth/reset', {
		csrfToken: req.csrfToken(),
		resetToken: body.token,
	});
});

router.post('/', async (req, res) => {
	if (req.user !== undefined) {
		return res.redirect('/?error=already_logged_in');
	}

	const validate = schemas.compileFile(
		'./schemas/routes/auth/reset/post-request.json'
	);
	if (!validate(req.body)) {
		return res.status(400).render('error', {code: 400});
	}
	const body: PostRequest = req.body as any;

	if ('email' in body) {
		// Send an email with a reset link to the user
		const userExists = (
			await db.query<{exists: boolean}>(
				`
					SELECT EXISTS(
						SELECT 1
						FROM "users"
						WHERE "email" = $1
					)
				`,
				[body.email]
			)
		).rows[0].exists;
		if (!userExists) {
			return res.redirect('/auth/reset?error=user_does_not_exist');
		}

		const resetToken = (
			await db.query<Pick<UsersRow, 'reset_token'>>(
				`
					UPDATE "users"
					SET "reset_token" = GEN_RANDOM_UUID()
					WHERE "email" = $1
					RETURNING "reset_token"
				`,
				[body.email]
			)
		).rows[0].reset_token;

		// TODO: Send the email

		return res.redirect('/auth/login?info=reset_link_sent');
	} else if ('password' in body) {
		const email = (
			await db.query<Pick<UsersRow, 'email'>>(
				`
					SELECT "users"."email"
					FROM "users"
					WHERE (
						"users"."reset_token" = $1 AND
						AGE(CURRENT_TIMESTAMP, "users"."reset_token_created_at") <= INTERVAL '1 day'
					)
					LIMIT 1
				`,
				[body.reset_token]
			)
		).rows.shift()?.email;
		if (email === undefined) {
			return res.redirect('/auth/reset/?error=invalid_link');
		}

		await db.query(
			`
				UPDATE "users"
				SET
					"password" = CRYPT($1, GEN_SALT('bf')),
					"reset_token" = NULL
				WHERE "email" = $2
			`,
			[body.password, email]
		);

		return res.redirect('/auth/login?info=password_changed');
	}
});
