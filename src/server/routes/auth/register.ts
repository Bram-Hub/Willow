import * as express from 'express';

/**
 * GET /auth/register
 * @param req the request sent from the client
 * @param res the response sent back to the client
 */
export function get(req: express.Request, res: express.Response) {
	res.render('auth/register');
}

/**
 * POST /auth/register
 * @param req the request sent from the client
 * @param res the response sent back to the client
 */
export function post(req: express.Request, res: express.Response) {}
