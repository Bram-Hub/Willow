import * as express from 'express';

import * as schemas from 'server/util/schemas';
import {PostRequest} from 'types/routes/auth/reset/post-request';

export const router = express.Router();

router.get('/', (req, res) => {
	res.render('auth/reset');
});

router.post('/', async (req, res) => {
	const validate = schemas.compileFile(
		'./schemas/routes/auth/reset/post-request.json'
	);
	if (!validate(req.body)) {
		return res.status(400).render('error', {code: 400});
	}
	const body: PostRequest = req.body as any;

	res.redirect('/auth/reset');
});
