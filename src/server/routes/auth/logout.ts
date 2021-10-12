import * as express from 'express';

/**
 * GET /auth/logout
 * @param req the request sent from the client
 * @param res the response sent back to the client
 */
export function get(req: express.Request, res: express.Response) {
	req.logOut();
	res.redirect('/');
}
