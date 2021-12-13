require('dotenv').config();

const path = require('path');
const webpack = require('webpack');

module.exports = env => {
	const NODE_ENV = process.env.NODE_ENV || env.NODE_ENV || 'production';
	const config = {
		mode: NODE_ENV,
		entry: {
			index: './src/client/index.ts',
			settings: './src/client/settings.ts',
			theme: './src/client/theme.ts',
			toolbar: './src/client/toolbar.ts',
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
					NODE_ENV === 'development'
						? 'vue/dist/vue.esm-browser.js'
						: 'vue/dist/vue.esm-browser.prod.js',
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
			library: '[name]',
		},
	};
	if (NODE_ENV === 'development') {
		// Include source maps for debugging if the application is in development mode
		config.devtool = 'eval-source-map';
	}
	return config;
};
