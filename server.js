// import environment variables from .env into process.env
require("dotenv").config();

const express = require("express");

// initialize express application
const app = express();
// use Pug.js as the template engine for the application
app.set("view engine", "pug");
// expose the /public directory and its contents to clients, if necessary
app.use(express.static(__dirname + "/public"));

// configure routing for application
app.get("/", (req, res) => res.send("Hello world"));

// launch server on configured ports, enable HTTP redirect if the HTTP port is present
const ports = { http: process.env.HTTP_PORT, https: process.env.HTTPS_PORT };

if (ports.http) {
    // TODO: HTTP redirect
}
app.listen(ports.https, () => console.log("Server launched on port " + ports.https));