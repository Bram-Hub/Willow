Willow
------
A web application used for building and assigning truth trees.

You may use Willow at the following URL: [https://willow.bramhub.com](https://willow.bramhub.com)

Completely rewritten and revitalized by
[Connor Roizman](https://github.com/connorjayr),
[Eli Schiff](https://github.com/elihschiff), and
[Jeff Putlock](https://github.com/jputlock).

### How to Use
See our [User's Manual](userguide.md).

### Installation

1. Clone the repository via `git clone https://github.com/Bram-Hub/Willow.git`.

2. Install `nodejs` version 14+ and install project dependencies via `npm ci` from the project root
directory.

3. Install `postgresql` and start the service. Set up the Willow database via the following steps:
    1. Open a Postgres interactive shell as the `postgres` user:
    `sudo -iu postgres; psql -U postgres`

    2. Set up the Postgres user `willow_user` and the `willow` database:
        ``` 
        CREATE ROLE willow_user WITH LOGIN PASSWORD 'your_password_here';
        CREATE DATABASE willow WITH OWNER willow_user;
        \connect willow;
        CREATE EXTENSION pgcrypto;
        ```

    3. (OPTIONAL) Edit `/etc/postgresql/VERSION_NUMBER/main/pg_hba.conf` to allow users other
    than `postgres` to log in to the `willow_user` role in postgres.
    
    4. Exit the `postgres` shell and navigate to the root directory of the Willow
    repository. Set up the new database as `willow_user` using
    `psql -U willow_user -W willow < setup.sql`


4. Create an env file `cp .env.template .env` and configure the following options

    Variable|Description
    --- | ---
    NODE_ENV|The environment in which this application is being run. The possible values are `development` and `production`
    HTTPS|If the program is being run on an https server
    PORT|The port to launch the program on
    BASE_URL|The base url for example "http://localhost:8080"
    PGHOST|The PostgreSQL host to connect to
    PGUSER|The PostgreSQL user to log in as
    PGDATABASE|The PostgreSQL database to use
    PGPASSWORD|The password for the account specified by PGUSER
    PGPORT|The port that the database is hosted on

5. Create a config file `cp config.yml.template config.yml` to configure your list of system administrators.

6. Launch the application using `npm run <command>` with one of the commands in the table below.

    Command |Use
    --- | ---
    `debug`|Recommended for development. Uses nodemon to recompile the code when changes are made.
    `dev`|Runs the program once. Must be restarted when changes are made
    `build`|Builds the website in production mode
    `start`|Runs the built program
