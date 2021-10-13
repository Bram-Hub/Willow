import * as express from 'express';

export const router = express.Router();

router.get('/', (req, res) => {
	res.render('preferences');
});

router.post('/', (req, res) => {
	res.redirect('/preferences');
});
