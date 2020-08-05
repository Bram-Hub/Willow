const fs = require('fs');

/**
 * Parses the local configuration file located at ./config.json.
 * 
 * @return an object containing the configuration values
 */
function parse() {
  if (!fs.existsSync('config.json')) {
    console.error('[ERROR] could not open configuration file "config.json"');
  }
  const tmp = fs.readFileSync('config.json').toString();
  return JSON.parse(tmp);
}
module.exports = parse();
