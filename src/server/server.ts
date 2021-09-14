// Assigns variables in .env to process.env. This must be done before any other
// files are imported, since those files may require environment variables.
import * as dotenv from 'dotenv';
dotenv.config();

import {execSync} from 'child_process';
import * as express from 'express';
import * as fs from 'fs';
import * as https from 'https';
import * as morgan from 'morgan';
import * as path from 'path';

import {logger} from './logger';

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
					'Could not locate HTTPS certificate at cert/cert.key and cert/cert.pem.'
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
		const accessLogStream = fs.createWriteStream('logs/access.log', {
			flags: 'a',
		});
		this.app.use(morgan('common', {stream: accessLogStream}));

		// Parses the body of POST requests into req.body
		this.app.use(express.urlencoded({extended: true}));
		this.app.use(express.json());

		// Use Pug.js as the template engine
		this.app.set('view engine', 'pug');
		this.app.set('views', 'views/');
		this.app.locals.basedir = 'views/';
		this.app.locals.env = {...process.env};
	}

	private registerRoutes() {
		// Expose the public/ directory to clients
		this.app.use(express.static('public/'));
		// Expose packages in node_modules/ to clients
		const packagesToExpose = ['bootstrap'];
		for (const pkg of packagesToExpose) {
			this.app.use(
				`/pkg/${pkg}`,
				express.static(path.join('node_modules/', pkg))
			);
		}

		this.app.get('/', (req, res) =>
			res.render('index', {
				commit:
					process.env.HEROKU_SLUG_COMMIT ||
					execSync('git rev-parse HEAD').toString().trim(),
			})
		);
		this.app.get('*', (req, res) => res.render('error', {code: 404}));
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
