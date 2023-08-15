const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
	entry: './editor/script.js',
	output: {
		path: path.resolve(__dirname, 'public'),
		filename: 'bundle.js'
	},
	optimization: {
		usedExports: true,
		minimize: true,
		minimizer: [new TerserPlugin({
			terserOptions: {
				ecma: 2016,
				module: true,
			},
		}),],
	},
	mode: 'production',
	plugins: [
		new CopyWebpackPlugin({
			patterns: [
				{ from: './editor/style.css', to: 'style.css' }
			],
		}),
	]
};