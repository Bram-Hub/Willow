// Import environment variables from .env into process.env
require('dotenv').config();

const auth = require('./auth/main');
const db = require('./util/db');
const index = require('./routes/index');
const middleware = require('./util/middleware');

const bodyParser = require('body-parser');
const express = require('express');
const session = require('express-session');
const Store = require('connect-pg-simple')(session);

/**
 * Configures an Express application.
 * @param {express.app} app the application
 */
function configureApp(app) {
  // Use Pug.js as the template engine
  app.set('view engine', 'pug');
  // Retrieve templates from the views/ directory
  app.set('views', 'views/');
  // Set base directory for Pug.js to the current working directory
  app.locals.basedir = __dirname;
  // Expose the /public directory and its contents to clients, if necessary
  app.use(express.static(__dirname + '/public'));

  app.use(session({
    cookie: {secure: process.env.HTTPS_PORT ? true : false},
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET,
    store: new Store({pool: db.pool}),
  }));

  // Parse urlencoded and application/json requests
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(bodyParser.json());

  app.use(middleware.injectLocals);
}

/**
 * Launches the Express application on the provided port(s), and launches an
 * HTTP redirect server if an HTTPS web server is launched.
 * @param {express.app} app the application
 * @param {object} ports an object containing the port(s) on which to launch
 *     the application
 * @param {number} [ports.http] the port on which to launch the HTTP web
 *     server, or the HTTPS redirect server if `ports.https` is defined
 * @param {number} [ports.https] the port on which to launch the HTTPS web
 *     server
 */
function launchServer(app, ports) {
  if (ports.http && ports.https) {
    // If both HTTP and HTTPS ports are provided, launch an HTTP redirect server
    require('http').createServer((req, res) => {
      res.writeHead(301, {Location: 'https://' + req.headers.host + req.url});
      res.end();
    }).listen(ports.http);
  } else if (ports.http) {
    app.listen(
        ports.http,
        () => console.log('[INFO] server launched on port ' + ports.http),
    );
  }
  if (ports.https) {
    require('https').createServer({
      // TODO: Retrieve HTTPS certificate
    }, app).listen(
        ports.https,
        () => console.log('[INFO] server launched on port ' + ports.https),
    );
  }
}

// Initialize Express application
const app = express();
configureApp(app);

// Configure web server routes
app.get('/', index.get);
app.get('/assignments', (req, res) => res.render('assignments'));
app.get('/auth/login', auth.login.get);
app.post('/auth/login', auth.login.post);
app.get('/auth/logout', auth.logout);
app.get('/auth/register', auth.register.get);
app.post('/auth/register', auth.register.post);
app.get('/auth/reset', auth.reset);
// Fallback to 404 error
app.get('*', (req, res) => res.status(404).render('404'));

if (!process.env.HTTP_PORT && !process.env.HTTPS_PORT) {
  // If no ports were configured for the web server, then exit the application
  console.error(
      '[ERROR] in server.js: no ports configured for web server, see ' +
          '.env-template',
  );
  process.exit(1);
}

// Read the web server ports from .env
const ports = {http: process.env.HTTP_PORT, https: process.env.HTTPS_PORT};
launchServer(app, ports);
