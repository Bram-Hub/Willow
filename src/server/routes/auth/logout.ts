import * as express from 'express';

export const router = express.Router();

router.get('/', (req, res, next) => {
	req.logOut((err) => {
		if (err) {
			return next(err);
		}
		res.redirect('/');
	});
});
