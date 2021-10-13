// Assigns variables in .env to process.env. This must be done before any other
// files are imported, since those files may require environment variables.
import * as dotenv from 'dotenv';
dotenv.config();

import * as connectPgSimple from 'connect-pg-simple';
import * as csurf from 'csurf';
import * as express from 'express';
import * as session from 'express-session';
import * as fs from 'fs';
import {isHttpError} from 'http-errors';
import * as https from 'https';
import * as morgan from 'morgan';
import * as passport from 'passport';
import {Strategy as LocalStrategy} from 'passport-local';
import * as path from 'path';

import {logger} from './logger';
import * as assignments from './routes/assignments';
import * as auth from './routes/auth';
import * as courses from './routes/courses';
import * as index from './routes/index';
import * as submissions from './routes/submissions';
import db from './util/database';

/**
 * A singleton class representing the web server.
 */
class Server {
	app: express.Application;
	server: express.Application | https.Server;

	/**
	 * Constructs the web server.
	 */
	constructor() {
		this.app = express();

		if (process.env.HTTPS === 'true') {
			if (!fs.existsSync('cert/cert.key') || !fs.existsSync('cert/cert.pem')) {
				throw new Error(
					'cannot locate HTTPS certificate at cert/cert.key and cert/cert.pem'
				);
			}
			this.server = https.createServer(
				{
					key: fs.readFileSync('cert/cert.key'),
					cert: fs.readFileSync('cert/cert.pem'),
				},
				this.app
			);
		} else {
			this.server = this.app;
		}

		this.configure();
		this.registerRoutes();
	}

	/**
	 * Configures the web server, which includes adding middleware.
	 */
	private configure() {
		// Append logs to logs/access.log
		const accessLogStream = fs.createWriteStream('logs/access.log', {
			flags: 'a',
		});
		this.app.use(morgan('common', {stream: accessLogStream}));

		// Parses the body of POST requests into req.body
		this.app.use(express.urlencoded({extended: true}));
		this.app.use(express.json());

		const sessionSecret = process.env.SESSION_SECRET;
		if (sessionSecret === undefined || sessionSecret.length === 0) {
			throw new Error('environment variable SESSION_SECRET is undefined');
		}
		// Use database for session storage
		this.app.use(
			session({
				store: new (connectPgSimple(session))({pool: db}),
				cookie: {
					sameSite: 'strict',
					secure: process.env.HTTPS === 'true',
				},
				resave: false,
				saveUninitialized: false,
				secret: sessionSecret as string,
			})
		);

		this.configurePassport();

		this.app.use(csurf());

		// Use Pug.js as the template engine
		this.app.set('view engine', 'pug');
		this.app.set('views', 'views/');
		this.app.locals.basedir = 'views/';
		this.app.locals.env = {...process.env};
	}

	/**
	 * Configures Passport.js, which manages authentication, for this web server.
	 */
	private configurePassport() {
		passport.use(
			new LocalStrategy(
				{usernameField: 'email'},
				(username, password, done) => {
					db.query(
						`
							SELECT "email", "first_name", "last_name", "rcs_id"
							FROM "users"
							WHERE "email" = $1 AND "password" = CRYPT($2, "password")
						`,
						[username, password],
						(err, result) => {
							if (err) {
								return done(err);
							}
							const rows: Express.User[] = result.rows;
							if (rows.length === 0) {
								return done(null, false);
							}
							return done(null, rows[0]);
						}
					);
				}
			)
		);

		passport.serializeUser((user, done) => {
			done(null, user.email);
		});
		passport.deserializeUser((id, done) => {
			db.query(
				`
					SELECT "email", "first_name", "last_name", "rcs_id"
					FROM "users"
					WHERE "email" = $1
				`,
				[id],
				(err, result) => {
					done(err, result.rows.length > 0 ? result.rows[0] : false);
				}
			);
		});

		this.app.use(passport.initialize());
		this.app.use(passport.session());

		this.app.use((req, res, next) => {
			res.locals._user = req.user;
			next();
		});
	}

	private registerRoutes() {
		// Expose the public/ directory to clients
		this.app.use(express.static('public/'));
		// Expose packages in node_modules/ to clients
		const packagesToExpose: string[] = [];
		for (const pkg of packagesToExpose) {
			this.app.use(
				`/pkg/${pkg}`,
				express.static(path.join('node_modules/', pkg))
			);
		}

		// Main page
		this.app.get('/', index.get);

		// Authentication
		this.app.get('/auth/login', auth.login.get);
		this.app.post(
			'/auth/login',
			passport.authenticate('local', {
				failureRedirect: '/auth/login?error=invalid_credentials',
				successRedirect: '/',
			})
		);
		this.app.get('/auth/logout', auth.logout.get);
		this.app.get('/auth/register', auth.register.get);
		this.app.post('/auth/register', auth.register.post);

		// Courses
		this.app.get('/courses', courses.get);

		// Assignments
		this.app.get('/assignments', assignments.get);

		// Submissions
		this.app.post(
			'/courses/:courseName/assignments/:assignmentName',
			submissions.post
		);

		// 404
		this.app.get('*', (req, res) =>
			res.status(404).render('error', {code: 404})
		);

		this.app.use(
			(
				err: Error,
				req: express.Request,
				res: express.Response,
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				next: express.NextFunction
			) => {
				logger.error(`${req.method} ${req.path}`);
				logger.error(err);
				if (isHttpError(err)) {
					res.status(err.status).render('error', {code: err.status});
				} else {
					res.status(500).render('error', {code: 500});
				}
			}
		);
	}

	/**
	 * Launches the web server.
	 */
	launch() {
		const port = parseInt(process.env.PORT || '80');
		this.server.listen(port, () =>
			logger.info(`Server launched on port ${port}`)
		);
	}
}

new Server().launch();
