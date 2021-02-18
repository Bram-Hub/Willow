const dotenv = require('dotenv');
dotenv.config();

const path = require('path');

module.exports = {
	mode: process.env.NODE_ENV,
	entry: {
		index: './src/client/index.ts',
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
	},
	output: {
		filename: '[name].js',
		path: path.join(__dirname, 'public/js/'),
	},
};
