import * as express from 'express';

/**
 * GET /auth/login
 * @param req the request sent from the client
 * @param res the response sent back to the client
 */
export function get(req: express.Request, res: express.Response) {
	if (req.user !== undefined) {
		return res.redirect('/?error=already_logged_in');
	}

	res.render('auth/login', {csrfToken: req.csrfToken()});
}
