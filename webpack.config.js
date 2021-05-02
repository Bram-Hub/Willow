const dotenv = require('dotenv');
dotenv.config();

const path = require('path');
const webpack = require('webpack');

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
		alias: {
			vue$:
				process.env.NODE_ENV === 'production'
					? 'vue/dist/vue.esm-browser.prod.js'
					: 'vue/dist/vue.esm-browser.js',
		},
	},
	plugins: [
		new webpack.DefinePlugin({
			__VUE_OPTIONS_API__: true,
			__VUE_PROD_DEVTOOLS__: false,
		}),
	],
	output: {
		path: path.join(__dirname, 'public/js/'),
		filename: '[name].js',
		libraryTarget: 'var',
		library: 'Willow',
	},
};
