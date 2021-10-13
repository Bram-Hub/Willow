import * as express from 'express';

export const router = express.Router();

router.get('/', (req, res) => {
	req.logOut();
	res.redirect('/');
});
