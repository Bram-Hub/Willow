import * as express from 'express';
import * as passport from 'passport';

export const router = express.Router();

router.get('/', (req, res) => {
	if (req.user !== undefined) {
		return res.redirect('/?error=already_logged_in');
	}

	res.render('auth/login', {csrfToken: req.csrfToken()});
});

router.post(
	'/',
	passport.authenticate('local', {
		failureRedirect: '/auth/login?error=invalid_credentials',
		successRedirect: '/',
	})
);
