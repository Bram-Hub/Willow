const fs = require('fs');
const pg = require('pg');

exports.pool = new pg.Pool();

/**
 * Executes the setup script for the database before the database is accessed by
 * the application.
 */
async function setup() {
  let contents = '';
  try {
    contents = fs.readFileSync('./setup.sql').toString();
  } catch (err) {
    console.error('[ERROR] in db.js: could not open file "setup.sql"');
    console.error(err);
    return;
  }
  // Remove newline characters from the file contents
  contents.replace(/[\r\n]/g, '');

  for (const query of contents.split(';')) {
    // Execute each query in the file
    exports.pool.query(query);
  }
}
setup();
