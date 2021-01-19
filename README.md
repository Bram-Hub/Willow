Willow
------
A web application used for building and assigning truth trees.

### Installation

1. Clone the repository by executing `git clone https://github.com/connorjayr/Willow.git`.

2. Install [PostgreSQL](https://www.postgresql.org/).

3. Install project dependencies by executing `npm install` from the project root directory.

4. Copy `.env-template` to `.env` and populate the environment variables.
<table>
  <thead>
    <tr>
      <th>Variable</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>BASE_URL</td>
      <td>The URL of the website homepage; e.g., <code>http://localhost</code>.</td>
    </tr>
    <tr>
      <td>HTTP_PORT</td>
      <td>The port of the HTTP web server, if one is to be launched. If both <code>HTTP_PORT</code> and <code>HTTPS_PORT</code> are specified, then this is the port for the HTTPS redirect. (Leave blank if deploying to Heroku)
    </tr>
    <tr>
      <td>HTTPS_PORT</td>
      <td>The port of the HTTPS web server, if one is to be launched. If specified, a valid certificate must be located in <code>cert/</code>. (Leave blank if deploying to Heroku)
    </tr>
    <tr>
      <td>NODE_ENV</td>
      <td>
        The environment in which this application is being run.
        The possible values are:
        <ul>
          <li><code>development</code>: If the server is being run in a development setting</li>
          <li><code>production</code>: If the server is being run in a production setting</li>
        </ul>
    </tr>
    <tr>
      <td>PGHOST</td>
      <td>The address of the PostgreSQL database.</td>
    </tr>
    <tr>
      <td>PGDATABASE</td>
      <td>The name of the PostgreSQL database.</td>
    </tr>
    <tr>
      <td>PGUSER</td>
      <td>The user used to authenticate when accessing the PostgreSQL database.</td>
    </tr>
    <tr>
      <td>PGPASSWORD</td>
      <td>The password used to authenticate when accessing the PostgreSQL database.</td>
    </tr>
    <tr>
      <td>SESSION_SECRET</td>
      <td>The secret string used to securely store sessions. The string is arbitrary, but should be kept private.</td>
    </tr>
    <tr>
      <td>SMTP_SERVICE</td>
      <td>
        The SMTP service used for sending emails; e.g., <code>gmail</code>.
        <br>
        <br>
        <strong>NOTE:</strong> If <code>gmail</code> is used as the SMTP service, then you must enable insecure logins on the Google account settings page.
        For more information, run the application and see the link provided in the error message once authentication fails.
      </td>
    </tr>
    <tr>
      <td>SMTP_USER</td>
      <td>The user used to authenticate to the SMTP server.</td>
    </tr>
    <tr>
      <td>SMTP_PASS</td>
      <td>The password used to authenticate to the SMTP server.</td>
    </tr>
  </tbody>
</table>

5. Install database extensions by executing `echo "CREATE EXTENSION pgcrypto; CREATE EXTENSION uuid-ossp;" | psql -U postgres <PGDATABASE>`, where `<PGDATABASE>` is the value of the corresponding environment variable found in `.env`.

6. Prepare the database for storing login sessions by executing `cat node_modules/connect-pg-simple/table.sql | psql -U <PGUSER> <PGDATABASE>`, where `<PGUSER>` and `<PGDATABASE>` are the values of the corresponding environment variables found in `.env`.

7. Launch the application by executing `node server.js`.
