Willow
------
A web application used for building and assigning truth trees.

Completely rewritten and revitalized by
[Connor Roizman](https://github.com/connorjayr),
[Eli Schiff](https://github.com/elihschiff), and
[Jeff Putlock](https://github.com/jputlock).

### How to Use
See our [User's Manual](userguide.md).

### Installation

1. Clone the repository via `git clone https://github.com/connorjayr/Willow.git`.

2. Install project dependencies via `npm ci` from the project root directory.

3. Create an env file `cp .env.template .env`

Variable|Description
--- | ---
NODE_ENV|The environment in which this application is being run. The possible values are `development` and `production`
HTTPS|If the program is being run on an https server
PORT|The port to launch the program on.

5. Launch the application using `npm run <command>` with one of the commands in the table below.

Command |Use
--- | ---
`debug`|Recommended for development. Uses nodemon to recompile the code when changes are made.
`dev`|Runs the program once. Must be restarted when changes are made
`build`|Builds the website in production mode
`start`|Runs the built program
