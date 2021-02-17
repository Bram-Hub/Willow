import * as fs from 'fs';
import * as yaml from 'yaml';

export const config = yaml.parse(fs.readFileSync('config.yml').toString());
