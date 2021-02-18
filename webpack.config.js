const dotenv = require('dotenv');
dotenv.config();

const path = require('path');

module.exports = {
	mode: process.env.NODE_ENV,
	entry: {
		index: './src/client/index.ts',
	},
	output: {
		filename: '[name].js',
		path: path.join(__dirname, 'public/js/'),
	},
};
