import * as express from 'express';

import * as schemas from 'server/util/schemas';
import {pool as db} from 'server/util/database';
import {GetRequest} from 'types/routes/auth/reset/get-request';
import {PostRequest} from 'types/routes/auth/reset/post-request';
import {UsersRow} from 'types/sql/public';

export const router = express.Router();

router.get('/', (req, res) => {
	const validate = schemas.compileFile(
		'./schemas/routes/auth/reset/get-request.json'
	);

	if (!validate(req.body)) {
		return res.render('auth/reset', {csrfToken: req.csrfToken()});
	}
	const body: GetRequest = req.body as any;

	res.render('auth/reset', {
		csrfToken: req.csrfToken(),
		uuidToken: body.token,
	});
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
			// TODO: Make this more user-friendly / apparent to user
			return res.redirect('/auth/reset/?error=email_not_found');
		}

		// TODO: Generate a unique token and store it in the db

		const tokenContainer = (
			await db.query<Pick<UsersRow, 'reset_token'>>(
				`
					UPDATE "users"
					SET "reset_token" = GEN_RANDOM_UUID(), "reset_token_created_at" = CURRENT_TIMESTAMP
					WHERE "users"."email" = $1
					RETURNING "reset_token"
				`,
				[body.email]
			)
		).rows[0];

		// TODO: Send the email

		// TODO: Make this more user-friendly / apparent to user
		return res.redirect('/auth/login');
	}

	if (Object.keys(body).includes('password')) {
		let email;
		if (req.user !== undefined) {
			// If user is logged in, use that account
			email = req.user.email;
		} else {
			if (!Object.keys(req.query).includes('token')) {
				return res.redirect('/auth/reset/?error=no_token');
			}
			// Otherwise, require a token
			const token = req.query['token'] as string;

			const emails: Pick<UsersRow, 'email'>[] = (
				await db.query(
					`
						SELECT "users"."email"
						FROM "users"
						WHERE (
							"users"."reset_token" = $1 AND
							AGE(CURRENT_TIMESTAMP, "users"."reset_token_created_at") <= INTERVAL '1 day'
						)
					`,
					[token]
				)
			).rows;

			if (emails.length !== 1) {
				return res.redirect('/auth/reset/?error=token_invalid');
			}

			email = emails[0].email;
		}

		// Set the new password in the db
		await db.query(
			`
				UPDATE "users"
				SET "password"=CRYPT($2, GEN_SALT('bf'))
				WHERE "users"."email" = $1
			`,
			[email, body.password]
		);

		// TODO: Make this more user-friendly / apparent to user
		if (req.user === undefined) {
			return res.redirect('/auth/login');
		}
		return res.redirect('/?info=password_changed');
	}

	res.redirect('/auth/reset/?error=unknown_request');
});
