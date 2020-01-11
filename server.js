// import environment variables from .env into process.env
require("dotenv").config();

const express = require("express");

/**
 * Configures properties for an Express application.
 * 
 * @param {express.app} app the Express application to configure
 */
function configureApp(app) {
  // use Pug.js as the template engine
  app.set("view engine", "pug");
  // retrieve templates from the views/ directory
  app.set("views", "views/");
  // set base directory for Pug.js to the current working directory
  app.locals.basedir = __dirname;
  // expose the /public directory and its contents to clients, if necessary
  app.use(express.static(__dirname + "/public"));
}

/**
 * Launches the Express application on the provided port(s), and launches an HTTP
 * redirect server (if applicable).
 * 
 * @param {express.app} app the Express application to launch
 * @param {object} ports an object containing the port(s) on which to launch the
 * application
 */
function launchServer(app, ports) {
  if (ports.http && ports.https) {
    require("http").createServer((req, res) => {
      res.writeHead(301, { Location: "https://" + req.headers.host + req.url });
      res.end();
    }).listen(ports.http);
  } else if (ports.http) {
    app.listen(
        ports.http, () => console.log("Server launched on port " + ports.http)
    );
  }
  if (ports.https) {
    require("https").createServer({
      // TODO: retrieve HTTPS certificate
    }, app).listen(
        ports.https, () => console.log("Server launched on port " + ports.https)
    );
  }
}

// initialize Express application
const app = express();
configureApp(app);

// configure routing for application
app.get("/", (req, res) => res.render("index"));
// lowest priority request matches everything and returns a 404 error
app.get("*", (req, res) => res.status(404).render("404"));

if (!process.env.HTTP_PORT && !process.env.HTTPS_PORT) {
  console.error(
      "[ERROR] no ports configured for web server, see .env-template"
  );
  process.exit(1);
}

// get server ports from .env
const ports = { http: process.env.HTTP_PORT, https: process.env.HTTPS_PORT };
launchServer(app, ports);
