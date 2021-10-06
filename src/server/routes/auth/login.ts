import * as express from 'express';

/**
 * GET /auth/login
 * @param req the request sent from the client
 * @param res the response sent back to the client
 */
export function get(req: express.Request, res: express.Response) {
	res.render('auth/login');
}

/**
 * POST /auth/login
 * @param req the request sent from the client
 * @param res the response sent back to the client
 */
export function post(req: express.Request, res: express.Response) {}
