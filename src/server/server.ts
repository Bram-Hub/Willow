// Assigns variables in .env to process.env. This must be done before any other
// files are imported, since those files may require environment variables.
import * as dotenv from 'dotenv';
dotenv.config();

import * as bodyParser from 'body-parser';
import {execSync} from 'child_process';
import * as express from 'express';
import * as fs from 'fs';
import * as https from 'https';
import * as morgan from 'morgan';
import * as path from 'path';
import {performance} from 'perf_hooks';

import {logger} from './logger';
import {TruthTree} from '../common/tree';

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
		this.app.use(bodyParser.urlencoded({extended: true}));
		this.app.use(bodyParser.json());

		// Use Pug.js as the template engine
		this.app.set('view engine', 'pug');
		this.app.set('views', 'views/');
		this.app.locals.basedir = 'views/';
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
				commit: process.env.HEROKU_SLUG_COMMIT || execSync('git rev-parse HEAD').toString().trim(),
			})
		);
		this.app.get('*', (req, res) => res.render('error', {code: 404}));
	}

	/**
	 * Launches the web server.
	 */
	launch() {
		const port = parseInt(process.env.PORT || '80');
		console.log("Port: ", port)
		console.log("Port: ", process.env.PORT)
		this.server.listen(port, () =>
			logger.info(`Server launched on port ${port}`)
		);
	}
}

new Server().launch();

function runTest(testName: string) {
	const testTree = TruthTree.deserialize(
		fs.readFileSync(`tests/${testName}.yew`).toString()
	);
	testTree.printTree();
	const start = performance.now();
	const isCorrect = testTree.isCorrect();
	const elapsed = (performance.now() - start) / 1000;
	console.log(
		`${testName}: ${
			Object.keys(isCorrect).length === 0
		} (took ${elapsed.toFixed(5)} seconds)`
	);
	return elapsed;
}

// const tests = [
// 	'eli1',
// 	'ben1',
// 	'ben2',
// 	'ben3',
// 	'ben4',
// 	'connor1',
// 	'connor2',
// 	'connor3',
// 	'jeff1',
// 	'3a',
// ];

// const NUM_TESTS = 10;
// for (const test of tests) {
// 	let avg = 0;
// 	for (let i = 0; i < NUM_TESTS; ++i) {
// 		avg += runTest(test);
// 	}
// 	avg /= NUM_TESTS;
// 	console.log(`${test} averaged ${avg.toFixed(5)} seconds.`);
// }
