const fs = require('fs');
const pg = require('pg');

exports.pool = new pg.Pool();

/**
 * Executes a SQL script.
 * @param {string} path the path to the script
 */
async function execScript(path) {
  let contents = '';
  try {
    contents = fs.readFileSync(path).toString();
  } catch (err) {
    console.error(`[ERROR] in db.js: could not open file "${path}"`);
    console.error(err);
    return;
  }
  // Remove newline characters from the file contents
  contents.replace(/[\r\n]/g, '');

  for (const query of contents.split(';')) {
    // Execute each query in the file
    await exports.pool.query(query);
  }
}

/**
 * Executes the setup script for the database before the database is accessed by
 * the application.
 */
async function setup() {
  execScript('./setup.sql');
}
setup();
