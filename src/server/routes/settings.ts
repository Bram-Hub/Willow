import * as express from 'express';

export const router = express.Router();

router.get('/', (req, res) => {
	res.render('settings');
});

router.post('/', (req, res) => {
	res.redirect('/settings');
});
